import { z } from 'zod';

export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  role: z.string().max(100).optional().default(''),
  department: z.string().max(100).optional().default(''),
  email: z.string().max(100).optional().default(''),
  permissions: z.string().max(50).optional().default('limited'),
  branchId: z.number().int().positive().optional().nullable(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  deletedAt: z.string().optional().nullable(),
  deleteReason: z.string().optional().nullable(),
});

export const deleteEmployeeSchema = z.object({
  reason: z.string().min(1, 'Delete reason is required').max(500),
});

export const listEmployeesSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});
