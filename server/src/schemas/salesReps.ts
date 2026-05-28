import { z } from 'zod';

export const createSalesRepSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional().default(''),
  email: z.string().optional().default(''),
  zone: z.string().optional().default(''),
  target: z.coerce.number().optional().default(0),
  currentSales: z.coerce.number().optional().default(0),
  commissionRate: z.coerce.number().optional().default(0),
  balance: z.coerce.number().optional().default(0),
});

export const updateSalesRepSchema = createSalesRepSchema.partial();

export const deleteSalesRepSchema = z.object({
  reason: z.string().min(1, 'Delete reason is required'),
});
