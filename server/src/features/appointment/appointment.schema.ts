import { z } from 'zod';
import { APPOINTMENT_STATUS } from './appointment.model.js';

const timeStr = z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM in 24-hour format');
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

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
    cancelReason: z.string().trim().max(500).optional(),
  }),
};

export const manageAppointmentSchema = {
  body: z.object({
    action: z.enum(['confirm', 'reject', 'complete']),
    notes: z.string().trim().max(2000).optional(),
  }),
};

export const listAppointmentsSchema = {
  query: z.object({
    status: z.enum(APPOINTMENT_STATUS as any as [string, ...string[]]).optional(),
    date: dateStr.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
  }),
};

export const availabilityQuerySchema = {
  query: z.object({
    date: dateStr,
  }),
};
