import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuthStatus, selectCurrentUser } from '../features/auth/authSlice.js';
import Loading from '../components/common/Loading.jsx';
import RoleGuard from '../components/common/RoleGuard.jsx';
import { PATIENT, DOCTOR, ADMIN } from '../constants/roles.js';
import { redirectForRole } from '../features/auth/pages/LoginPage.jsx';

/**
 * ProtectedRoute gates a subtree behind (a) being authenticated and (optionally) (b)
 * belonging to one of the listed roles. On boot the auth status is `unknown`; since
 * `App.jsx` will have already fired the `getMe` query by the time any child renders,
 * we just show a Loading spinner until the status resolves. We don't *re-fire* getMe
 * here — the cache is global and we'd just thrash.
 *
 * Alternative: redirect silently on `anonymous`. Rejected — we need to preserve the
 * `?redirect=...` link for cross-app deep links, which is best done here vs letting
 * each page build their own.
 */
export default function ProtectedRoute({ roles, children }) {
  const status = useSelector(selectAuthStatus);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  if (status === 'unknown') return <Loading label="Restoring your session…" />;
  if (status === 'anonymous') {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (roles && roles.length > 0 && (!user || !roles.includes(user.role))) {
    // The user is signed in but as the wrong role for this subtree. Bounce them to their
    // own landing page silently — they shouldn't see a scary Forbidden card for their
    // own app's homepage just because they typed in a URL meant for another role.
    return <Navigate to={redirectForRole(user?.role, '/app')} replace />;
  }
  if (roles && roles.length > 0) {
    return <RoleGuard roles={roles}>{children}</RoleGuard>;
  }
  return children ?? null;
}

/**
 * Convenience presets — used by AppRoutes to keep the auth gates readable.
 */
export const PatientRoute = (props) => <ProtectedRoute roles={[PATIENT]} {...props} />;
export const DoctorRoute = (props) => <ProtectedRoute roles={[DOCTOR]} {...props} />;
export const AdminRoute = (props) => <ProtectedRoute roles={[ADMIN]} {...props} />;
