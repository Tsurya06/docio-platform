import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    email: z.string().email('Invalid email').max(255).toLowerCase(),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    role: z.enum(['patient', 'doctor']),
    phone: z.string().trim().max(30).optional(),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email().toLowerCase(),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
  }),
};
