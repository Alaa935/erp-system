import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import Decimal from 'decimal.js';
import type { Prisma } from '@prisma/client';

export const taxConfigsService = {
  async listTaxConfigs(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, pageSize = 10, search, isActive, sortBy, sortOrder } = params;
    const pageNum = Number(page) || 1;
const pageSizeNum = Number(pageSize) || 10;
    const where: Prisma.TaxConfigWhereInput = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const orderBy: Prisma.TaxConfigOrderByWithRelationInput = {};
    if (sortBy === 'name') orderBy.name = sortOrder;
    else if (sortBy === 'rate') orderBy.rate = sortOrder;
    else if (sortBy === 'type') orderBy.type = sortOrder;
    else if (sortBy === 'isActive') orderBy.isActive = sortOrder;
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.taxConfig.findMany({
        where,
        orderBy,
       skip: (pageNum - 1) * pageSizeNum,
take: pageSizeNum,
      }),
      prisma.taxConfig.count({ where }),
    ]);

    return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  },

  async getTaxConfig(id: number) {
    const taxConfig = await prisma.taxConfig.findUnique({ where: { id } });
    if (!taxConfig || taxConfig.deletedAt) throw new AppError(404, 'Tax config not found');
    return taxConfig;
  },

  async createTaxConfig(data: {
    name: string;
    rate: number;
    type?: string;
    code?: string | null;
    description?: string | null;
    isActive?: boolean;
    isInclusive?: boolean;
  }) {
    try {
      const config = await prisma.taxConfig.create({
        data: {
          name: data.name,
          rate: new Decimal(data.rate),
          type: data.type ?? 'VAT',
          code: data.code ?? undefined,
          description: data.description ?? undefined,
          isActive: data.isActive ?? true,
          isInclusive: data.isInclusive ?? false,
        },
      });
      return config;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new AppError(409, 'اسم الضريبة موجود مسبقاً');
      }
      throw err;
    }
  },

  async updateTaxConfig(id: number, data: Partial<{
    name: string;
    rate: number;
    type: string;
    code: string | null;
    description: string | null;
    isActive: boolean;
    isInclusive: boolean;
  }>) {
    const taxConfig = await prisma.taxConfig.findUnique({ where: { id } });
    if (!taxConfig || taxConfig.deletedAt) throw new AppError(404, 'Tax config not found');

    const updateData: Prisma.TaxConfigUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.rate !== undefined) updateData.rate = new Decimal(data.rate);
    if (data.type !== undefined) updateData.type = data.type;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isInclusive !== undefined) updateData.isInclusive = data.isInclusive;

    return prisma.taxConfig.update({ where: { id }, data: updateData });
  },

  async softDelete(id: number, reason: string, userId: number, username: string) {
    const taxConfig = await prisma.taxConfig.findUnique({ where: { id } });
    if (!taxConfig || taxConfig.deletedAt) throw new AppError(404, 'Tax config not found');

    const [deleted] = await prisma.$transaction([
      prisma.taxConfig.update({
        where: { id },
        data: { deletedAt: new Date(), deleteReason: reason },
      }),
      prisma.activityLog.create({
        data: {
          userId,
          username,
          action: `حذف ضريبة: ${taxConfig.name}`,
          entity: 'TaxConfig',
          entityId: String(id),
          details: `سبب الحذف: ${reason}`,
        },
      }),
      prisma.notification.create({
        data: {
          userId,
          title: 'حذف ضريبة',
          message: `تم حذف بيانات الضريبة (${taxConfig.name}) من النظام بنجاح`,
          type: 'error',
        },
      }),
    ]);

    return deleted;
  },
};
