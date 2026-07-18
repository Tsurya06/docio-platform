import mongoose from 'mongoose';

export const APPOINTMENT_STATUS = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'];
export const ACTIVE_STATUSES = ['pending', 'confirmed'];

const appointmentSchema = new mongoose.Schema(
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
    /**
     * Stored as `YYYY-MM-DD` string, not a Date. A Date would force timezone interpretation
     * (UTC midnight vs local) and silently shift "today" across timezones; a string is exact.
     * Downstream code parses it to a Date only when date arithmetic is needed (comparison to today).
     */
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

/**
 * Compound index backs the double-booking guard query:
 *   `findOne({ doctorId, appointmentDate, startTime, status: { $in: ['pending','confirmed'] } })`
 * The same index serves the doctor's daily schedule query (filter by doctorId + appointmentDate,
 * optionally status). Status is added last so an equality+range query can still use the prefix.
 */
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, startTime: 1, status: 1 },
  { name: 'doctor_daily_schedule' },
);
appointmentSchema.index({ patientId: 1, appointmentDate: -1, status: 1 }, { name: 'patient_history' });

/**
 * Returns the appointment with patient + doctor populated for display. Population uses
 * `lean` paths so heavy fields (`password`, `notes` on User) are not leaked.
 */
appointmentSchema.methods.toDetail = function toDetail() {
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

export const Appointment = mongoose.model('Appointment', appointmentSchema);
