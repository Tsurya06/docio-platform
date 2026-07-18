import { authService } from './auth.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { env, isProduction } from '../../config/env.js';
import { getRefreshTokenTtlMs } from '../../utils/token.js';

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

/**
 * HTTP-skin around `authService`. Each handler does three things:
 *   1. Pull the request bits the service needs (body, cookie, session meta).
 *   2. Call the service.
 *   3. Shape the response (status code + ApiResponse wrapper + cookie set/clear).
 *
 * No business logic lives here. If you find yourself adding `if` statements that branch on
 * what the service returned, that's the service's job — move it there.
 */

function getSessionMeta(req) {
  return {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  };
}

function setRefreshCookie(res, rawRefresh) {
  res.cookie(REFRESH_COOKIE, rawRefresh, {
    httpOnly: true,
    secure: isProduction,
    sameSite: env.COOKIE_SAMESITE,
    maxAge: getRefreshTokenTtlMs(),
    path: REFRESH_COOKIE_PATH,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: env.COOKIE_SAMESITE,
    path: REFRESH_COOKIE_PATH,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}

/**
 * Strip `rawRefresh` from the response body — it lives only in the httpOnly cookie.
 * Returning it in JSON would expose the token to client JS, defeating the cookie's XSS defense.
 */
function stripRefreshFromPayload({ rawRefresh, ...rest }) {
  return rest;
}

export async function register(req, res) {
  const result = await authService.register(req.body, getSessionMeta(req));
  setRefreshCookie(res, result.rawRefresh);
  return res.status(201).json(ApiResponse.ok(stripRefreshFromPayload(result)));
}

export async function login(req, res) {
  const result = await authService.login(req.body, getSessionMeta(req));
  setRefreshCookie(res, result.rawRefresh);
  return res.json(ApiResponse.ok(stripRefreshFromPayload(result)));
}

export async function refresh(req, res) {
  const result = await authService.refresh(req.cookies?.refreshToken, getSessionMeta(req));
  setRefreshCookie(res, result.rawRefresh);
  return res.json(ApiResponse.ok(stripRefreshFromPayload(result)));
}

export async function logout(req, res) {
  await authService.logout(req.cookies?.refreshToken);
  clearRefreshCookie(res);
  return res.json(ApiResponse.ok({}));
}

export async function getMe(req, res) {
  const user = await authService.getMe(req.user.id);
  return res.json(ApiResponse.ok({ user }));
}

/**
 * Forgot password — same response shape regardless of whether the email maps to an account.
 * Frontend shows "If your email exists, you will receive a reset link" on submit. The dev-mode
 * SMTP fallback logs the reset URL into Pino logs, which is what developers test against.
 */
export async function forgotPassword(req, res) {
  await authService.forgotPassword(req.body.email);
  return res.json(
    ApiResponse.ok({
      message: 'If an account with that email exists, a reset link has been sent.',
    }),
  );
}

/**
 * Reset password — on success, the user's existing sessions are invalidated (see service). The
 * response carries no tokens; the user must navigate to /login and authenticate with the new
 * password. This is intentional — issuing a token in the reset response would let an attacker
 * who briefly obtained the email skip the "knows current password" guardrail.
 */
export async function resetPassword(req, res) {
  await authService.resetPassword(req.body);
  return res.json(ApiResponse.ok({ message: 'Password reset successful. Please log in.' }));
}

/**
 * Change password — requires an access token (route guard). The user's refresh cookie (if
 * attached) is forwarded to the service so the active session can be spared from the global
 * revocation that follows a password change.
 */
export async function changePassword(req, res) {
  await authService.changePassword({
    userId: req.user.id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
    currentRawRefresh: req.cookies?.refreshToken,
  });
  return res.json(ApiResponse.ok({ message: 'Password changed.' }));
}
