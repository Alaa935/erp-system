import type { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: number;
  username: string;
  role: UserRole;
}

export interface AuthRequest {
  userId: number;
  username: string;
  role: UserRole;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
