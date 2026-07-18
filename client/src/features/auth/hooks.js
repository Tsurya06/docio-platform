import { useCallback } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';

/**
 * Auth-flow hooks shared by Login / Register / ForgotPassword / ResetPassword.
 * Keeping these in their own file lets each page stay declarative — no inline parsing
 * of query strings or server error envelopes at the call site.
 */

/**
 * Returns the `?redirect=...` query param (if any) and validates it against a small
 * allowlist so a malicious link can't bounce the user off to an arbitrary URL after
 * login. Falls back to the role-specific landing page handled by the page itself.
 */
export function usePostLoginRedirect() {
  const [params] = useSearchParams();
  const raw = params.get('redirect');
  // Only accept same-app paths to prevent open-redirect. Anything starting with /^/app/
  // is fair game; everything else is dropped.
  if (raw && /^\/app(\/|$)/.test(raw)) return raw;
  return null;
}

/**
 * Extracts a human-readable message from an RTK Query error shape. The server uses the
 * `{ success, error:{ code, message, details? } }` envelope — `message` is always
 * populated for ApiError throws; Zod validation failures fall back to the first
 * `details` field issue. Anything unknown falls back to `fallback`.
 *
 * Why not just `err.data.error.message`: that path is undefined for network errors,
 * timeouts, and the rare 5xx where the body was truncated. The cascade keeps us sane
 * across all of them.
 */
export function useServerError() {
  return useCallback((err, fallback = 'Something went wrong') => {
    const data = err?.data;
    const error = data?.error;
    if (error?.message) return error.message;
    if (data?.message) return data.message;
    if (typeof err?.status === 'number' && err.status === 0) {
      return 'Network error — please check your connection and try again.';
    }
    return fallback;
  }, []);
}

/**
 * After a successful flow that automatically logs the user in (login, register),
 * send them to the role landing page or the captured `?redirect=` path. Pass the
 * navigate fn explicitly to keep `useNavigate` inside the page itself.
 */
export function useStepperSubmit() {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    (path) => {
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect');
      const safe = redirect && /^\/app(\/|$)/.test(redirect) ? redirect : path;
      navigate(safe, { replace: true });
    },
    [navigate, location.search],
  );
}
