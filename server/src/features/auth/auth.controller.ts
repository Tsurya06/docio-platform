import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { env, isProduction } from '../../config/env.js';
import { getRefreshTokenTtlMs } from '../../utils/token.js';

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

function getSessionMeta(req: Request) {
  return {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  };
}

function setRefreshCookie(res: Response, rawRefresh: string): void {
  res.cookie(REFRESH_COOKIE, rawRefresh, {
    httpOnly: true,
    secure: isProduction,
    sameSite: env.COOKIE_SAMESITE,
    maxAge: getRefreshTokenTtlMs(),
    path: REFRESH_COOKIE_PATH,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: env.COOKIE_SAMESITE,
    path: REFRESH_COOKIE_PATH,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}

function stripRefreshFromPayload({ rawRefresh, ...rest }: { rawRefresh: string; [key: string]: any }) {
  return rest;
}

export async function register(req: Request, res: Response): Promise<Response> {
  const result = await authService.register(req.body, getSessionMeta(req));
  setRefreshCookie(res, result.rawRefresh);
  return res.status(201).json(ApiResponse.ok(stripRefreshFromPayload(result)));
}

export async function login(req: Request, res: Response): Promise<Response> {
  const result = await authService.login(req.body, getSessionMeta(req));
  setRefreshCookie(res, result.rawRefresh);
  return res.json(ApiResponse.ok(stripRefreshFromPayload(result)));
}

export async function refresh(req: Request, res: Response): Promise<Response> {
  const result = await authService.refresh(req.cookies?.refreshToken, getSessionMeta(req));
  setRefreshCookie(res, result.rawRefresh);
  return res.json(ApiResponse.ok(stripRefreshFromPayload(result)));
}

export async function logout(req: Request, res: Response): Promise<Response> {
  await authService.logout(req.cookies?.refreshToken);
  clearRefreshCookie(res);
  return res.json(ApiResponse.ok({}));
}

export async function getMe(req: Request, res: Response): Promise<Response> {
  const user = await authService.getMe(req.user!.id);
  return res.json(ApiResponse.ok({ user }));
}

export async function forgotPassword(req: Request, res: Response): Promise<Response> {
  await authService.forgotPassword(req.body.email);
  return res.json(
    ApiResponse.ok({
      message: 'If an account with that email exists, a reset link has been sent.',
    }),
  );
}

export async function resetPassword(req: Request, res: Response): Promise<Response> {
  await authService.resetPassword(req.body);
  return res.json(ApiResponse.ok({ message: 'Password reset successful. Please log in.' }));
}

export async function changePassword(req: Request, res: Response): Promise<Response> {
  await authService.changePassword({
    userId: req.user!.id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
    currentRawRefresh: req.cookies?.refreshToken,
  });
  return res.json(ApiResponse.ok({ message: 'Password changed.' }));
}
