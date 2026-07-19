import { z } from 'zod';

/**
 * Doctor-side Zod schemas with inferred TypeScript types.
 */
export const MANAGE_ACTIONS = Object.freeze(['confirm', 'reject', 'complete'] as const);
export type ManageAction = (typeof MANAGE_ACTIONS)[number];

export const manageActionSchema = z.enum(['confirm', 'reject', 'complete']);

export const profileUpdateSchema = z.object({
  specialization: z.string().trim().min(2, 'Specialization must be at least 2 characters').max(100, 'Keep under 100 characters').optional(),
  bio: z.string().max(2000, 'Bio is too long').optional(),
  qualifications: z.array(z.string().max(200)).max(20).optional(),
  consultationFee: z.number().min(0, 'Fee cannot be negative').max(100000).optional(),
});
export type DoctorProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
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
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
