import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Verifies the Bearer access token and attaches `{ id, role }` to `req.user`.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('MISSING_ACCESS_TOKEN', 'Missing Bearer access token'));
  }
  const token = header.slice('Bearer '.length).trim();
  const decoded = verifyAccessToken(token);
  req.user = { id: decoded.sub, role: decoded.role };
  next();
}

/**
 * Role guard. Composes after `authenticate`: e.g. `authenticate, requireRole('admin')`.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('UNAUTHENTICATED', 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('ROLE_FORBIDDEN', 'Insufficient role for this action'));
    }
    next();
  };
}
