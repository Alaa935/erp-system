import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import Decimal from 'decimal.js';
import type { Prisma } from '@prisma/client';

export const branchesService = {
  async listBranches(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, pageSize = 10, search, sortBy, sortOrder } = params;
    const where: Prisma.BranchWhereInput = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.BranchOrderByWithRelationInput = {};
    if (sortBy === 'name') orderBy.name = sortOrder;
    else if (sortBy === 'location') orderBy.location = sortOrder;
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.branch.count({ where }),
    ]);

    return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  },

  async getBranch(id: number) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch || branch.deletedAt) throw new AppError(404, 'Branch not found');
    return branch;
  },

  async createBranch(data: {
    name: string;
    location?: string;
    managerId?: number | null;
    phone?: string;
  }) {
    return prisma.branch.create({
      data: {
        name: data.name,
        location: data.location ?? '',
        managerId: data.managerId ?? undefined,
        phone: data.phone ?? '',
      },
    });
  },

  async updateBranch(id: number, data: Partial<{
    name: string;
    location: string;
    managerId: number | null;
    phone: string;
    deletedAt: string | null;
    deleteReason: string | null;
  }>) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch || branch.deletedAt) throw new AppError(404, 'Branch not found');

    const updateData: Prisma.BranchUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.managerId !== undefined) updateData.managerId = data.managerId;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt ? new Date(data.deletedAt) : null;
    if (data.deleteReason !== undefined) updateData.deleteReason = data.deleteReason;

    return prisma.branch.update({ where: { id }, data: updateData });
  },

  async softDelete(id: number, reason: string, userId: number, username: string) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch || branch.deletedAt) throw new AppError(404, 'Branch not found');

    const [deleted] = await prisma.$transaction([
      prisma.branch.update({
        where: { id },
        data: { deletedAt: new Date(), deleteReason: reason },
      }),
      prisma.activityLog.create({
        data: {
          userId,
          username,
          action: `حذف فرع: ${branch.name}`,
          entity: 'Branch',
          entityId: String(id),
          details: `سبب الحذف: ${reason}`,
        },
      }),
      prisma.notification.create({
        data: {
          userId,
          title: 'حذف فرع',
          message: `تم حذف بيانات الفرع (${branch.name}) من النظام بنجاح`,
          type: 'error',
        },
      }),
    ]);

    return deleted;
  },
};
