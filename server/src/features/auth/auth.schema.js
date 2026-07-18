import { z } from 'zod';

/**
 * Zod schemas for auth request shapes. Exposed to `validate.middleware.js` as a `{ body, query, params }` map.
 *
 * Why centralize per feature: when frontend Zod client schemas are needed (Step 12), the same shape
 * is reused — one source of truth per endpoint.
 *
 * Note: `admin` role is excluded from `registerSchema` — admin accounts are seeded or provisioned
 * out-of-band (Step 11). Self-serve registration as admin would be a security hole.
 */
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

/**
 * Password recovery schemas.
 *
 * Forgot-password intentionally accepts only an email and returns a generic success even when
 * the email doesn't exist — preventing account enumeration. Password minimum length matches
 * the register schema (8); max 128 prevents bcrypt DoS via multi-KB password inputs.
 */
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
