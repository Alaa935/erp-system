import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  phone: z.string().max(50).optional().default(''),
  email: z.string().max(100).optional().default(''),
  address: z.string().max(500).optional().default(''),
  loyaltyPoints: z.number().int().min(0).optional().default(0),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  deletedAt: z.string().optional().nullable(),
  deleteReason: z.string().optional().nullable(),
});

export const deleteCustomerSchema = z.object({
  reason: z.string().min(1, 'Delete reason is required').max(500),
});

export const listCustomersSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});
