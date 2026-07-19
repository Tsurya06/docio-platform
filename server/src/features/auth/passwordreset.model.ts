import mongoose from 'mongoose';

export interface IPasswordReset extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetSchema = new mongoose.Schema<IPasswordReset>(
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

export const PasswordReset = mongoose.model<IPasswordReset>('PasswordReset', passwordResetSchema);
