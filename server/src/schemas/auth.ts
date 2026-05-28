import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.enum(['admin', 'manager', 'rep']).optional().default('rep'),
  repId: z.number().int().positive().optional().nullable(),
  nationalId: z.string().length(14).optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const forgotPasswordSchema = z.object({
  username: z.string().min(1),
  nationalId: z.string().length(14, 'National ID must be exactly 14 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
