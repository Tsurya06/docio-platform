import { Routes, Route, Navigate } from 'react-router-dom';
import { useGetMeQuery } from '../app/api/authApi.js';
import AppLayout from '../components/layout/AppLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import { navForRole } from '../constants/navItems.jsx';

import LoginPage from '../features/auth/pages/LoginPage.jsx';
import RegisterPage from '../features/auth/pages/RegisterPage.jsx';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage.jsx';

import PatientAppointmentsPage from '../features/patient/pages/PatientAppointmentsPage.jsx';
import PatientFindADoctorPage from '../features/patient/pages/PatientFindADoctorPage.jsx';
import PatientProfilePage from '../features/patient/pages/PatientProfilePage.jsx';
import DoctorPublicProfilePage from '../features/patient/pages/DoctorPublicProfilePage.jsx';

import DoctorDashboardPage from '../features/doctor/pages/DoctorDashboardPage.jsx';
import DoctorSchedulePage from '../features/doctor/pages/DoctorSchedulePage.jsx';
import DoctorProfilePage from '../features/doctor/pages/DoctorProfilePage.jsx';

import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage.jsx';
import AdminDoctorsPage from '../features/admin/pages/AdminDoctorsPage.jsx';
import AdminPatientsPage from '../features/admin/pages/AdminPatientsPage.jsx';
import AdminAppointmentsPage from '../features/admin/pages/AdminAppointmentsPage.jsx';

/**
 * AppRoutes — the single route table. Startup behavior: a one-shot call to
 * `useGetMeQuery()` fires the session-rehydration request once; ProtectedRoute waits
 * on `authStatus !== 'unknown'` before letting children render. Co-locating that
 * call in a sibling `BootGate` component keeps the side effect visible in the route
 * file rather than tucked away behind a hook buried in a leaf component.
 *
 * Nested routes: each role subtree mounts `<ProtectedRoute>` + `<AppLayout>` as the
 * element of a `Route`, with role-appropriate navItems. `<AppLayout>` then renders
 * its content slot via `<Outlet>` — that's where the nested child route's element
 * shows up.
 *
 * Why not a single layout wrapping all three role subtrees: it'd force us to call
 * `navForRole(user.role)` inside the layout, but each subtree already knows the role
 * statically. Static nav also means the Sider renders correctly even before the boot
 * query resolves (no flash of empty nav while the cookie refresh kicks in).
 */
function BootGate() {
  useGetMeQuery();
  return null;
}

function RoleRoot({ role }) {
  return (
    <ProtectedRoute roles={[role]}>
      <AppLayout navItems={navForRole(role)} />
    </ProtectedRoute>
  );
}

export default function AppRoutes() {
  return (
    <>
      <BootGate />
      <Routes>
        {/* Public auth pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/" element={<Navigate to="/app" replace />} />

        {/* Patient subtree */}
        <Route path="/app/patient" element={<RoleRoot role="patient" />}>
          <Route index element={<Navigate to="/app/patient/appointments" replace />} />
          <Route path="appointments" element={<PatientAppointmentsPage />} />
          <Route path="find-a-doctor" element={<PatientFindADoctorPage />} />
          <Route path="find-a-doctor/:id" element={<DoctorPublicProfilePage />} />
          <Route path="profile" element={<PatientProfilePage />} />
        </Route>

        {/* Doctor subtree */}
        <Route path="/app/doctor" element={<RoleRoot role="doctor" />}>
          <Route index element={<Navigate to="/app/doctor/dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboardPage />} />
          <Route path="schedule" element={<DoctorSchedulePage />} />
          <Route path="profile" element={<DoctorProfilePage />} />
        </Route>

        {/* Admin subtree */}
        <Route path="/app/admin" element={<RoleRoot role="admin" />}>
          <Route index element={<Navigate to="/app/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="doctors" element={<AdminDoctorsPage />} />
          <Route path="patients" element={<AdminPatientsPage />} />
          <Route path="appointments" element={<AdminAppointmentsPage />} />
        </Route>

        {/* /app with no further path needs a logged-in user; ProtectedRoute, mounted
            on login, redirects to the role landing page via `?redirect=/app`, so we
            just bounce anyone hitting /app bare to /login (with `?redirect=/app`
            already handled by ProtectedRoute). */}
        <Route path="/app" element={<Navigate to="/login" replace />} />

        {/* Anything else: bounce to /login. ProtectedRoute handles the redirect= for
            any deep link the user might have typed in. */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
