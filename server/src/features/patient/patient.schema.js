import { z } from 'zod';

/**
 * Normalize a PATCH body so empty strings and nulls are treated as "not provided" rather than
 * as a value to store or reject.
 *
 * The client always sends every optional field — a cleared/never-set DatePicker yields `null`
 * → the payload builder coerces that to `''`, and cleared enums/text inputs likewise send `''`.
 * Without stripping, `z.string().date()` 400s on `''`, `z.enum(...)` 400s on `''`, and valid
 * optional strings would `$set` empty strings into Mongo. Stripping recursively turns those into
 * `undefined`/absent keys, which `findOneAndUpdate({ $set: patch })` simply ignores — leaving
 * the stored value unchanged. This is the PATCH "leave it as-is" semantic the UI assumes.
 *
 * Arrays are preserved (including `[]`), so "no medical history" still clears the list to empty.
 */
function stripEmpty(val) {
  if (val === '' || val === null) return undefined;
  if (Array.isArray(val)) return val.map(stripEmpty);
  if (val && typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      const cleaned = stripEmpty(v);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }
  return val;
}

/**
 * Patient profile update schema. All fields optional (PATCH semantics) — patients complete
 * their profile progressively and may update individual sections any time.
 *
 * Date handling: accepts `YYYY-MM-DD` (Zod's `.date()`), stored as a Mongoose Date.
 * The model serializer converts back to `YYYY-MM-DD` on response.
 */
export const updateProfileSchema = {
  body: z.preprocess(stripEmpty, z.object({
    dateOfBirth: z.string().date().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    bloodGroup: z.string().max(10).optional(),
    address: z
      .object({
        street: z.string().max(200).optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(100).optional(),
        zip: z.string().max(20).optional(),
        country: z.string().max(100).optional(),
      })
      .optional(),
    medicalHistory: z.array(z.string().max(500)).max(50).optional(),
    allergies: z.array(z.string().max(200)).max(50).optional(),
    emergencyContact: z
      .object({
        name: z.string().max(100).optional(),
        phone: z.string().max(30).optional(),
      })
      .optional(),
  })),
};
