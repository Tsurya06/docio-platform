import { appointmentRepository } from './appointment.repository.js';
import { doctorService } from '../doctor/doctor.service.js';
import { patientService } from '../patient/patient.service.js';
import { ApiError } from '../../utils/ApiError.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function splitTime(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function toTimeStr(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function generateSlots(doctor) {
  const startMin = splitTime(doctor.workingHours.start);
  const endMin = splitTime(doctor.workingHours.end);
  const slots = [];
  for (let t = startMin; t + doctor.slotDuration <= endMin; t += doctor.slotDuration) {
    slots.push(toTimeStr(t));
  }
  return slots;
}

function dateWeekday(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowTimeStr() {
  const d = new Date();
  return toTimeStr(d.getHours() * 60 + d.getMinutes());
}

/**
 * Ownership resolution: the controller passes `{ id, role, profileId }`. `id` is the user
 * id from the JWT; `profileId` is the resolved Patient or Doctor `_id` (looked up by the
 * controller via the feature's service). This keeps the appointment service pure: no
 * cross-feature lookups inside the hot path, just _id comparison.
 *
 * Admin bypasses all ownership checks — Step 11's admin endpoints reuse the same service.
 */
function idOf(value) {
  if (!value) return '';
  // Mongoose: populated paths become full Document instances whose `_id` is the
  // original ref. Unpopulated paths are bare ObjectIds whose toString returns the hex.
  // This helper normalizes both so ownership checks work regardless of populate state —
  // which is essential because `cancel` fetches with `findByIdPopulated` while `manage`
  // (the doctor flow) and admin reuse paths populate via `runQuery`.
  if (value._id) return String(value._id);
  return String(value);
}

function assertOwnership(appt, { role, profileId }) {
  if (role === 'admin') return;
  if (role === 'patient' && idOf(appt.patientId) === String(profileId)) return;
  if (role === 'doctor' && idOf(appt.doctorId) === String(profileId)) return;
  throw ApiError.forbidden('APPOINTMENT_NOT_OWNED', 'You do not own this appointment');
}

function assertBookingWindow(doctor, appointmentDate, startTime) {
  const day = dateWeekday(appointmentDate);
  if (!doctor.workingDays.includes(day)) {
    throw ApiError.badRequest('DOCTOR_NOT_WORKING', `Doctor does not work on ${day}`);
  }
  const allSlots = generateSlots(doctor);
  if (!allSlots.includes(startTime)) {
    throw ApiError.badRequest('SLOT_NOT_AVAILABLE', 'Selected start time is not a valid slot');
  }
  if (appointmentDate < todayStr()) {
    throw ApiError.badRequest('PAST_DATE', 'Appointment date is in the past');
  }
  if (appointmentDate === todayStr() && startTime <= nowTimeStr()) {
    throw ApiError.badRequest('SLOT_PASSED', 'Selected time has already passed');
  }
}

const STATUS_TRANSITIONS = {
  confirm: { from: 'pending', to: 'confirmed' },
  reject: { from: 'pending', to: 'rejected' },
  complete: { from: 'confirmed', to: 'completed' },
};

export const appointmentService = {
  async create({ patientUserId, doctorId, appointmentDate, startTime, reason }) {
    /**
     * Patient lookup is by userId (JWT carries user id, not patient id). We use the resolved
     * patient's `_id` as the `appointment.patientId` ref. Same for doctor — we call
     * `getPublicById` which additionally filters by `isApproved + isActive`, so unapproved
     * doctors return 404 (no existence leak).
     */
    const patient = await patientService.getProfile(patientUserId);
    const doctor = await doctorService.getPublicById(doctorId);

    assertBookingWindow(doctor, appointmentDate, startTime);

    const endTime = toTimeStr(splitTime(startTime) + doctor.slotDuration);
    const existing = await appointmentRepository.findActiveBooking({
      doctorId,
      appointmentDate,
      startTime,
    });
    if (existing) {
      throw ApiError.conflict('SLOT_TAKEN', 'This time slot is already booked');
    }

    const appt = await appointmentRepository.create({
      patientId: patient._id,
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      reason,
      fee: doctor.consultationFee,
      paymentStatus: 'unpaid',
      status: 'pending',
    });

    const populated = await appointmentRepository.findByIdPopulated(appt._id);
    return populated.toDetail();
  },

  async getById(id, currentUser) {
    const appt = await appointmentRepository.findByIdPopulated(id);
    if (!appt) {
      throw ApiError.notFound('APPOINTMENT_NOT_FOUND', 'Appointment not found');
    }
    assertOwnership(appt, currentUser);
    return appt.toDetail();
  },

  async listMine(patientUserId, query) {
    const patient = await patientService.getProfile(patientUserId);
    const result = await appointmentRepository.listForPatient(patient._id, query);
    return {
      items: result.items.map((a) => a.toDetail()),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  },

  async listForDoctor(doctorUserId, query) {
    const doctor = await doctorService.getProfile(doctorUserId);
    const result = await appointmentRepository.listForDoctor(doctor._id, query);
    return {
      items: result.items.map((a) => a.toDetail()),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  },

  /**
   * Admin-side listing. Returns raw populated docs — the admin controller shapes via
   * `toDetail()` itself (same raw-doc hand-off as doctor `setApproved`/`setActive` feed
   * `toAdminDoctorView`). Admin sees appointments across all doctors + patients — no
   * ownership filter, no scoping.
   */
  async listForAdmin(query) {
    const result = await appointmentRepository.listForAdmin(query);
    return {
      items: result.items,
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  },

  async cancel(id, currentUser, reason) {
    const appt = await appointmentRepository.findByIdPopulated(id);
    if (!appt) {
      throw ApiError.notFound('APPOINTMENT_NOT_FOUND', 'Appointment not found');
    }
    assertOwnership(appt, currentUser);

    if (appt.status === 'completed') {
      throw ApiError.unprocessable(
        'APPOINTMENT_COMPLETED',
        'Completed appointments cannot be cancelled',
      );
    }
    if (appt.status === 'cancelled' || appt.status === 'rejected') {
      throw ApiError.unprocessable(
        'APPOINTMENT_ALREADY_INACTIVE',
        'Appointment is already inactive',
      );
    }

    await appointmentRepository.setStatus(id, {
      status: 'cancelled',
      cancelReason: reason,
      cancelledBy: currentUser.role,
      cancelledAt: new Date(),
    });
    const updated = await appointmentRepository.findByIdPopulated(id);
    return updated.toDetail();
  },

  async manage(id, doctorUserId, { action, notes }) {
    const doctor = await doctorService.getProfile(doctorUserId);
    const appt = await appointmentRepository.findByIdForDoctor(id, doctor._id);
    if (!appt) {
      throw ApiError.notFound('APPOINTMENT_NOT_FOUND', 'Appointment not found');
    }

    const rule = STATUS_TRANSITIONS[action];
    if (appt.status !== rule.from) {
      throw ApiError.unprocessable(
        'INVALID_STATUS_TRANSITION',
        `Cannot ${action} an appointment in status '${appt.status}'`,
      );
    }

    await appointmentRepository.setStatus(id, {
      status: rule.to,
      ...(notes !== undefined && { notes }),
    });

    if (action === 'complete') {
      await doctorService.incrementTotalAppointments(doctor._id);
    }

    const updated = await appointmentRepository.findByIdPopulated(id);
    return updated.toDetail();
  },

  /**
   * Step 6's availability endpoint — returns start times still bookable for the given date.
   * WorkingDays ⊇ day ensures the doctor works that weekday; the candidate slot minus slots
   * already in `pending` or `confirmed` state leaves only bookable times. Slots already in
   * the past (when date === today) are excluded so a patient doesn't see "available" behind them.
   */
  async getDayAvailability(doctorId, date) {
    const doctor = await doctorService.getPublicById(doctorId);
    const day = dateWeekday(date);
    if (!doctor.workingDays.includes(day)) {
      return { date, weekday: day, slots: [] };
    }

    const allSlots = generateSlots(doctor);
    const bookings = await appointmentRepository.findDayBookings(doctorId, date);
    const bookedStart = new Set(bookings.map((b) => b.startTime));

    let slots = allSlots.filter((s) => !bookedStart.has(s));
    if (date === todayStr()) {
      const now = nowTimeStr();
      slots = slots.filter((s) => s >= now);
    }
    return { date, weekday: day, slots };
  },
};
