import { z } from 'zod';

const decimalField = z.coerce.number().positive();

export const itemSchema = z.object({
  itemId: z.number().int().positive(),
  quantity: decimalField,
  price: decimalField,
});

export const createPurchaseOrderSchema = z.object({
  orderNumber: z.string().min(1).optional(),
  supplierId: z.number().int().positive(),
  invoiceNumber: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1, 'At least one item required'),
  subtotal: z.coerce.number().optional(),
  taxId: z.number().int().optional().nullable(),
  taxAmount: z.coerce.number().optional(),
  totalAmount: z.coerce.number(),
  status: z.enum(['received', 'cancelled']).optional().default('received'),
  paymentStatus: z.enum(['paid', 'partial', 'unpaid']).optional().default('unpaid'),
  paidAmount: z.coerce.number().optional().default(0),
  dueDate: z.string().datetime().optional().nullable(),
  date: z.string().datetime().optional(),
  notes: z.string().optional().nullable(),
  paymentMethod: z.enum(['cash', 'transfer', 'check', 'credit']).optional().nullable(),
});

export const updatePurchaseOrderSchema = createPurchaseOrderSchema.partial();

export const deletePurchaseOrderSchema = z.object({
  reason: z.string().min(1, 'Delete reason is required'),
});
