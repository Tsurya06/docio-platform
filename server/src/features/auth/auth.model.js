import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
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
    revokedAt: { type: Date },
    replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'RefreshToken' },
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: true },
);

/**
 * TTL index — MongoDB removes expired tokens automatically. One less cron job.
 * Set `expireAfterSeconds: 0` so MongoDB uses each document's `expiresAt` as the deadline,
 * not a fixed offset from insertion.
 */
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
