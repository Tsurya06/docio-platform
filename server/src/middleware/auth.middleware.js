import { verifyAccessToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Verifies the Bearer access token and attaches `{ id, role }` to `req.user`.
 * Downstream handlers and services read `req.user` instead of touching JWT details.
 *
 * Why synchronous: `verifyAccessToken` throws ApiError on failure, and Express 5 routes
 * synchronous throws from middleware to `errorHandler` automatically — no try/catch needed.
 *
 * Alternative considered: an async `await jwt.verify` wrapper. Rejected — adds an async
 * tick per request with no benefit; the function is already CPU-bound and synchronous.
 */
export function authenticate(req, _res, next) {
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
 * Reads `req.user.role` set by `authenticate`. Throws 403 if the role does not match.
 */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('UNAUTHENTICATED', 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('ROLE_FORBIDDEN', 'Insufficient role for this action'));
    }
    next();
  };
}
