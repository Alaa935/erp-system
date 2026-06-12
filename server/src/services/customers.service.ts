import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

export const customersService = {
  async countToday() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return prisma.customer.count({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
    });
  },

  async listCustomers(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, pageSize = 10, search, sortBy, sortOrder } = params;
    const where: Prisma.CustomerWhereInput = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
    if (sortBy === 'name') orderBy.name = sortOrder;
    else if (sortBy === 'phone') orderBy.phone = sortOrder;
    else if (sortBy === 'loyaltyPoints') orderBy.loyaltyPoints = sortOrder;
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      items: items.map(c => ({
        ...c,
        loyaltyPoints: Number(c.loyaltyPoints),
        latitude: c.latitude ? Number(c.latitude) : null,
        longitude: c.longitude ? Number(c.longitude) : null,
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async getCustomer(id: number) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer || customer.deletedAt) throw new AppError(404, 'Customer not found');
    return {
      ...customer,
      loyaltyPoints: Number(customer.loyaltyPoints),
      latitude: customer.latitude ? Number(customer.latitude) : null,
      longitude: customer.longitude ? Number(customer.longitude) : null,
    };
  },

  async createCustomer(data: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    loyaltyPoints?: number;
    latitude?: number | null;
    longitude?: number | null;
  }) {
    if (data.phone) {
      const existing = await prisma.customer.findFirst({
        where: { phone: data.phone, deletedAt: null },
      });
      if (existing) {
        throw new AppError(409, 'يوجد عميل مسجل بنفس رقم الهاتف');
      }
    }
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone ?? '',
        email: data.email ?? '',
        address: data.address ?? '',
        loyaltyPoints: data.loyaltyPoints ?? 0,
        latitude: data.latitude != null ? new Decimal(data.latitude) : undefined,
        longitude: data.longitude != null ? new Decimal(data.longitude) : undefined,
      },
    });
    return {
      ...customer,
      loyaltyPoints: Number(customer.loyaltyPoints),
      latitude: customer.latitude ? Number(customer.latitude) : null,
      longitude: customer.longitude ? Number(customer.longitude) : null,
    };
  },

  async updateCustomer(id: number, data: Partial<{
    name: string;
    phone: string;
    email: string;
    address: string;
    loyaltyPoints: number;
    latitude: number | null;
    longitude: number | null;
    deletedAt: string | null;
    deleteReason: string | null;
  }>) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer || customer.deletedAt) throw new AppError(404, 'Customer not found');

    const updateData: Prisma.CustomerUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.loyaltyPoints !== undefined) updateData.loyaltyPoints = data.loyaltyPoints;
    if (data.latitude !== undefined) updateData.latitude = data.latitude != null ? new Decimal(data.latitude) : null;
    if (data.longitude !== undefined) updateData.longitude = data.longitude != null ? new Decimal(data.longitude) : null;
    if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt ? new Date(data.deletedAt) : null;
    if (data.deleteReason !== undefined) updateData.deleteReason = data.deleteReason;

    const updated = await prisma.customer.update({ where: { id }, data: updateData });
    return {
      ...updated,
      loyaltyPoints: Number(updated.loyaltyPoints),
      latitude: updated.latitude ? Number(updated.latitude) : null,
      longitude: updated.longitude ? Number(updated.longitude) : null,
    };
  },

  async softDelete(id: number, reason: string, userId: number, username: string) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer || customer.deletedAt) throw new AppError(404, 'Customer not found');

    const [deleted] = await prisma.$transaction([
      prisma.customer.update({
        where: { id },
        data: { deletedAt: new Date(), deleteReason: reason },
      }),
      prisma.activityLog.create({
        data: {
          userId,
          username,
          action: `حذف عميل: ${customer.name}`,
          entity: 'Customer',
          entityId: String(id),
          details: `سبب الحذف: ${reason}`,
        },
      }),
      prisma.notification.create({
        data: {
          userId,
          title: 'حذف عميل',
          message: `تم حذف بيانات العميل (${customer.name}) من النظام بنجاح`,
          type: 'error',
        },
      }),
    ]);

    return {
      ...deleted,
      loyaltyPoints: Number(deleted.loyaltyPoints),
    };
  },
};
