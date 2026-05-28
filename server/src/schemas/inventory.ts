import { z } from 'zod';

export const createItemSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  purchasePrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  quantity: z.number().min(0),
  minQuantity: z.number().min(0).optional().default(5),
  location: z.string().max(200).optional().default(''),
  expiryDate: z.string().optional().nullable(),
  supplierId: z.number().int().positive().optional().nullable(),
});

export const updateItemSchema = createItemSchema.partial().extend({
  deletedAt: z.string().optional().nullable(),
  deleteReason: z.string().optional().nullable(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  supplierId: z.coerce.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});
