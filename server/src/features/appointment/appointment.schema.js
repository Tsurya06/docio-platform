import { z } from 'zod';
import { APPOINTMENT_STATUS } from './appointment.model.js';

const timeStr = z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM in 24-hour format');
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

/**
 * Create schema enforces that `date` and `startTime` are future values — services do the
 * actual future-check using the doctor's local day, but here we ensure format primitives
 * are correct before reaching the service layer.
 *
 * Frontend will reuse the same shape (Step 12-13) so the contract is symmetric.
 */
export const createAppointmentSchema = {
  body: z.object({
    doctorId: z.string().length(24, 'Invalid doctor id'),
    appointmentDate: dateStr,
    startTime: timeStr,
    reason: z.string().trim().min(5, 'Reason must be at least 5 characters').max(500),
  }),
};

export const cancelAppointmentSchema = {
  body: z.object({
    // Named `cancelReason` to match the model field + the client payload — the model stores
    // `cancelReason`, and the client sends `cancelReason`. (Previously `reason`, which silently
    // dropped the patient's typed reason at the route boundary.)
    cancelReason: z.string().trim().max(500).optional(),
  }),
};

/**
 * Doctor appointment-management schema (Step 8). `action` is a closed union so a typo
 * ('confrim') fails validation loudly at the route boundary instead of silently 500ing.
 */
export const manageAppointmentSchema = {
  body: z.object({
    action: z.enum(['confirm', 'reject', 'complete']),
    notes: z.string().trim().max(2000).optional(),
  }),
};

/**
 * Query schema for appointment listings. Shared by patient (Step 7) and doctor (Step 8)
 * history endpoints — same shape, different scope.
 */
export const listAppointmentsSchema = {
  query: z.object({
    status: z.enum(APPOINTMENT_STATUS).optional(),
    date: dateStr.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
  }),
};

/**
 * Step 6 availability query — `date` is mandatory. Reusing the `dateStr` regex keeps
 * every date-accepting endpoint in the codebase using the same format contract.
 */
export const availabilityQuerySchema = {
  query: z.object({
    date: dateStr,
  }),
};
