import { z } from 'zod';

/**
 * Patient-side Zod schemas with inferred TypeScript types.
 */
export const bookingSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Reason must be at least 5 characters')
    .max(500, 'Keep the reason under 500 characters'),
});
export type BookingInput = z.infer<typeof bookingSchema>;

export const genderEnum = z.enum(['male', 'female', 'other', 'prefer-not-to-say']);
export const bloodGroupEnum = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

export const profileUpdateSchema = z.object({
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  gender: genderEnum.optional().or(z.literal('')),
  bloodGroup: bloodGroupEnum.optional().or(z.literal('')),
  phone: z
    .string()
    .max(20, 'Phone is too long')
    .optional()
    .or(z.literal('')),
  address: z
    .object({
      street: z.string().max(200).optional().or(z.literal('')),
      city: z.string().max(100).optional().or(z.literal('')),
      state: z.string().max(100).optional().or(z.literal('')),
      zip: z.string().max(20).optional().or(z.literal('')),
      country: z.string().max(100).optional().or(z.literal('')),
    })
    .partial()
    .optional(),
  medicalHistory: z.array(z.string().max(200)).max(50).optional(),
  allergies: z.array(z.string().max(100)).max(50).optional(),
  emergencyContact: z
    .object({
      name: z.string().max(120).optional().or(z.literal('')),
      phone: z.string().max(20).optional().or(z.literal('')),
    })
    .partial()
    .optional(),
});
export type PatientProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const cancelSchema = z.object({
  cancelReason: z
    .string()
    .max(500, 'Keep the reason under 500 characters')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
});
export type CancelInput = z.infer<typeof cancelSchema>;
