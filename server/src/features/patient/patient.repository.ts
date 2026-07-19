import { Patient, type IPatient } from './patient.model.js';
import type { HydratedDocument } from 'mongoose';

export const patientRepository = {
  findByUserId(userId: string | object) {
    return Patient.findOne({ userId });
  },

  createShell(userId: string | object) {
    return Patient.create({ userId });
  },

  async updateByUserId(userId: string | object, patch: any): Promise<HydratedDocument<IPatient> | null> {
    return Patient.findOneAndUpdate({ userId }, { $set: patch }, { new: true });
  },

  async listForAdmin({ filter = {}, page, limit }: { filter?: any; page: number; limit: number }) {
    const [items, total] = await Promise.all([
      Patient.find(filter)
        .populate('userId', 'firstName lastName email isActive createdAt lastLoginAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Patient.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  },
};
