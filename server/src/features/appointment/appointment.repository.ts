import { Appointment, ACTIVE_STATUSES } from './appointment.model.js';
import type { HydratedDocument } from 'mongoose';
import type { IAppointment } from './appointment.model.js';

export const appointmentRepository = {
  create(data: any) {
    return Appointment.create(data);
  },

  findByIdPopulated(id: string | object) {
    return Appointment.findById(id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      });
  },

  findActiveBooking({ doctorId, appointmentDate, startTime }: { doctorId: string | object; appointmentDate: string; startTime: string }) {
    return Appointment.findOne({
      doctorId,
      appointmentDate,
      startTime,
      status: { $in: ACTIVE_STATUSES },
    });
  },

  findByIdForPatient(id: string | object, patientId: string | object) {
    return Appointment.findOne({ _id: id, patientId });
  },

  findByIdForDoctor(id: string | object, doctorId: string | object) {
    return Appointment.findOne({ _id: id, doctorId });
  },

  async listForPatient(patientId: string | object, { status, date, page, limit }: { status?: string | string[]; date?: string; page: number; limit: number }) {
    const filter: any = { patientId };
    if (status) {
      if (Array.isArray(status) && status.length) filter.status = { $in: status };
      else if (typeof status === 'string') filter.status = status;
    }
    if (date) filter.appointmentDate = date;
    return runQuery(filter, { page, limit });
  },

  async listForDoctor(doctorId: string | object, { status, date, page, limit }: { status?: string | string[]; date?: string; page: number; limit: number }) {
    const filter: any = { doctorId };
    if (status) {
      if (Array.isArray(status) && status.length) filter.status = { $in: status };
      else if (typeof status === 'string') filter.status = status;
    }
    if (date) filter.appointmentDate = date;
    return runQuery(filter, { page, limit });
  },

  async listForAdmin({ status, date, page, limit }: { status?: string[]; date?: string; page: number; limit: number }) {
    const filter: any = {};
    if (status?.length) filter.status = { $in: status };
    if (date) filter.appointmentDate = date;
    return runQuery(filter, { page, limit });
  },

  findDayBookings(doctorId: string | object, appointmentDate: string) {
    return Appointment.find(
      { doctorId, appointmentDate, status: { $in: ACTIVE_STATUSES } },
      { startTime: 1, endTime: 1, status: 1, _id: 0 },
    ).sort({ startTime: 1 });
  },

  async setStatus(id: string | object, { status, cancelReason, cancelledBy, cancelledAt, notes }: { status: string; cancelReason?: string; cancelledBy?: string; cancelledAt?: Date; notes?: string }) {
    const $set: any = { status };
    if (cancelReason !== undefined) $set.cancelReason = cancelReason;
    if (cancelledBy !== undefined) $set.cancelledBy = cancelledBy;
    if (cancelledAt !== undefined) $set.cancelledAt = cancelledAt;
    if (notes !== undefined) $set.notes = notes;
    return Appointment.findByIdAndUpdate(id, { $set }, { new: true });
  },
};

async function runQuery(filter: any, { page, limit }: { page: number; limit: number }) {
  const [items, total] = await Promise.all([
    Appointment.find(filter)
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'firstName lastName email' } })
      .sort({ appointmentDate: -1, startTime: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Appointment.countDocuments(filter),
  ]);
  return { items, total, page, limit };
}
