import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CLIENT_ORIGIN: z.string().optional(),

  // JWT — access token is short-lived (15 min), refresh token is 7 days. The refresh secret
  // doubles as a pepper for hashed refresh tokens in the DB (see utils/token.js).
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7),

  // Bcrypt cost — 12 is the 2024 sweet spot: fast enough for user login, painful enough to deter
  // cracking of stolen hashes. Bump to 13–14 if you have headroom; never below 10 in production.
  BCRYPT_COST: z.coerce.number().int().min(8).max(15).default(12),

  // Cookies — 'lax' works for cross-port localhost dev and same-site prod. Set 'strict' when
  // frontend and API share the same origin. COOKIE_DOMAIN is for cross-subdomain deployments.
  COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().optional(),

  // Application URLs — used in email links and (Step 12) for CORS defaults.
  PUBLIC_APP_URL: z.string().url().default('http://localhost:5173'),

  // Password reset — short-lived (15 min default), hashed + DB-stored similarly to refresh tokens.
  PASSWORD_RESET_EXPIRES_IN_MIN: z.coerce.number().int().positive().default(15),

  // MailerSend API Token for HTTP API (optional - if not set, falls back to SMTP or dev logger)
  MAILERSEND_API_TOKEN: z.string().optional(),

  // Mail — SMTP_* are optional; if SMTP_HOST is unset, the mailer falls back to a dev logger
  // that prints the reset URL into Pino logs. Production deployments configure SMTP_* to send real mail.
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