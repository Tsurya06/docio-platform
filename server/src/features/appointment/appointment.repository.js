import { Appointment, ACTIVE_STATUSES } from './appointment.model.js';

/**
 * Appointment data-access layer.
 *
 * Population: `toDetail()` reads `this.patient` and `this.doctor` populated paths. Population
 * is opt-in per query — `create` returns a bare document (no population), while read endpoints
 * (`findByIdPopulated`, `findByPatient`, `findByDoctor`) request the populated projection.
 */
export const appointmentRepository = {
  create(data) {
    return Appointment.create(data);
  },

  findByIdPopulated(id) {
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

  /**
   * The double-booking guard. Matches ANY appointment already holding the same slot regardless
   * of equivalency of `endTime` — slot duration is configured by the doctor, so a single
   * `startTime` collision is enough to flag unavailability.
   *
   * `ACTIVE_STATUSES` is just `['pending', 'confirmed']` — completed/cancelled/rejected slots
   * are bookable again (no deposit-refund logic in this MVP).
   */
  findActiveBooking({ doctorId, appointmentDate, startTime }) {
    return Appointment.findOne({
      doctorId,
      appointmentDate,
      startTime,
      status: { $in: ACTIVE_STATUSES },
    });
  },

  findByIdForPatient(id, patientId) {
    return Appointment.findOne({ _id: id, patientId });
  },

  findByIdForDoctor(id, doctorId) {
    return Appointment.findOne({ _id: id, doctorId });
  },

  async listForPatient(patientId, { status, date, page, limit }) {
    const filter = { patientId };
    if (status) filter.status = status;
    if (date) filter.appointmentDate = date;
    return runQuery(filter, { page, limit });
  },

  async listForDoctor(doctorId, { status, date, page, limit }) {
    const filter = { doctorId };
    if (status) filter.status = status;
    if (date) filter.appointmentDate = date;
    return runQuery(filter, { page, limit });
  },

  /**
   * Admin-side listing. Same shape + population as patient/doctor listings — `runQuery` already
   * populates doctor + patient sub-graphs with their User contact info, which is exactly what
   * the admin appointments table needs in one row.
   *
   * `status` arrives normalized to an array (or undefined) by `listAppointmentsSchema`, so we
   * `$in` it rather than equality-match.
   */
  async listForAdmin({ status, date, page, limit }) {
    const filter = {};
    if (status?.length) filter.status = { $in: status };
    if (date) filter.appointmentDate = date;
    return runQuery(filter, { page, limit });
  },

  /**
   * Booking-by-day query used by Step 6's availability endpoint. Returns only the startTime
   * + status projection to keep payload small — we don't need reason, notes, or refs here.
   */
  findDayBookings(doctorId, appointmentDate) {
    return Appointment.find(
      { doctorId, appointmentDate, status: { $in: ACTIVE_STATUSES } },
      { startTime: 1, endTime: 1, status: 1, _id: 0 },
    ).sort({ startTime: 1 });
  },

  async setStatus(id, { status, cancelReason, cancelledBy, cancelledAt, notes }) {
    const $set = { status };
    if (cancelReason !== undefined) $set.cancelReason = cancelReason;
    if (cancelledBy !== undefined) $set.cancelledBy = cancelledBy;
    if (cancelledAt !== undefined) $set.cancelledAt = cancelledAt;
    if (notes !== undefined) $set.notes = notes;
    return Appointment.findByIdAndUpdate(id, { $set }, { new: true });
  },
};

async function runQuery(filter, { page, limit }) {
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
