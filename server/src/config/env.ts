import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CLIENT_ORIGIN: z.string().optional(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7),

  // Bcrypt
  BCRYPT_COST: z.coerce.number().int().min(8).max(15).default(12),

  // Cookies
  COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().optional(),

  // App URLs
  PUBLIC_APP_URL: z.string().url().default('http://localhost:5173'),

  // Password reset
  PASSWORD_RESET_EXPIRES_IN_MIN: z.coerce.number().int().positive().default(15),

  // MailerSend API Token
  MAILERSEND_API_TOKEN: z.string().optional(),

  // Mail
  MAIL_FROM: z.string().email().default('noreply@docio.test'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
