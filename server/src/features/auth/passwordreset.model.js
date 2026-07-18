import mongoose from 'mongoose';

/**
 * Short-lived password reset tokens. Each token is the SHA-256 hash of a 48-byte random
 * value (the raw value sent in the email). The caller never sees the hashed form;
 * the email link contains the raw token, the DB stores the hash.
 *
 * TTL on `expiresAt` ensures MongoDB sweeps unexpired-and-unused tokens automatically
 * at the 15-minute mark — no cron job required.
 *
 * Used tokens (`used: true`) are also removed by TTL once the 15-minute window lapses,
 * so the collection stays small even if we never explicitly delete them.
 *
 * Security: we do not lock tokens to a per-user "most recent only" invariant — old unused
 * tokens still work until expiry. Simpler model; the TTL bound already prevents brute-force
 * guessing (a single token has 48 bytes of entropy).
 */
const passwordResetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true },
);

passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);
