import { z } from 'zod';

export const transferStatusEnum = z.enum(['pending', 'completed', 'cancelled']);

export const createStockTransferSchema = z.object({
  transferNumber: z.string().optional(),
  fromType: z.string().min(1, 'From type is required'),
  fromId: z.number().int().positive('From ID must be positive'),
  toType: z.string().min(1, 'To type is required'),
  toId: z.number().int().positive('To ID must be positive'),
  items: z.array(
    z.object({
      itemId: z.number().int().positive('Item ID must be positive'),
      quantity: z.number().positive('Quantity must be positive'),
    })
  ).min(1, 'At least one item is required'),
  status: transferStatusEnum.optional().default('pending'),
  date: z.string().datetime().optional(),
});

export const updateStockTransferSchema = createStockTransferSchema.partial().extend({
  items: z.array(
    z.object({
      itemId: z.number().int().positive(),
      quantity: z.number().positive(),
    })
  ).optional(),
});

export const deleteStockTransferSchema = z.object({
  reason: z.string().min(1, 'Delete reason is required'),
});

export const listStockTransfersSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  status: transferStatusEnum.optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});