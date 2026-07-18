import { z } from 'zod';

/**
 * Zod schemas for auth flows. Kept deliberately narrower than the backend's: the backend
 * is the source of truth, so client-side schemas only cover what the form can submit
 * (the server will re-validate and reject with the exact code). The `role` field in
 * `registerSchema` is selectable but excludes admin — creating an admin account is the
 * one role we never accept from a public form.
 */
const emailField = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email')
  .max(254, 'Email is too long');

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    role: z.enum(['patient', 'doctor']),
    email: emailField,
    password: passwordField,
    firstName: z.string().min(1, 'First name is required').max(60),
    lastName: z.string().min(1, 'Last name is required').max(60),
    phone: z
      .string()
      .max(20, 'Phone is too long')
      .optional()
      .or(z.literal(''))
      .transform((v) => (v ? v : undefined)),
  })
  .refine((data) => data, { message: 'Invalid registration' });

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });
