import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import Decimal from 'decimal.js';
import crypto from 'crypto';

function toNumber(d: Decimal | null | undefined): number {
  return d ? Number(d) : 0;
}

export const paymentCollectionsService = {
  async list(params: { page?: number; pageSize?: number; repId?: number; customerId?: number; status?: string }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 100;
    const where: any = {};
    if (params.repId) where.repId = Number(params.repId);
    if (params.customerId) where.customerId = Number(params.customerId);
    if (params.status) where.status = params.status;
    const [items, total] = await Promise.all([
      prisma.paymentCollection.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.paymentCollection.count({ where }),
    ]);
    return {
      items: items.map(c => ({ ...c, amount: toNumber(c.amount) })),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async getPendingSettlement(repId: number) {
    const collection = await prisma.paymentCollection.findFirst({
      where: { repId, status: 'pending', type: 'rep_settlement' },
      orderBy: { date: 'desc' },
    });
    return collection ? { ...collection, amount: toNumber(collection.amount) } : null;
  },

  async create(data: { repId: number; amount: number; method: string; status?: string; type?: string; date?: number }) {
    const collectionNumber = `COL-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const collection = await prisma.paymentCollection.create({
      data: {
        collectionNumber,
        repId: data.repId,
        amount: new Decimal(data.amount),
        method: data.method as any,
        status: (data.status as any) || 'pending',
        type: (data.type as any) || 'customer',
        date: data.date ? new Date(data.date) : new Date(),
      },
    });
    return { ...collection, amount: toNumber(collection.amount) };
  },

  async update(id: number, data: { status?: string }) {
    const existing = await prisma.paymentCollection.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Collection not found');
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.status === 'confirmed') updateData.confirmedDate = new Date();
    const updated = await prisma.paymentCollection.update({
      where: { id },
      data: updateData,
    });
    return { ...updated, amount: toNumber(updated.amount) };
  },
};
