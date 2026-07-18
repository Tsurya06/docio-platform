/**
 * Status enum and presentation metadata for the appointment status field. The status
 * strings mirror the backend `APPOINTMENT_STATUS` enum exactly; the badge color maps to
 * AntD's `<Badge status="...">` shorthand rather than a custom palette so we don't fight
 * AntD's theme tokens. `STATUS_FLOW` documents the legal transitions for UI hints (e.g.,
 * disabled buttons); the backend is the source of truth, so this is informational only.
 */
export const STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
});

export const STATUS_META = Object.freeze({
  pending: { label: 'Pending', badge: 'warning' },
  confirmed: { label: 'Confirmed', badge: 'processing' },
  completed: { label: 'Completed', badge: 'success' },
  cancelled: { label: 'Cancelled', badge: 'default' },
  rejected: { label: 'Rejected', badge: 'error' },
});

export const ACTIVE_STATUSES = Object.freeze(['pending', 'confirmed']);

export const STATUS_FLOW = Object.freeze({
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  rejected: [],
});
