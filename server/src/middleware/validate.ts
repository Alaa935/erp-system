import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[target]);
      req[target] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({ success: false, error: 'Validation failed', details: messages });
        return;
      }
      next(error);
    }
  };
}
