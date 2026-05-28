import { z } from 'zod';

export const createTaxConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  rate: z.number().positive('Rate must be positive').max(100, 'Rate must be at most 100'),
  type: z.string().default('VAT'),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  isInclusive: z.boolean().optional().default(false),
});

export const updateTaxConfigSchema = createTaxConfigSchema.partial();

export const deleteTaxConfigSchema = z.object({
  reason: z.string().min(1, 'Delete reason is required'),
});

export const listTaxConfigsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});
