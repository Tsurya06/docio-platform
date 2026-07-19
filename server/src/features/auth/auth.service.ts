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
import type { IUser } from '../user/user.model.js';

async function provisionProfile(user: IUser): Promise<void> {
  if (user.role === 'patient') {
    await patientService.createShell(user._id);
  } else if (user.role === 'doctor') {
    await doctorService.createShell(user._id);
  }
}

async function issueTokens(
  user: { _id: any; role: string },
  sessionMeta?: { userAgent?: string; ip?: string }
): Promise<{ accessToken: string; rawRefresh: string }> {
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

export const authService = {
  async register(input: any, sessionMeta?: { userAgent?: string; ip?: string }) {
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

  async login({ email, password }: any, sessionMeta?: { userAgent?: string; ip?: string }) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
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

  async refresh(rawRefresh: string | undefined, sessionMeta?: { userAgent?: string; ip?: string }) {
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

  async logout(rawRefresh: string | undefined): Promise<void> {
    if (!rawRefresh) return;
    const stored = await authRepository.findRefreshTokenByRaw(rawRefresh);
    if (!stored) return;
    await authRepository.revokeRefreshToken(stored);
  },

  async getMe(userId: string | object) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
    }
    return user.toSanitized();
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email }).lean();
    if (!user) return;

    const rawToken = generateResetToken();
    await authRepository.createPasswordReset({ userId: user._id, raw: rawToken });
    await mailService.sendPasswordResetEmail(user.email, rawToken);
  },

  async resetPassword({ token, newPassword }: any): Promise<void> {
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

  async changePassword({ userId, currentPassword, newPassword, currentRawRefresh }: any): Promise<void> {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
    }

    const fetched = await User.findById(userId).select('+password');
    if (!fetched) {
      throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
    }
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
