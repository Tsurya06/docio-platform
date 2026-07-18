import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      required: true,
      index: true,
    },
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    lastName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 30 },
    avatar: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

/**
 * Hash password on create and on explicit change. Only fires when `this.isModified('password')`,
 * so reads, status updates, and lastLogin writes do not trigger rehashing.
 *
 * Alternative considered: a `pre('findOneAndUpdate')` hook that hashes when `$set.password` is present.
 * Rejected — `findOneAndUpdate` skips all Mongoose document middleware silently, which has bitten
 * teams in the past. Step 10's change-password flow will route via `.save()` instead, so this hook fires.
 */
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, env.BCRYPT_COST);
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSanitized = function toSanitized() {
  return {
    _id: String(this._id),
    email: this.email,
    role: this.role,
    firstName: this.firstName,
    lastName: this.lastName,
    phone: this.phone,
    avatar: this.avatar,
    isEmailVerified: this.isEmailVerified,
    isActive: this.isActive,
  };
};

export const User = mongoose.model('User', userSchema);
