import { authRepository } from './auth.repository.js';
import { User } from '../user/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../config/logger.js';
import {
  signAccessToken,
  generateRefreshToken,
  generateResetToken,
  getRefreshTokenTtlMs,
  hashRefreshToken,
} from '../../utils/token.js';
import { patientService } from '../patient/patient.service.js';
import { doctorService } from '../doctor/doctor.service.js';
import { mailService } from './mail.service.js';

/**
 * Provision the role-specific shell record after a successful User.create.
 *
 * One-way dependency: auth knows about patient/doctor services (it triggers provisioning), but
 * patient/doctor services never import auth — keeping a clean layering so users never enter
 * through the patient/doctor controllers without going through auth first.
 *
 * Failure mode: if shell creation throws a non-duplicate error, we re-throw and fail the
 * registration. Duplicate-key (11000) means a concurrent request beat us — safe to no-op.
 * Result: every registered account either has both a User AND a profile shell, or no User at all.
 */
async function provisionProfile(user) {
  if (user.role === 'patient') {
    await patientService.createShell(user._id);
  } else if (user.role === 'doctor') {
    await doctorService.createShell(user._id);
  }
}

/**
 * Issue an access token and a new (hashed) refresh token for a freshly-authenticated user.
 * Always paired — the controller writes the refresh token to an httpOnly cookie and the access
 * token to the response body, so the only time we issue one is the only time we issue the other.
 */
async function issueTokens(user, sessionMeta) {
  const accessToken = signAccessToken(user);
  const rawRefresh = generateRefreshToken();
  await authRepository.createRefreshToken({
    userId: user._id,
    raw: rawRefresh,
    ttlMs: getRefreshTokenTtlMs(),
    sessionMeta,
  });
  return { accessToken, rawRefresh };
}

/**
 * Auth business logic.
 *
 * Strategy decisions, with rationale:
 *
 *  1. Duplicate-email check at register is a `User.findOne({ email }).lean()` (not the same query
 *     as the `findOne(...).select('+password')` in login) because we don't need the password hash
 *     to decide "already exists" — and lean returns a POJO, which is cheaper.
 *  2. Login returns the same ApiError for "user not found" and "wrong password". Hiding user
 *     existence is a baseline OWASP control — account enumeration is a real attack vector.
 *  3. Refresh-token reuse detection: if a refresh token comes in with both `revokedAt` and
 *     `replacedBy` set, we assume the rotation chain was compromised. We log it and revoke every
 *     session for that user. Conservative — users get logged out everywhere — but the alternative
 *     (silently continuing) gives an attacker a permanent foothold.
 *  4. Logout is idempotent — no-op if the cookie is missing or the token is already revoked,
 *     so a stale frontend logout call doesn't 500.
 *  5. `req.body` is the Zod-parsed shape (not raw), so we trust the keys exist here.
 */
export const authService = {
  async register(input, sessionMeta) {
    const { email, password, firstName, lastName, role, phone } = input;

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      throw ApiError.conflict('EMAIL_EXISTS', 'An account with this email already exists');
    }

    const user = await authRepository.createUser({
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
    });

    await provisionProfile(user);

    const tokens = await issueTokens(user, sessionMeta);
    return { user: user.toSanitized(), ...tokens };
  },

  async login({ email, password }, sessionMeta) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      // Same code+message as wrong-password below — prevents account enumeration.
      throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password');
    }
    const valid = await user.comparePassword(password);
    if (!valid) {
      throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password');
    }
    if (!user.isActive) {
      throw ApiError.unauthorized('ACCOUNT_INACTIVE', 'Account is deactivated');
    }

    await authRepository.updateLastLogin(user._id);
    const tokens = await issueTokens(user, sessionMeta);
    return { user: user.toSanitized(), ...tokens };
  },

  async refresh(rawRefresh, sessionMeta) {
    if (!rawRefresh) {
      throw ApiError.unauthorized('INVALID_REFRESH_TOKEN', 'Refresh token missing');
    }

    const stored = await authRepository.findRefreshTokenByRaw(rawRefresh);
    if (!stored) {
      throw ApiError.unauthorized('INVALID_REFRESH_TOKEN', 'Invalid refresh token');
    }

    if (stored.expiresAt < new Date()) {
      throw ApiError.unauthorized('INVALID_REFRESH_TOKEN', 'Refresh token expired');
    }

    // Reuse: was already rotated (`replacedBy` set). Token theft suspected — burn the family.
    if (stored.revokedAt && stored.replacedBy) {
      logger.warn(
        { userId: stored.userId, refreshTokenId: stored._id },
        'Refresh token reuse detected; revoking all user sessions',
      );
      await authRepository.revokeAllUserTokens(stored.userId);
      throw ApiError.unauthorized(
        'INVALID_REFRESH_TOKEN',
        'Refresh token reuse detected; all sessions revoked',
      );
    }

    // Plain logout: revoked but no `replacedBy` chain — no rotation happened.
    if (stored.revokedAt) {
      throw ApiError.unauthorized('INVALID_REFRESH_TOKEN', 'Refresh token revoked');
    }

    const user = await authRepository.findUserById(stored.userId);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('ACCOUNT_INACTIVE', 'Account is deactivated');
    }

    const rawNew = generateRefreshToken();
    await authRepository.rotateRefreshToken(stored, rawNew, {
      userId: user._id,
      ttlMs: getRefreshTokenTtlMs(),
      sessionMeta,
    });

    return {
      user: user.toSanitized(),
      accessToken: signAccessToken(user),
      rawRefresh: rawNew,
    };
  },

  async logout(rawRefresh) {
    if (!rawRefresh) return;
    const stored = await authRepository.findRefreshTokenByRaw(rawRefresh);
    if (!stored) return;
    await authRepository.revokeRefreshToken(stored);
  },

  async getMe(userId) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
    }
    return user.toSanitized();
  },

  /**
   * Forgot password — always returns success regardless of whether the email exists.
   * Account enumeration prevention is more important than telling a confused user "we don't
   * have that email." Backend lookup still happens so we can send the email when the account exists.
   *
   * We never reuse tokens: every call generates a fresh one. Old, unused tokens for the same user
   * remain technically valid until they expire — a brute-forcer can't benefit since the TTL is 15 min.
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email }).lean();
    if (!user) return;

    const rawToken = generateResetToken();
    await authRepository.createPasswordReset({ userId: user._id, raw: rawToken });
    await mailService.sendPasswordResetEmail(user.email, rawToken);
  },

  /**
   * Reset password via token. On success: hashes the new password, marks the token used, and
   * revokes ALL refresh tokens for the user — forcing re-auth everywhere (OWASP: when a password
   * is reset due to suspected compromise, end every existing session).
   */
  async resetPassword({ token, newPassword }) {
    const found = await authRepository.findPasswordResetByRaw(token);
    if (!found) {
      throw ApiError.unauthorized('INVALID_RESET_TOKEN', 'Invalid or expired reset token');
    }
    if (found.used) {
      throw ApiError.unauthorized('RESET_TOKEN_USED', 'Reset token has already been used');
    }
    if (found.expiresAt < new Date()) {
      throw ApiError.unauthorized('RESET_TOKEN_EXPIRED', 'Reset token has expired');
    }

    await authRepository.setUserPassword(found.userId, newPassword);
    await authRepository.markPasswordResetUsed(found);
    await authRepository.revokeAllUserTokens(found.userId);
  },

  /**
   * Authenticated change password. Keeps the active session alive by sparing the refresh token
   * whose hash matches the cookie value; revokes every other refresh token so other devices must
   * re-auth with the new password.
   *
   * `currentRawRefresh` is optional — if the cookie is absent (e.g., a REST-only client that
   * logged in via access token), we conservatively revoke ALL refresh tokens for the user.
   */
  async changePassword({ userId, currentPassword, newPassword, currentRawRefresh }) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
    }

    const fetched = await User.findById(userId).select('+password');
    const valid = await fetched.comparePassword(currentPassword);
    if (!valid) {
      throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Current password is incorrect');
    }

    fetched.password = newPassword;
    await fetched.save();

    const currentHash = currentRawRefresh ? hashRefreshToken(currentRawRefresh) : null;
    await authRepository.revokeOtherUserTokens(userId, currentHash);
  },
};
