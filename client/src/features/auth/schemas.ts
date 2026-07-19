import { z } from 'zod';

/**
 * Zod schemas for auth flows with inferred TypeScript types exported.
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
export type LoginInput = z.infer<typeof loginSchema>;

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
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailField,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

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
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

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
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
