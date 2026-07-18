import { CalendarOutlined, TeamOutlined, DashboardOutlined, UserOutlined, ProfileOutlined } from '@ant-design/icons';
import { PATIENT, DOCTOR, ADMIN } from './roles.js';

/**
 * Per-role nav constants. `path` is the prefix used to derive the selected menu key —
 * keep each path *exclusive* (no path is a prefix of another path on the same role's
 * menu) so `AppLayout.selectedKey` resolution walks correctly.
 *
 * The routes themselves are wired in `AppRoutes.jsx`; this file only owns the menu
 * presentation (label + icon + path). If a new page is added, change it here and the
 * menu will update without touching the layout component.
 */
export const PATIENT_NAV = [
  { label: 'Appointments', path: '/app/patient/appointments', icon: <CalendarOutlined /> },
  { label: 'Find a doctor', path: '/app/patient/find-a-doctor', icon: <TeamOutlined /> },
  { label: 'Profile', path: '/app/patient/profile', icon: <UserOutlined /> },
];

export const DOCTOR_NAV = [
  { label: 'Dashboard', path: '/app/doctor/dashboard', icon: <DashboardOutlined /> },
  { label: 'Schedule', path: '/app/doctor/schedule', icon: <CalendarOutlined /> },
  { label: 'Profile', path: '/app/doctor/profile', icon: <ProfileOutlined /> },
];

export const ADMIN_NAV = [
  { label: 'Dashboard', path: '/app/admin/dashboard', icon: <DashboardOutlined /> },
  { label: 'Doctors', path: '/app/admin/doctors', icon: <TeamOutlined /> },
  { label: 'Patients', path: '/app/admin/patients', icon: <UserOutlined /> },
  { label: 'Appointments', path: '/app/admin/appointments', icon: <CalendarOutlined /> },
];

export function navForRole(role) {
  if (role === PATIENT) return PATIENT_NAV;
  if (role === DOCTOR) return DOCTOR_NAV;
  if (role === ADMIN) return ADMIN_NAV;
  return [];
}
