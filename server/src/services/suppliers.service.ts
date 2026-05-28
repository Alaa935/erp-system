import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Prisma } from '@prisma/client';

export const suppliersService = {
  async listSuppliers(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, pageSize = 10, search, sortBy, sortOrder } = params;
    const where: Prisma.SupplierWhereInput = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.SupplierOrderByWithRelationInput = {};
    if (sortBy === 'name') orderBy.name = sortOrder;
    else if (sortBy === 'contactName') orderBy.contactName = sortOrder;
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.supplier.count({ where }),
    ]);

    return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  },

  async getSupplier(id: number) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier || supplier.deletedAt) throw new AppError(404, 'Supplier not found');
    return supplier;
  },

  async createSupplier(data: {
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    taxNumber?: string | null;
    address?: string;
  }) {
    return prisma.supplier.create({
      data: {
        name: data.name,
        contactName: data.contactName ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
        taxNumber: data.taxNumber ?? undefined,
        address: data.address ?? '',
      },
    });
  },

  async updateSupplier(id: number, data: Partial<{
    name: string;
    contactName: string;
    phone: string;
    email: string;
    taxNumber: string | null;
    address: string;
    deletedAt: string | null;
    deleteReason: string | null;
  }>) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier || supplier.deletedAt) throw new AppError(404, 'Supplier not found');

    const updateData: Prisma.SupplierUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.contactName !== undefined) updateData.contactName = data.contactName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.taxNumber !== undefined) updateData.taxNumber = data.taxNumber;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt ? new Date(data.deletedAt) : null;
    if (data.deleteReason !== undefined) updateData.deleteReason = data.deleteReason;

    return prisma.supplier.update({ where: { id }, data: updateData });
  },

  async softDelete(id: number, reason: string, userId: number, username: string) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier || supplier.deletedAt) throw new AppError(404, 'Supplier not found');

    const [deleted] = await prisma.$transaction([
      prisma.supplier.update({
        where: { id },
        data: { deletedAt: new Date(), deleteReason: reason },
      }),
      prisma.activityLog.create({
        data: {
          userId,
          username,
          action: `حذف مورد: ${supplier.name}`,
          entity: 'Supplier',
          entityId: String(id),
          details: `سبب الحذف: ${reason}`,
        },
      }),
      prisma.notification.create({
        data: {
          userId,
          title: 'حذف مورد',
          message: `تم حذف بيانات المورد (${supplier.name}) من النظام بنجاح`,
          type: 'error',
        },
      }),
    ]);

    return deleted;
  },
};
