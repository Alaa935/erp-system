import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import Decimal from 'decimal.js';
import type { Prisma } from '@prisma/client';

export const employeesService = {
  async listEmployees(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, pageSize = 10, search, sortBy, sortOrder } = params;
    const where: Prisma.EmployeeWhereInput = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.EmployeeOrderByWithRelationInput = {};
    if (sortBy === 'name') orderBy.name = sortOrder;
    else if (sortBy === 'role') orderBy.role = sortOrder;
    else if (sortBy === 'department') orderBy.department = sortOrder;
    else orderBy.id = 'desc';

    const [items, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.employee.count({ where }),
    ]);

    return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  },

  async getEmployee(id: number) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        payrolls: true,
      },
    });
    if (!employee || employee.deletedAt) throw new AppError(404, 'Employee not found');
    return employee;
  },

  async createEmployee(data: {
    name: string;
    role?: string;
    department?: string;
    email?: string;
    permissions?: string;
    branchId?: number | null;
  }) {
    return prisma.employee.create({
      data: {
        name: data.name,
        role: data.role ?? '',
        department: data.department ?? '',
        email: data.email ?? '',
        permissions: data.permissions ?? 'limited',
        branchId: data.branchId ?? undefined,
      },
    });
  },

  async updateEmployee(id: number, data: Partial<{
    name: string;
    role: string;
    department: string;
    email: string;
    permissions: string;
    branchId: number | null;
    deletedAt: string | null;
    deleteReason: string | null;
  }>) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee || employee.deletedAt) throw new AppError(404, 'Employee not found');

    const updateData: Prisma.EmployeeUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.permissions !== undefined) updateData.permissions = data.permissions;
    if (data.branchId !== undefined) updateData.branchId = data.branchId;
    if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt ? new Date(data.deletedAt) : null;
    if (data.deleteReason !== undefined) updateData.deleteReason = data.deleteReason;

    return prisma.employee.update({ where: { id }, data: updateData });
  },

  async softDelete(id: number, reason: string, userId: number, username: string) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee || employee.deletedAt) throw new AppError(404, 'Employee not found');

    const [deleted] = await prisma.$transaction([
      prisma.employee.update({
        where: { id },
        data: { deletedAt: new Date(), deleteReason: reason },
      }),
      prisma.activityLog.create({
        data: {
          userId,
          username,
          action: `حذف موظف: ${employee.name}`,
          entity: 'Employee',
          entityId: String(id),
          details: `سبب الحذف: ${reason}`,
        },
      }),
      prisma.notification.create({
        data: {
          userId,
          title: 'حذف موظف',
          message: `تم حذف بيانات الموظف (${employee.name}) من النظام بنجاح`,
          type: 'error',
        },
      }),
    ]);

    return deleted;
  },
};
