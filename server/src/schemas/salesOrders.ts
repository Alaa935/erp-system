import { z } from 'zod';

export const createSalesOrderSchema = z.object({
  customerId: z.number().int().positive(),
  repId: z.number().int().positive().optional().nullable(),
  taxId: z.number().int().positive().optional().nullable(),
  items: z.array(z.object({
    itemId: z.number().int().positive(),
    quantity: z.number().positive(),
    price: z.number().min(0),
  })).min(1, 'At least one item required'),
});

export const updateSalesOrderSchema = z.object({
  customerId: z.number().int().positive().optional(),
  status: z.enum(['pending', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['paid', 'partial', 'unpaid']).optional(),
  paidAmount: z.number().min(0).optional(),
}).optional();

export const dispatchSchema = z.object({
  source: z.string().optional(),
});

export const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['cash', 'transfer', 'check', 'credit']),
});

export const deleteSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});
