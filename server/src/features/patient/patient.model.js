import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: { type: String, maxlength: 10 },
    address: {
      street: { type: String, maxlength: 200 },
      city: { type: String, maxlength: 100 },
      state: { type: String, maxlength: 100 },
      zip: { type: String, maxlength: 20 },
      country: { type: String, maxlength: 100 },
    },
    medicalHistory: [{ type: String, maxlength: 500 }],
    allergies: [{ type: String, maxlength: 200 }],
    emergencyContact: {
      name: { type: String, maxlength: 100 },
      phone: { type: String, maxlength: 30 },
    },
  },
  { timestamps: true },
);

patientSchema.methods.toProfile = function toProfile() {
  return {
    _id: String(this._id),
    userId: String(this.userId),
    dateOfBirth: this.dateOfBirth?.toISOString().slice(0, 10) ?? null,
    gender: this.gender ?? null,
    bloodGroup: this.bloodGroup ?? null,
    address: this.address ?? null,
    medicalHistory: this.medicalHistory ?? [],
    allergies: this.allergies ?? [],
    emergencyContact: this.emergencyContact ?? null,
  };
};

export const Patient = mongoose.model('Patient', patientSchema);
