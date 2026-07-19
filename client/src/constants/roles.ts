import type { UserRole } from '../types/index.js';

/**
 * Role constants shared between route guards, UI labels, and any place that needs to
 * branch on the user's role. Strings match the backend `role` enum exactly.
 */
export const PATIENT = 'patient' as const satisfies UserRole;
export const DOCTOR = 'doctor' as const satisfies UserRole;
export const ADMIN = 'admin' as const satisfies UserRole;

export const ROLES: readonly UserRole[] = Object.freeze([PATIENT, DOCTOR, ADMIN]);

export const ROLE_LABELS: Readonly<Record<UserRole, string>> = Object.freeze({
  patient: 'Patient',
  doctor: 'Doctor',
  admin: 'Administrator',
});
