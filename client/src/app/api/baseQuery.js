import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Access token lives in module memory — intentionally *not* in Redux or localStorage.
 *
 * Why: persistence across reloads would let an XSS payload steal a long-lived credential
 * from a reachable store. By keeping it in module scope, the only way to exfiltrate it is
 * to run during the session that fetched it, and the only thing persisted is the
 * httpOnly refresh cookie (not readable from JS).
 *
 * Alternative: store the access token in Redux. Rejected — Redux is introspectable from
 * devtools and from any connected component; module scope is reachable only through the
 * functions that close over it.
 */
let accessToken = null;
let refreshing = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

const RAW_BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
export const BASE_URL = RAW_BASE_URL
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

/**
 * Issue a refresh against `/auth/refresh-token`. The refresh token is an httpOnly cookie,
 * so the request carries no body — the cookie is attached automatically by `credentials:
 * 'include'`. Seralized so concurrent 401s share a single in-flight refresh (otherwise
 * the second 401 would burn the just-rotated cookie and revoke the session).
 */
async function doRefresh(api) {
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
    const body = await res.json();
    const newToken = body?.data?.accessToken;
    if (!newToken) throw new Error('refresh response missing accessToken');
    accessToken = newToken;
    api.dispatch({
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

function isUnauthorized(result) {
  return (
    result.error &&
    result.error.status === 401 &&
    !result.error.data?.error?.code?.includes('INVALID_REFRESH_TOKEN')
  );
}

/**
 * baseQuery wrapper: try the request; on a 401 that looks like an expired access token
 * (i.e. not "refresh itself is bad"), refresh once and retry. Any other failure —
 * including a refresh failure — bubbles back as the original error. Logout signaling is
 * done by the consumer: the authApi `logout` endpoint and the `getMe` rejection both
 * dispatch `clearCredentials`, so we don't reach into the store here.
 */
export const baseQuery = async (args, api, extraOptions) => {
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
