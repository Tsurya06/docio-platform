import mongoose from 'mongoose';

const WORKING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    qualifications: [{ type: String, maxlength: 200 }],
    experienceYears: { type: Number, min: 0, max: 80 },
    consultationFee: { type: Number, min: 0, default: 0 },
    bio: { type: String, maxlength: 2000 },
    avatar: { type: String },
    workingDays: [{ type: String, enum: WORKING_DAYS }],
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
    },
    slotDuration: { type: Number, min: 15, max: 120, default: 30 },
    isApproved: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalAppointments: { type: Number, default: 0 },
  },
  { timestamps: true },
);

/**
 * Text index for name + specialization + bio + qualifications search.
 * The `name` field lives on the User collection, so we denormalize it into a queryable
 * field at write time via a pre-save hook would be over-engineering — instead, Step 5's
 * public search joins via $lookup when name-field search is required.
 *
 * For pure specialization/bio/qualifications search (most common case), this index is enough.
 */
doctorSchema.index({ specialization: 'text', bio: 'text', qualifications: 'text' });
doctorSchema.index({ isApproved: 1, isActive: 1 });

doctorSchema.methods.toProfile = function toProfile() {
  return {
    _id: String(this._id),
    userId: String(this.userId),
    specialization: this.specialization,
    qualifications: this.qualifications ?? [],
    experienceYears: this.experienceYears ?? null,
    consultationFee: this.consultationFee ?? 0,
    bio: this.bio ?? null,
    avatar: this.avatar ?? null,
    workingDays: this.workingDays ?? [],
    workingHours: this.workingHours ?? { start: '09:00', end: '17:00' },
    slotDuration: this.slotDuration ?? 30,
    isApproved: this.isApproved,
    isActive: this.isActive,
    rating: this.rating ?? 0,
    totalAppointments: this.totalAppointments ?? 0,
  };
};

/**
 * Public projection (admin approval + active tenant). Used by Step 5's public search.
 * Excludes internal bookkeeping (`isApproved` is implicit — public users only see approved).
 */
doctorSchema.methods.toPublic = function toPublic() {
  return {
    _id: String(this._id),
    specialization: this.specialization,
    qualifications: this.qualifications ?? [],
    experienceYears: this.experienceYears ?? null,
    consultationFee: this.consultationFee ?? 0,
    bio: this.bio ?? null,
    avatar: this.avatar ?? null,
    rating: this.rating ?? 0,
    totalAppointments: this.totalAppointments ?? 0,
    workingDays: this.workingDays ?? [],
    workingHours: this.workingHours ?? { start: '09:00', end: '17:00' },
    slotDuration: this.slotDuration ?? 30,
  };
};

export const WORKING_DAY_VALUES = WORKING_DAYS;
export const Doctor = mongoose.model('Doctor', doctorSchema);
