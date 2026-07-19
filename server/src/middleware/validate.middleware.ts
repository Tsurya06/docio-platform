import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Generic Zod validation middleware.
 */
export function validate({ body, query, params }: ValidationSchemas = {}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (body) req.body = body.parse(req.body);
    if (query) {
      const parsed = query.parse(req.query);
      Object.defineProperty(req, 'query', {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    if (params) req.params = params.parse(req.params);
    next();
  };
}
