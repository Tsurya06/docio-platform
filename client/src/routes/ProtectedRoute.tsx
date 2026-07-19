import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuthStatus, selectCurrentUser } from '../features/auth/authSlice.js';
import Loading from '../components/common/Loading.jsx';
import RoleGuard from '../components/common/RoleGuard.jsx';
import { PATIENT, DOCTOR, ADMIN } from '../constants/roles.js';
import { redirectForRole } from '../features/auth/pages/LoginPage.jsx';
import type { UserRole } from '../types/index.js';

interface Props {
  roles?: UserRole[];
  children: ReactNode;
}

/**
 * ProtectedRoute gates a subtree behind (a) being authenticated and (optionally) (b)
 * belonging to one of the listed roles.
 */
export default function ProtectedRoute({ roles, children }: Props) {
  const status = useSelector(selectAuthStatus);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  if (status === 'unknown') return <Loading label="Restoring your session…" />;
  if (status === 'anonymous') {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (roles && roles.length > 0 && (!user || !roles.includes(user.role))) {
    return <Navigate to={redirectForRole(user?.role, '/app')} replace />;
  }
  if (roles && roles.length > 0) {
    return <RoleGuard roles={roles}>{children}</RoleGuard>;
  }
  return <>{children ?? null}</>;
}

/**
 * Convenience presets — used by AppRoutes to keep the auth gates readable.
 */
export const PatientRoute = (props: Omit<Props, 'roles'>) => <ProtectedRoute roles={[PATIENT]} {...props} />;
export const DoctorRoute = (props: Omit<Props, 'roles'>) => <ProtectedRoute roles={[DOCTOR]} {...props} />;
export const AdminRoute = (props: Omit<Props, 'roles'>) => <ProtectedRoute roles={[ADMIN]} {...props} />;
