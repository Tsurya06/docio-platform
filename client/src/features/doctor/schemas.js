import { z } from 'zod';

/**
 * Doctor-side Zod schemas. Mirrors the backend's `doctor.schema.js` field names and
 * enum values exactly so a single change at either end is caught symmetrically:
 *
 *   - `consultationFee` (NOT `fee`): backend stores under this name, exposes via
 *     `toProfile()` / `toPublic()`, and accepts it on PATCH /doctors/me.
 *   - `workingDays` weekday enum: backend uses capitalized three-letter values
 *     (`'Mon'`, `'Tue'`, ...). The frontend used lowercase in Step 14, which silently
 *     400'd on save. Aligned here.
 *   - `slotDuration` min 15 / max 120: backend clamps the same range — letting the
 *     frontend pick 5 here would always fail server-side.
 *
 * `availabilitySchema` is PUT (full unit replacement not PATCH), so every field is
 * required end-to-end; the form's per-field `required` rules mirror that.
 */
export const MANAGE_ACTIONS = Object.freeze(['confirm', 'reject', 'complete']);

export const manageActionSchema = z.enum(['confirm', 'reject', 'complete']);

export const profileUpdateSchema = z.object({
  specialization: z.string().trim().min(2, 'Specialization must be at least 2 characters').max(100, 'Keep under 100 characters').optional(),
  bio: z.string().max(2000, 'Bio is too long').optional(),
  qualifications: z.array(z.string().max(200)).max(20).optional(),
  consultationFee: z.number().min(0, 'Fee cannot be negative').max(100000).optional(),
});

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const availabilitySchema = z
  .object({
    workingDays: z.array(z.enum(WEEKDAYS)).min(1, 'Pick at least one working day'),
    workingHours: z.object({
      start: z.string().regex(TIME_RE, 'Use HH:MM'),
      end: z.string().regex(TIME_RE, 'Use HH:MM'),
    }),
    slotDuration: z.number().int().min(15, 'Minimum 15 minutes').max(120, 'Maximum 2 hours'),
  })
  .refine((data) => data.workingHours.start < data.workingHours.end, {
    message: 'Start must be earlier than end',
    path: ['workingHours', 'end'],
  });
