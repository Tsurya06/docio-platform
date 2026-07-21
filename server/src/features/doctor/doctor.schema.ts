import { z } from 'zod';
import { WORKING_DAY_VALUES } from './doctor.model.js';

const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:MM)');

export const updateProfileSchema = {
  body: z.object({
    specialization: z.string().trim().min(2).max(100).optional(),
    bio: z.string().max(2000).optional(),
    qualifications: z.array(z.string().max(200)).max(20).optional(),
    consultationFee: z.number().min(0).max(100000).optional(),
  }),
};

export const updateAvailabilitySchema = {
  body: z.object({
    workingDays: z.array(z.enum(WORKING_DAY_VALUES as [string, ...string[]])).min(1, 'At least one working day required'),
    workingHours: z.object({
      start: timeStr,
      end: timeStr,
    }),
    slotDuration: z.number().int().min(15).max(120),
  }),
};

export const searchDoctorsSchema = {
  query: z.object({
    search: z.string().trim().max(200).optional(),
    specialization: z.string().trim().max(100).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(10),
    sort: z.enum(['rating', 'experienceYears', 'consultationFee', 'totalAppointments']).default('rating'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
};
