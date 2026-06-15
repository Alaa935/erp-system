import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  console.error('[UNHANDLED ERROR]', err);

  // DIAGNOSTIC MODE: expose full Prisma error details regardless of NODE_ENV
  const body: Record<string, any> = {
    success: false,
    error: process.env.NODE_ENV === 'production' && !err.code
      ? 'Internal server error'
      : err.message,
  };
  if (err.code) {
    body.prismaError = {
      code: err.code,
      message: err.message,
      meta: err.meta ?? null,
      stack: err.stack ?? null,
      clientVersion: err.clientVersion ?? null,
      cause: err.cause instanceof Error
        ? { message: err.cause.message, stack: err.cause.stack }
        : err.cause ?? null,
    };
  }
  res.status(500).json(body);
}
