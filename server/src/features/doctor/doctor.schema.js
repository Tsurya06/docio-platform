import { z } from 'zod';
import { WORKING_DAY_VALUES } from './doctor.model.js';

const timeStr = z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM in 24-hour format');

/**
 * Doctor profile updates are split into two endpoints with distinct validation:
 *
 *  PATCH /doctors/me          — biographical/practice info a doctor maintains.
 *  PUT   /doctors/me/availability — scheduling primitives (days/hours/slot), validated
 *                                    as a complete unit since partial availability is nonsensical
 *                                    (changing days without hours leaves the doctor unbookable).
 */
export const updateProfileSchema = {
  body: z.object({
    specialization: z.string().trim().min(2).max(100).optional(),
    qualifications: z.array(z.string().max(200)).max(20).optional(),
    experienceYears: z.number().int().min(0).max(80).optional(),
    consultationFee: z.number().min(0).max(100000).optional(),
    bio: z.string().max(2000).optional(),
    avatar: z.string().url().max(500).optional(),
  }),
};

export const updateAvailabilitySchema = {
  body: z.object({
    workingDays: z.array(z.enum(WORKING_DAY_VALUES)).min(1, 'At least one working day required'),
    workingHours: z.object({
      start: timeStr,
      end: timeStr,
    }),
    slotDuration: z.number().int().min(15).max(120),
  }),
};

/**
 * Public search (Step 5). Query params validated to integers/ranges here so the
 * repository receives numeric primitives, not raw strings.
 */
export const searchDoctorsSchema = {
  query: z.object({
    search: z.string().trim().max(200).optional(),
    specialization: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(10),
    sort: z.enum(['rating', 'experienceYears', 'consultationFee', 'totalAppointments']).default('rating'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
};
