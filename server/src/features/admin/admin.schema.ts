import { z } from 'zod';
import { APPOINTMENT_STATUS } from '../appointment/appointment.model.js';

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

export const listAppointmentsSchema = {
  query: z.object({
    status: z.preprocess(
      (v) => {
        if (v === undefined || v === null || v === '') return undefined;
        return Array.isArray(v) ? v : [v];
      },
      z.array(z.enum(APPOINTMENT_STATUS as any as [string, ...string[]])).optional(),
    ),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
  }),
};
