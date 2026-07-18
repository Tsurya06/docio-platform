import { User } from '../user/user.model.js';
import { RefreshToken } from './auth.model.js';
import { PasswordReset } from './passwordreset.model.js';
import { hashRefreshToken, hashResetToken, getResetTokenTtlMs } from '../../utils/token.js';

/**
 * Auth data-access layer.
 *
 * The repository owns every Mongoose call. Services call into it with plain JS values (raw tokens,
 * session metadata), not Mongoose documents, and receive hydrated documents back. This isolation
 * lets us swap Mongoose for another driver (or a test double) in one file, and services stay agnostic.
 *
 * Alternative considered: services calling `User.findOne` directly. Rejected — would spread Mongoose
 * concerns through the service layer and make services painful to unit test.
 */
export const authRepository = {
  findUserByEmail(email) {
    // Password needed in the login path for comparison; default `select: false` on the model
    // means we need an explicit `select('+password')` here.
    return User.findOne({ email }).select('+password');
  },

  findUserById(id) {
    return User.findById(id);
  },

  createUser(data) {
    return User.create(data);
  },

  async updateLastLogin(userId) {
    // `updateOne` instead of `.save()` — we don't want to round-trip the password field or run
    // the pre-save hook just to set a timestamp.
    await User.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } });
  },

  async createRefreshToken({ userId, raw, ttlMs, sessionMeta }) {
    return RefreshToken.create({
      userId,
      token: hashRefreshToken(raw),
      expiresAt: new Date(Date.now() + ttlMs),
      userAgent: sessionMeta?.userAgent,
      ip: sessionMeta?.ip,
    });
  },

  findRefreshTokenByRaw(raw) {
    return RefreshToken.findOne({ token: hashRefreshToken(raw) });
  },

  async revokeRefreshToken(doc) {
    doc.revokedAt = new Date();
    await doc.save();
  },

  async rotateRefreshToken(oldDoc, rawNew, { userId, ttlMs, sessionMeta }) {
    // Atomic replacement: insert the new token, then mark the old one revoked with `replacedBy`
    // pointing forward. If the old token is replayed later, `auth.service` sees both `revokedAt`
    // and `replacedBy` set → reuse signal.
    const newDoc = await this.createRefreshToken({
      userId,
      raw: rawNew,
      ttlMs,
      sessionMeta,
    });
    oldDoc.replacedBy = newDoc._id;
    oldDoc.revokedAt = oldDoc.revokedAt ?? new Date();
    await oldDoc.save();
    return newDoc;
  },

  async revokeAllUserTokens(userId) {
    // Used on detected reuse — burns the entire family, forcing re-auth on every device.
    await RefreshToken.updateMany(
      { userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
  },

  /**
   * Revoke all refresh tokens for a user except the hash of the current session's cookie token.
   * Used by Step 10's change-password flow: keeps the active session alive, logs out all others.
   * `currentRawHash` is the already-hashed value of the cookie's refresh token — precomputed by
   * the service so the repository stays purely DB-side.
   */
  async revokeOtherUserTokens(userId, currentRawHash) {
    if (!currentRawHash) {
      return this.revokeAllUserTokens(userId);
    }
    await RefreshToken.updateMany(
      { userId, token: { $ne: currentRawHash }, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
  },

  /**
   * Save the new password on a user document. We deliberately use `.save()` (not `findByIdAndUpdate`)
   * so the User model's `pre('save')` bcrypt hook fires — that hook is what actually hashes the password.
   */
  async setUserPassword(userId, newPassword) {
    const user = await User.findById(userId);
    if (!user) return null;
    user.password = newPassword;
    await user.save();
    return user;
  },

  async createPasswordReset({ userId, raw }) {
    return PasswordReset.create({
      userId,
      token: hashResetToken(raw),
      expiresAt: new Date(Date.now() + getResetTokenTtlMs()),
    });
  },

  findPasswordResetByRaw(raw) {
    return PasswordReset.findOne({ token: hashResetToken(raw) });
  },

  async markPasswordResetUsed(doc) {
    doc.used = true;
    await doc.save();
  },
};
