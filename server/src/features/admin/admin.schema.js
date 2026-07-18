import { z } from 'zod';
import { APPOINTMENT_STATUS } from '../appointment/appointment.model.js';

/**
 * Admin-only request shapes. Every admin endpoint is gated by `requireRole('admin')`; these
 * schemas just enforce that query params are well-formed.
 *
 * `isApproved` query param accepted as a literal 'true'|'false' string — URL strings are how
 * the value enters Express, and Zod strict enums document the contract at the boundary.
 */
export const listDoctorsSchema = {
  query: z.object({
    isApproved: z.enum(['true', 'false']).optional(),
    specialization: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
  }),
};

export const manageDoctorSchema = {
  body: z.object({
    action: z.enum(['approve', 'reject', 'deactivate', 'activate']),
  }),
};

export const listPatientsSchema = {
  query: z.object({
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
  }),
};

/**
 * Admin appointments status filter is a multi-select on the FE, so `status` arrives either as
 * a single value (`?status=pending`) or repeated params (`?status=pending&status=cancelled`,
 * which Express parses into an array). The preprocess coerces both forms into an array (or
 * undefined), so the service/repo can uniformly use `$in`. The patient + doctor list schemas
 * keep a single-enum `status` — their pages don't expose a multi-select.
 */
export const listAppointmentsSchema = {
  query: z.object({
    status: z.preprocess(
      (v) => {
        if (v === undefined || v === null || v === '') return undefined;
        return Array.isArray(v) ? v : [v];
      },
      z.array(z.enum(APPOINTMENT_STATUS)).optional(),
    ),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
  }),
};
