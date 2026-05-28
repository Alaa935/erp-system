import { toast } from 'sonner';
import { ValidationError } from './validation';
import { logger } from './logger';

export function handleError(error: unknown, context?: string): void {
  if (error instanceof ValidationError) {
    toast.error(error.message);
  } else if (error instanceof Error) {
    logger.error(context || 'UnhandledError', error);
    toast.error(error.message || 'حدث خطأ غير متوقع');
  } else {
    logger.error(context || 'UnhandledError', error);
    toast.error('حدث خطأ غير متوقع');
  }
}

export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(fn: T, context?: string): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context);
    }
  }) as T;
}
