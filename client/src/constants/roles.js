/**
 * Role constants shared between route guards, UI labels, and any place that needs to
 * branch on the user's role. Strings match the backend `role` enum exactly so we can
 * pass them through to API calls without translation. Keep the array order in the
 * `ROLES` constant stable — preference is "doctors first, then patients, then admins",
 * matching the listing order of admin dashboards.
 */
export const PATIENT = 'patient';
export const DOCTOR = 'doctor';
export const ADMIN = 'admin';

export const ROLES = Object.freeze([PATIENT, DOCTOR, ADMIN]);

export const ROLE_LABELS = Object.freeze({
  patient: 'Patient',
  doctor: 'Doctor',
  admin: 'Administrator',
});
