import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import Decimal from 'decimal.js';
import type { Prisma } from '@prisma/client';

export const salesRepsService = {
  async listSalesReps(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, pageSize = 10, search, sortBy, sortOrder } = params;
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 10;
    const where: Prisma.SalesRepWhereInput = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { zone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.SalesRepOrderByWithRelationInput = {};
    if (sortBy === 'name') orderBy.name = sortOrder;
    else if (sortBy === 'zone') orderBy.zone = sortOrder;
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.salesRep.findMany({
        where,
        orderBy,
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        include: { _count: { select: { repInventories: true } } },
      }),
      prisma.salesRep.count({ where }),
    ]);

    return { items, meta: { page: pageNum, pageSize: pageSizeNum, total, totalPages: Math.ceil(total / pageSizeNum) } };
  },

  async getSalesRep(id: number) {
    const salesRep = await prisma.salesRep.findUnique({
      where: { id },
      include: {
        repInventories: {
          include: { item: { select: { id: true, name: true, sku: true } } },
        },
      },
    });
    if (!salesRep || salesRep.deletedAt) throw new AppError(404, 'Sales rep not found');
    return salesRep;
  },

  async createSalesRep(data: {
    name: string;
    phone?: string;
    email?: string;
    zone?: string;
    target?: number;
    currentSales?: number;
    commissionRate?: number;
    balance?: number;
  }) {
    return prisma.salesRep.create({
      data: {
        name: data.name,
        phone: data.phone ?? '',
        email: data.email ?? '',
        zone: data.zone ?? '',
        target: new Decimal(data.target ?? 0),
        currentSales: new Decimal(data.currentSales ?? 0),
        commissionRate: new Decimal(data.commissionRate ?? 0),
        balance: new Decimal(data.balance ?? 0),
      },
    });
  },

  async updateSalesRep(id: number, data: Partial<{
    name: string;
    phone: string;
    email: string;
    zone: string;
    target: number;
    currentSales: number;
    commissionRate: number;
    balance: number;
    deletedAt: string | null;
    deleteReason: string | null;
  }>) {
    const salesRep = await prisma.salesRep.findUnique({ where: { id } });
    if (!salesRep || salesRep.deletedAt) throw new AppError(404, 'Sales rep not found');

    const updateData: Prisma.SalesRepUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.zone !== undefined) updateData.zone = data.zone;
    if (data.target !== undefined) updateData.target = new Decimal(data.target);
    if (data.currentSales !== undefined) updateData.currentSales = new Decimal(data.currentSales);
    if (data.commissionRate !== undefined) updateData.commissionRate = new Decimal(data.commissionRate);
    if (data.balance !== undefined) updateData.balance = new Decimal(data.balance);
    if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt ? new Date(data.deletedAt) : null;
    if (data.deleteReason !== undefined) updateData.deleteReason = data.deleteReason;

    return prisma.salesRep.update({ where: { id }, data: updateData });
  },

  async softDelete(id: number, reason: string, userId: number, username: string) {
    const salesRep = await prisma.salesRep.findUnique({ where: { id } });
    if (!salesRep || salesRep.deletedAt) throw new AppError(404, 'Sales rep not found');

    const [deleted] = await prisma.$transaction([
      prisma.salesRep.update({
        where: { id },
        data: { deletedAt: new Date(), deleteReason: reason },
      }),
      prisma.activityLog.create({
        data: {
          userId,
          username,
          action: 'حذف مندوب مبيعات: ' + salesRep.name,
          entity: 'SalesRep',
          entityId: String(id),
          details: 'سبب الحذف: ' + reason,
        },
      }),
      prisma.notification.create({
        data: {
          userId,
          title: 'حذف مندوب مبيعات',
          message: 'تم حذف بيانات مندوب المبيعات (' + salesRep.name + ') من النظام بنجاح',
          type: 'error',
        },
      }),
    ]);

    return deleted;
  },
};
