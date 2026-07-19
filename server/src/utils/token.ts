import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';

interface UserPayload {
  _id: string | object;
  role: string;
}

interface DecodedToken extends jwt.JwtPayload {
  sub: string;
  role: string;
}

export function signAccessToken(user: UserPayload): string {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as any,
  );
}

export function verifyAccessToken(token: string): DecodedToken {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as DecodedToken;
  } catch {
    throw ApiError.unauthorized('INVALID_ACCESS_TOKEN', 'Invalid or expired access token');
  }
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashRefreshToken(raw: string): string {
  return createHash('sha256')
    .update(raw)
    .update(env.JWT_REFRESH_SECRET)
    .digest('hex');
}

export function getRefreshTokenTtlMs(): number {
  return env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;
}

export function generateResetToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashResetToken(raw: string): string {
  return createHash('sha256')
    .update(raw)
    .update(env.JWT_REFRESH_SECRET)
    .digest('hex');
}

export function getResetTokenTtlMs(): number {
  return env.PASSWORD_RESET_EXPIRES_IN_MIN * 60 * 1000;
}
