import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import { isProduction } from '../config/env.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.flatten(),
      },
    });
  }

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ err }, 'Unhandled API error');
    }
    const body = {
      success: false,
      error: { code: err.code, message: err.message },
    };
    if (err.details) body.error.details = err.details;
    return res.status(err.statusCode).json(body);
  }

  logger.error({ err }, 'Unhandled error');
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'Internal server error' : err.message,
    },
  });
}
