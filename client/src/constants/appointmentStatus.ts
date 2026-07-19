import type { AppointmentStatus } from '../types/index.js';

/**
 * Status enum and presentation metadata for the appointment status field. The status
 * strings mirror the backend `APPOINTMENT_STATUS` enum exactly.
 */
export const STATUS: Readonly<Record<string, AppointmentStatus>> = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
});

type BadgeStatus = 'warning' | 'processing' | 'success' | 'default' | 'error';

export interface StatusMeta {
  label: string;
  badge: BadgeStatus;
}

export const STATUS_META: Readonly<Record<AppointmentStatus, StatusMeta>> = Object.freeze({
  pending: { label: 'Pending', badge: 'warning' },
  confirmed: { label: 'Confirmed', badge: 'processing' },
  completed: { label: 'Completed', badge: 'success' },
  cancelled: { label: 'Cancelled', badge: 'default' },
  rejected: { label: 'Rejected', badge: 'error' },
});

export const ACTIVE_STATUSES: readonly AppointmentStatus[] = Object.freeze(['pending', 'confirmed']);

export const STATUS_FLOW: Readonly<Record<AppointmentStatus, AppointmentStatus[]>> = Object.freeze({
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  rejected: [],
});
