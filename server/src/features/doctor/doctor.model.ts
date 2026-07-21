import mongoose from 'mongoose';

const WORKING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface IDoctorMethods {
  toProfile(): {
    _id: string;
    userId: string;
    specialization: string;
    qualifications: string[];
    experienceYears: number | null;
    consultationFee: number;
    bio: string | null;
    avatar: string | null;
    workingDays: string[];
    workingHours: { start: string; end: string };
    slotDuration: number;
    isApproved: boolean;
    isActive: boolean;
    rating: number;
    totalAppointments: number;
  };
  toPublic(): {
    _id: string;
    user?: { _id: string; firstName: string; lastName?: string; avatar?: string } | null;
    specialization: string;
    qualifications: string[];
    experienceYears: number | null;
    consultationFee: number;
    bio: string | null;
    avatar: string | null;
    rating: number;
    totalAppointments: number;
    workingDays: string[];
    workingHours: { start: string; end: string };
    slotDuration: number;
  };
}

export interface IDoctor extends mongoose.Document, IDoctorMethods {
  userId: mongoose.Types.ObjectId;
  specialization: string;
  qualifications: string[];
  experienceYears?: number;
  consultationFee: number;
  bio?: string;
  avatar?: string;
  workingDays: string[];
  workingHours: { start: string; end: string };
  slotDuration: number;
  isApproved: boolean;
  isActive: boolean;
  rating: number;
  totalAppointments: number;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new mongoose.Schema<IDoctor, mongoose.Model<IDoctor, {}, IDoctorMethods>, IDoctorMethods>(
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

doctorSchema.index({ specialization: 'text', bio: 'text', qualifications: 'text' });
doctorSchema.index({ isApproved: 1, isActive: 1 });

doctorSchema.methods.toProfile = function toProfile(this: IDoctor) {
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

doctorSchema.methods.toPublic = function toPublic(this: IDoctor) {
  const user = this.populated('userId') ? (this.userId as any) : null;
  return {
    _id: String(this._id),
    user: user
      ? {
          _id: String(user._id),
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar ?? null,
        }
      : null,
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
export const Doctor = mongoose.model<IDoctor, mongoose.Model<IDoctor, {}, IDoctorMethods>>('Doctor', doctorSchema);
