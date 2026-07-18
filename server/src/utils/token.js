import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';

/**
 * JWT sign/verify + refresh-token hashing utilities.
 *
 * Design:
 *  - Access token is a short-lived (15 min) JWT, kept in client memory. Stateless verification.
 *  - Refresh token is an opaque random string (48 bytes, base64url). Stored hashed in DB
 *    so a database leak does not expose live tokens; the JWT_REFRESH_SECRET is mixed in as a
 *    pepper, meaning a puts attacker who only has the DB cannot forge token hashes.
 *  - Server-side storage enables real logout, password-reset global sign-out, and reuse
 *    detection (Step 2's auth.service detects reuse and revokes the family).
 */

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch {
    throw ApiError.unauthorized('INVALID_ACCESS_TOKEN', 'Invalid or expired access token');
  }
}

export function generateRefreshToken() {
  return randomBytes(48).toString('base64url');
}

export function hashRefreshToken(raw) {
  return createHash('sha256')
    .update(raw)
    .update(env.JWT_REFRESH_SECRET)
    .digest('hex');
}

export function getRefreshTokenTtlMs() {
  return env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Password-reset token helpers. Mirror the refresh-token helpers in construction (48 random
 * bytes → base64url, SHA-256 + JWT_REFRESH_SECRET pepper) and serve the same purpose: a
 * DB-leak can't forge a token without the secret, and the raw value exists only in the email link.
 *
 * Alternative considered: refactor both to share a single `generateOpaqueToken` / `hashOpaqueToken`.
 * Rejected — the rename touches every call site in auth.repository + auth.service for purely
 * cosmetic naming, and the current explicit names (`generateRefreshToken`, `generateResetToken`)
 * self-document intent at the call site better than a generic name. 8 lines of duplication for
 * 4 lines of intent clarity is a fair trade.
 */
export function generateResetToken() {
  return randomBytes(48).toString('base64url');
}

export function hashResetToken(raw) {
  return createHash('sha256')
    .update(raw)
    .update(env.JWT_REFRESH_SECRET)
    .digest('hex');
}

export function getResetTokenTtlMs() {
  return env.PASSWORD_RESET_EXPIRES_IN_MIN * 60 * 1000;
}
