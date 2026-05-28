import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  contactName: z.string().max(100).optional().default(''),
  phone: z.string().max(50).optional().default(''),
  email: z.string().max(100).optional().default(''),
  taxNumber: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().default(''),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  deletedAt: z.string().optional().nullable(),
  deleteReason: z.string().optional().nullable(),
});

export const deleteSupplierSchema = z.object({
  reason: z.string().min(1, 'Delete reason is required').max(500),
});

export const listSuppliersSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});
