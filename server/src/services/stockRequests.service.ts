import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

export const stockRequestsService = {
  async listStockRequests(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    repId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, pageSize = 10, search, status, repId, sortBy, sortOrder } = params;
    const where: Prisma.StockRequestWhereInput = { deletedAt: null };

    if (search) {
      where.OR = [
        { rep: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status as any;
    }

    if (repId) {
      where.repId = Number(repId);
    }

    const orderBy: Prisma.StockRequestOrderByWithRelationInput = {};
    if (sortBy === 'date') orderBy.date = sortOrder;
    else if (sortBy === 'status') orderBy.status = sortOrder;
    else if (sortBy === 'repId') orderBy.repId = sortOrder;
    else orderBy.date = 'desc';

    const [items, total] = await Promise.all([
      prisma.stockRequest.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { rep: true, items: { include: { item: true } } },
      }),
      prisma.stockRequest.count({ where }),
    ]);

    return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  },

  async getStockRequest(id: number) {
    const request = await prisma.stockRequest.findUnique({
      where: { id },
      include: { rep: true, items: { include: { item: true } } },
    });
    if (!request || request.deletedAt) throw new AppError(404, 'Stock request not found');
    return request;
  },

  async createStockRequest(data: {
    repId: number;
    items: { itemId: number; quantity: number; sellingPrice?: number | null }[];
    status?: string;
    date?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.stockRequest.create({
        data: {
          requestNumber: `SR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          repId: data.repId,
          status: (data.status as any) || 'pending',
          date: data.date ? new Date(data.date) : undefined,
          items: {
            create: data.items.map((item) => ({
              itemId: item.itemId,
              quantity: new Decimal(item.quantity),
              sellingPrice: item.sellingPrice != null ? new Decimal(item.sellingPrice) : null,
            })),
          },
        },
        include: { rep: true, items: { include: { item: true } } },
      });

      return request;
    });
  },

  async updateStockRequest(
    id: number,
    data: Partial<{
      repId: number;
      items: { itemId: number; quantity: number; sellingPrice?: number | null }[];
      status: string;
      date: string;
    }>
  ) {
    const request = await prisma.stockRequest.findUnique({ where: { id } });
    if (!request || request.deletedAt) throw new AppError(404, 'Stock request not found');

    return prisma.$transaction(async (tx) => {
      const updateData: Prisma.StockRequestUpdateInput = {};
      if (data.repId !== undefined) (updateData as any).repId = data.repId;
      if (data.status !== undefined) updateData.status = data.status as any;
      if (data.date !== undefined) updateData.date = new Date(data.date);

      if (data.items) {
        await tx.stockRequestItem.deleteMany({ where: { requestId: id } });
        updateData.items = {
          create: data.items.map((item) => ({
            itemId: item.itemId,
            quantity: new Decimal(item.quantity),
            sellingPrice: item.sellingPrice != null ? new Decimal(item.sellingPrice) : null,
          })),
        };
      }

      return tx.stockRequest.update({
        where: { id },
        data: updateData,
        include: { rep: true, items: { include: { item: true } } },
      });
    });
  },

  async softDelete(id: number, reason: string, userId: number, username: string) {
    const request = await prisma.stockRequest.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!request || request.deletedAt) throw new AppError(404, 'Stock request not found');

    const [deleted] = await prisma.$transaction([
      prisma.stockRequest.update({
        where: { id },
        data: { deletedAt: new Date(), deleteReason: reason },
      }),
      prisma.activityLog.create({
        data: {
          userId,
          username,
          action: '\u062D\u0630\u0641 \u0637\u0644\u0628 \u0645\u062E\u0632\u0646\u064A: #' + request.id,
          entity: 'StockRequest',
          entityId: String(id),
          details: '\u0633\u0628\u0628 \u0627\u0644\u062D\u0630\u0641: ' + reason,
        },
      }),
      prisma.notification.create({
        data: {
          userId,
          title: '\u062D\u0630\u0641 \u0637\u0644\u0628 \u0645\u062E\u0632\u0646\u064A',
          message: '\u062A\u0645 \u062D\u0630\u0641 \u0637\u0644\u0628 \u0627\u0644\u0645\u062E\u0632\u0646\u064A (#' + request.id + ') \u0645\u0646 \u0627\u0644\u0646\u0638\u0627\u0645 \u0628\u0646\u062C\u0627\u062D',
          type: 'error',
        },
      }),
    ]);

    return deleted;
  },
};
