import { CalendarOutlined, TeamOutlined, DashboardOutlined, UserOutlined, ProfileOutlined } from '@ant-design/icons';
import type { NavItem } from '../types/index.js';
import { PATIENT, DOCTOR, ADMIN } from './roles.js';
import type { UserRole } from '../types/index.js';

/**
 * Per-role nav constants. `path` is the prefix used to derive the selected menu key.
 */
export const PATIENT_NAV: NavItem[] = [
  { label: 'Appointments', path: '/app/patient/appointments', icon: <CalendarOutlined /> },
  { label: 'Find a doctor', path: '/app/patient/find-a-doctor', icon: <TeamOutlined /> },
  { label: 'Profile', path: '/app/patient/profile', icon: <UserOutlined /> },
];

export const DOCTOR_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/app/doctor/dashboard', icon: <DashboardOutlined /> },
  { label: 'Schedule', path: '/app/doctor/schedule', icon: <CalendarOutlined /> },
  { label: 'Profile', path: '/app/doctor/profile', icon: <ProfileOutlined /> },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/app/admin/dashboard', icon: <DashboardOutlined /> },
  { label: 'Doctors', path: '/app/admin/doctors', icon: <TeamOutlined /> },
  { label: 'Patients', path: '/app/admin/patients', icon: <UserOutlined /> },
  { label: 'Appointments', path: '/app/admin/appointments', icon: <CalendarOutlined /> },
];

export function navForRole(role: UserRole): NavItem[] {
  if (role === PATIENT) return PATIENT_NAV;
  if (role === DOCTOR) return DOCTOR_NAV;
  if (role === ADMIN) return ADMIN_NAV;
  return [];
}
