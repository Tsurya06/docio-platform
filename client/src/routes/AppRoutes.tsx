import { Routes, Route, Navigate } from 'react-router-dom';
import { useGetMeQuery } from '../app/api/authApi.js';
import AppLayout from '../components/layout/AppLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import { navForRole } from '../constants/navItems.js';
import type { UserRole } from '../types/index.js';

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
 * AppRoutes — the single route table.
 */
function BootGate() {
  useGetMeQuery();
  return null;
}

interface RoleRootProps {
  role: UserRole;
}

function RoleRoot({ role }: RoleRootProps) {
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

        <Route path="/app" element={<Navigate to="/login" replace />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
