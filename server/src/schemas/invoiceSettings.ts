import { z } from 'zod';

export const upsertInvoiceSettingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  managedBy: z.string().min(1, 'Managed by is required'),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});
