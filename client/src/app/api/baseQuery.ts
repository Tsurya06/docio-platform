import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

/**
 * Access token lives in module memory — intentionally *not* in Redux or localStorage.
 *
 * Why: persistence across reloads would let an XSS payload steal a long-lived credential
 * from a reachable store. By keeping it in module scope, the only way to exfiltrate it is
 * to run during the session that fetched it, and the only thing persisted is the
 * httpOnly refresh cookie (not readable from JS).
 */
let accessToken: string | null = null;
let refreshing: Promise<string> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
}

const RAW_BASE_URL = ((import.meta.env.VITE_API_URL as string) || '').trim().replace(/\/$/, '');
export const BASE_URL: string = RAW_BASE_URL
  ? (RAW_BASE_URL.endsWith('/api/v1') ? RAW_BASE_URL : `${RAW_BASE_URL}/api/v1`)
  : '/api/v1';

/**
 * Inner fetchBaseQuery — talks to the API with the in-memory access token in the
 * Authorization header. The backend reads `req.user` from this header; cookies carry
 * the refresh token only.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
    return headers;
  },
});

interface RefreshBody {
  data?: {
    accessToken?: string;
    user?: Record<string, unknown>;
  };
}

/**
 * Issue a refresh against `/auth/refresh-token`. Serialized so concurrent 401s share
 * a single in-flight refresh.
 */
async function doRefresh(api: Parameters<BaseQueryFn>[1]): Promise<string> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`refresh failed: ${res.status}`);
    }
    const body = (await res.json()) as RefreshBody;
    const newToken = body?.data?.accessToken;
    if (!newToken) throw new Error('refresh response missing accessToken');
    accessToken = newToken;
    (api as { dispatch: (action: unknown) => void }).dispatch({
      type: 'auth/setCredentials',
      payload: { user: body?.data?.user ?? null },
    });
    return newToken;
  })();
  try {
    return await refreshing;
  } finally {
    refreshing = null;
  }
}

function isUnauthorized(result: { error?: FetchBaseQueryError }): boolean {
  return (
    !!result.error &&
    result.error.status === 401 &&
    !(result.error.data as { error?: { code?: string } } | undefined)?.error?.code?.includes('INVALID_REFRESH_TOKEN')
  );
}

/**
 * baseQuery wrapper: try the request; on a 401 that looks like an expired access token,
 * refresh once and retry.
 */
export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (isUnauthorized(result)) {
    try {
      await doRefresh(api);
      result = await rawBaseQuery(args, api, extraOptions);
    } catch {
      /* leave the original 401 in place */
    }
  }
  return result;
};
