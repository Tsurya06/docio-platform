import mongoose from 'mongoose';

export const APPOINTMENT_STATUS = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];

export const ACTIVE_STATUSES = ['pending', 'confirmed'];

export interface IAppointmentMethods {
  toDetail(): {
    _id: string;
    patient: {
      _id: string;
      name: string;
    } | { _id: string };
    doctor: {
      _id: string;
      specialization?: string;
      name: string;
    } | { _id: string };
    appointmentDate: string;
    startTime: string;
    endTime: string;
    reason: string;
    notes: string | null;
    status: AppointmentStatus;
    cancelReason: string | null;
    cancelledBy: ('patient' | 'doctor' | 'admin') | null;
    cancelledAt: string | null;
    fee: number;
    paymentStatus: 'unpaid' | 'paid' | 'refunded';
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface IAppointment extends mongoose.Document, IAppointmentMethods {
  patientId: mongoose.Types.ObjectId | any;
  doctorId: mongoose.Types.ObjectId | any;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  notes?: string;
  status: AppointmentStatus;
  cancelReason?: string;
  cancelledBy?: 'patient' | 'doctor' | 'admin';
  cancelledAt?: Date;
  fee: number;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  createdAt?: Date;
  updatedAt?: Date;
}

const appointmentSchema = new mongoose.Schema<IAppointment, mongoose.Model<IAppointment, {}, IAppointmentMethods>, IAppointmentMethods>(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    appointmentDate: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    reason: { type: String, required: true, maxlength: 500 },
    notes: { type: String, maxlength: 2000 },
    status: { type: String, enum: APPOINTMENT_STATUS, default: 'pending', index: true },
    cancelReason: { type: String, maxlength: 500 },
    cancelledBy: { type: String, enum: ['patient', 'doctor', 'admin'] },
    cancelledAt: { type: Date },
    fee: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
  },
  { timestamps: true },
);

appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, startTime: 1, status: 1 },
  { name: 'doctor_daily_schedule' },
);
appointmentSchema.index({ patientId: 1, appointmentDate: -1, status: 1 }, { name: 'patient_history' });

appointmentSchema.methods.toDetail = function toDetail(this: IAppointment) {
  return {
    _id: String(this._id),
    patient: this.patientId && typeof this.patientId === 'object'
      ? {
          _id: String(this.patientId._id),
          name: this.patientId.name ?? `${this.patientId.userId?.firstName ?? ''} ${this.patientId.userId?.lastName ?? ''}`.trim(),
        }
      : { _id: String(this.patientId) },
    doctor: this.doctorId && typeof this.doctorId === 'object'
      ? {
          _id: String(this.doctorId._id),
          specialization: this.doctorId.specialization,
          name: this.doctorId.name ?? `${this.doctorId.userId?.firstName ?? ''} ${this.doctorId.userId?.lastName ?? ''}`.trim(),
        }
      : { _id: String(this.doctorId) },
    appointmentDate: this.appointmentDate,
    startTime: this.startTime,
    endTime: this.endTime,
    reason: this.reason,
    notes: this.notes ?? null,
    status: this.status,
    cancelReason: this.cancelReason ?? null,
    cancelledBy: this.cancelledBy ?? null,
    cancelledAt: this.cancelledAt?.toISOString() ?? null,
    fee: this.fee,
    paymentStatus: this.paymentStatus,
    createdAt: this.createdAt?.toISOString(),
    updatedAt: this.updatedAt?.toISOString(),
  };
};

export const Appointment = mongoose.model<IAppointment, mongoose.Model<IAppointment, {}, IAppointmentMethods>>('Appointment', appointmentSchema);
