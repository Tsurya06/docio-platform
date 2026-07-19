import mongoose from 'mongoose';

export interface IRefreshToken extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  revokedAt?: Date;
  replacedBy?: mongoose.Types.ObjectId;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new mongoose.Schema<IRefreshToken>(
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

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
