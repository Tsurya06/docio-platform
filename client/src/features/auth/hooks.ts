import { useCallback } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';

/**
 * Auth-flow hooks shared by Login / Register / ForgotPassword / ResetPassword.
 */

/**
 * Returns the `?redirect=...` query param (if any) and validates it against a small allowlist.
 */
export function usePostLoginRedirect(): string | null {
  const [params] = useSearchParams();
  const raw = params.get('redirect');
  if (raw && /^\/app(\/|$)/.test(raw)) return raw;
  return null;
}

interface ServerErrorShape {
  status?: number | string;
  data?: {
    message?: string;
    error?: {
      message?: string;
      code?: string;
    };
  };
}

/**
 * Extracts a human-readable message from an RTK Query error shape.
 */
export function useServerError() {
  return useCallback((err: any, fallback = 'Something went wrong'): string => {
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
 * After a successful flow that automatically logs the user in, send them to their landing page or redirect path.
 */
export function useStepperSubmit() {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    (path: string): void => {
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect');
      const safe = redirect && /^\/app(\/|$)/.test(redirect) ? redirect : path;
      navigate(safe, { replace: true });
    },
    [navigate, location.search],
  );
}
