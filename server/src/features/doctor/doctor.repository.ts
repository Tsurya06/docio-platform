import { Doctor, type IDoctor } from './doctor.model.js';
import { escapeRegex } from '../../utils/regex.js';
import type { HydratedDocument } from 'mongoose';

export const doctorRepository = {
  findByUserId(userId: string | object) {
    return Doctor.findOne({ userId });
  },

  findById(id: string | object) {
    return Doctor.findById(id);
  },

  findPublicById(id: string | object) {
    return Doctor.findOne(
      { _id: id, isApproved: true, isActive: true },
      { userId: 0, isApproved: 0, isActive: 0 },
    );
  },

  createShell(userId: string | object) {
    return Doctor.create({ userId, specialization: 'Unspecified' });
  },

  async updateByUserId(userId: string | object, patch: any): Promise<HydratedDocument<IDoctor> | null> {
    return Doctor.findOneAndUpdate({ userId }, { $set: patch }, { new: true });
  },

  async updateAvailabilityByUserId(userId: string | object, patch: any): Promise<HydratedDocument<IDoctor> | null> {
    return Doctor.findOneAndUpdate({ userId }, { $set: patch }, { new: true });
  },

  async search({
    search,
    specialization,
    page,
    limit,
    sort,
    order,
  }: {
    search?: string;
    specialization?: string;
    page: number;
    limit: number;
    sort: string;
    order: 'asc' | 'desc';
  }) {
    const filter: any = { isApproved: true, isActive: true };
    if (specialization) filter.specialization = specialization;

    if (search) {
      const re = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { specialization: re },
        { bio: re },
        { qualifications: re },
      ];
    }

    const sortSpec: any = { [sort]: order === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      Doctor.find(filter, { userId: 0, isApproved: 0, isActive: 0 })
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit),
      Doctor.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  },

  async listForAdmin({
    isApproved,
    specialization,
    page,
    limit,
  }: {
    isApproved?: boolean;
    specialization?: string;
    page: number;
    limit: number;
  }) {
    const filter: any = {};
    if (typeof isApproved === 'boolean') filter.isApproved = isApproved;
    if (specialization) filter.specialization = specialization;

    const [items, total] = await Promise.all([
      Doctor.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'firstName lastName email isActive'),
      Doctor.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  },

  async setApproved(id: string | object, isApproved: boolean) {
    return Doctor.findByIdAndUpdate(id, { $set: { isApproved } }, { new: true })
      .populate('userId', 'firstName lastName email isActive lastLoginAt');
  },

  async setActive(id: string | object, isActive: boolean) {
    return Doctor.findByIdAndUpdate(id, { $set: { isActive } }, { new: true })
      .populate('userId', 'firstName lastName email isActive lastLoginAt');
  },

  async incrementTotalAppointments(doctorId: string | object, by = 1) {
    return Doctor.updateOne({ _id: doctorId }, { $inc: { totalAppointments: by } });
  },
};
