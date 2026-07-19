import { User } from '../user/user.model.js';
import { RefreshToken, type IRefreshToken } from './auth.model.js';
import { PasswordReset, type IPasswordReset } from './passwordreset.model.js';
import { hashRefreshToken, hashResetToken, getResetTokenTtlMs } from '../../utils/token.js';
import type { IUser } from '../user/user.model.js';
import type { HydratedDocument } from 'mongoose';

export const authRepository = {
  findUserByEmail(email: string) {
    return User.findOne({ email }).select('+password');
  },

  findUserById(id: string | object) {
    return User.findById(id);
  },

  createUser(data: any) {
    return User.create(data);
  },

  async updateLastLogin(userId: string | object): Promise<void> {
    await User.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } });
  },

  async createRefreshToken({
    userId,
    raw,
    ttlMs,
    sessionMeta,
  }: {
    userId: string | object;
    raw: string;
    ttlMs: number;
    sessionMeta?: { userAgent?: string; ip?: string };
  }): Promise<HydratedDocument<IRefreshToken>> {
    return RefreshToken.create({
      userId,
      token: hashRefreshToken(raw),
      expiresAt: new Date(Date.now() + ttlMs),
      userAgent: sessionMeta?.userAgent,
      ip: sessionMeta?.ip,
    });
  },

  findRefreshTokenByRaw(raw: string) {
    return RefreshToken.findOne({ token: hashRefreshToken(raw) });
  },

  async revokeRefreshToken(doc: HydratedDocument<IRefreshToken>): Promise<void> {
    doc.revokedAt = new Date();
    await doc.save();
  },

  async rotateRefreshToken(
    oldDoc: HydratedDocument<IRefreshToken>,
    rawNew: string,
    {
      userId,
      ttlMs,
      sessionMeta,
    }: {
      userId: string | object;
      ttlMs: number;
      sessionMeta?: { userAgent?: string; ip?: string };
    },
  ): Promise<HydratedDocument<IRefreshToken>> {
    const newDoc = await this.createRefreshToken({
      userId,
      raw: rawNew,
      ttlMs,
      sessionMeta,
    });
    oldDoc.replacedBy = newDoc._id as any;
    oldDoc.revokedAt = oldDoc.revokedAt ?? new Date();
    await oldDoc.save();
    return newDoc;
  },

  async revokeAllUserTokens(userId: string | object): Promise<void> {
    await RefreshToken.updateMany(
      { userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
  },

  async revokeOtherUserTokens(userId: string | object, currentRawHash: string | null): Promise<void> {
    if (!currentRawHash) {
      return this.revokeAllUserTokens(userId);
    }
    await RefreshToken.updateMany(
      { userId, token: { $ne: currentRawHash }, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
  },

  async setUserPassword(userId: string | object, newPassword: string): Promise<HydratedDocument<IUser> | null> {
    const user = await User.findById(userId);
    if (!user) return null;
    user.password = newPassword;
    await user.save();
    return user;
  },

  async createPasswordReset({ userId, raw }: { userId: string | object; raw: string }): Promise<HydratedDocument<IPasswordReset>> {
    return PasswordReset.create({
      userId,
      token: hashResetToken(raw),
      expiresAt: new Date(Date.now() + getResetTokenTtlMs()),
    });
  },

  findPasswordResetByRaw(raw: string) {
    return PasswordReset.findOne({ token: hashResetToken(raw) });
  },

  async markPasswordResetUsed(doc: HydratedDocument<IPasswordReset>): Promise<void> {
    doc.used = true;
    await doc.save();
  },
};
