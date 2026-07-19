import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
  toSanitized(): {
    _id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    isEmailVerified: boolean;
    isActive: boolean;
  };
}

export interface IUser extends mongoose.Document, IUserMethods {
  email: string;
  password?: string;
  role: 'patient' | 'doctor' | 'admin';
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  refreshTokenHash?: string;
  refreshTokenExpiresAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser, mongoose.Model<IUser, {}, IUserMethods>, IUserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    refreshTokenHash: { type: String },
    refreshTokenExpiresAt: { type: Date },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword(this: IUser) {
  if (!this.isModified('password')) return;
  if (this.password) {
    this.password = await bcrypt.hash(this.password, env.BCRYPT_COST);
  }
});

userSchema.methods.comparePassword = async function comparePassword(this: IUser, candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password || '');
};

userSchema.methods.toSanitized = function toSanitized(this: IUser) {
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

export const User = mongoose.model<IUser, mongoose.Model<IUser, {}, IUserMethods>>('User', userSchema);
