import { z } from 'zod';

function stripEmpty(val: any): any {
  if (val === '' || val === null) return undefined;
  if (Array.isArray(val)) return val.map(stripEmpty);
  if (val && typeof val === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      const cleaned = stripEmpty(v);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }
  return val;
}

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
