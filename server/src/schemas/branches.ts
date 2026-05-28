import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  location: z.string().max(500).optional().default(''),
  managerId: z.number().int().positive().optional().nullable(),
  phone: z.string().max(50).optional().default(''),
});

export const updateBranchSchema = createBranchSchema.partial().extend({
  deletedAt: z.string().optional().nullable(),
  deleteReason: z.string().optional().nullable(),
});

export const deleteBranchSchema = z.object({
  reason: z.string().min(1, 'Delete reason is required').max(500),
});

export const listBranchesSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});
