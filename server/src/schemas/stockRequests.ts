import { z } from 'zod';

export const stockRequestStatusEnum = z.enum(['pending', 'approved', 'rejected']);

export const createStockRequestSchema = z.object({
  repId: z.number().int().positive('Rep ID must be positive'),
  items: z.array(
    z.object({
      itemId: z.number().int().positive('Item ID must be positive'),
      quantity: z.number().positive('Quantity must be positive'),
      sellingPrice: z.number().positive().optional().nullable(),
    })
  ).min(1, 'At least one item is required'),
  status: stockRequestStatusEnum.optional().default('pending'),
  date: z.string().datetime().optional(),
});

export const updateStockRequestSchema = createStockRequestSchema.partial().extend({
  items: z.array(
    z.object({
      itemId: z.number().int().positive(),
      quantity: z.number().positive(),
      sellingPrice: z.number().positive().optional().nullable(),
    })
  ).optional(),
});

export const deleteStockRequestSchema = z.object({
  reason: z.string().min(1, 'Delete reason is required'),
});

export const listStockRequestsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  status: stockRequestStatusEnum.optional(),
  repId: z.coerce.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});