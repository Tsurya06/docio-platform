import { appointmentRepository } from './appointment.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { patientService } from '../patient/patient.service.js';
import { doctorService } from '../doctor/doctor.service.js';
import type { IAppointment } from './appointment.model.js';

function dateWeekday(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getUTCDay()]!;
}

function splitTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function toTimeStr(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function generateSlots(doctor: any): string[] {
  const start = splitTime(doctor.workingHours.start);
  const end = splitTime(doctor.workingHours.end);
  const duration = doctor.slotDuration;
  const slots: string[] = [];
  for (let mins = start; mins + duration <= end; mins += duration) {
    slots.push(toTimeStr(mins));
  }
  return slots;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowTimeStr(): string {
  const d = new Date();
  return toTimeStr(d.getHours() * 60 + d.getMinutes());
}

function idOf(value: any): string {
  if (!value) return '';
  if (value._id) return String(value._id);
  return String(value);
}

function assertOwnership(appt: any, { role, profileId }: { role: string; profileId: string | object | null }): void {
  if (role === 'admin') return;
  if (role === 'patient' && idOf(appt.patientId) === String(profileId)) return;
  if (role === 'doctor' && idOf(appt.doctorId) === String(profileId)) return;
  throw ApiError.forbidden('APPOINTMENT_NOT_OWNED', 'You do not own this appointment');
}

function assertBookingWindow(doctor: any, appointmentDate: string, startTime: string): void {
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

const STATUS_TRANSITIONS: Record<string, { from: string; to: string }> = {
  confirm: { from: 'pending', to: 'confirmed' },
  reject: { from: 'pending', to: 'rejected' },
  complete: { from: 'confirmed', to: 'completed' },
};

export const appointmentService = {
  async create({ patientUserId, doctorId, appointmentDate, startTime, reason }: any) {
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
    return populated!.toDetail();
  },

  async getById(id: string | object, currentUser: { role: string; profileId: string | object | null }) {
    const appt = await appointmentRepository.findByIdPopulated(id);
    if (!appt) {
      throw ApiError.notFound('APPOINTMENT_NOT_FOUND', 'Appointment not found');
    }
    assertOwnership(appt, currentUser);
    return appt.toDetail();
  },

  async listMine(patientUserId: string | object, query: any) {
    const patient = await patientService.getProfile(patientUserId);
    const result = await appointmentRepository.listForPatient(patient._id, query);
    return {
      items: result.items.map((a: any) => a.toDetail()),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  },

  async listForDoctor(doctorUserId: string | object, query: any) {
    const doctor = await doctorService.getProfile(doctorUserId);
    const result = await appointmentRepository.listForDoctor(doctor._id, query);
    return {
      items: result.items.map((a: any) => a.toDetail()),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  },

  async listForAdmin(query: any) {
    const result = await appointmentRepository.listForAdmin(query);
    return {
      items: result.items,
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  },

  async cancel(id: string | object, currentUser: { role: string; profileId: string | object | null }, reason?: string) {
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
    return updated!.toDetail();
  },

  async manage(id: string | object, doctorUserId: string | object, { action, notes }: { action: string; notes?: string }) {
    const doctor = await doctorService.getProfile(doctorUserId);
    const appt = await appointmentRepository.findByIdForDoctor(id, doctor._id);
    if (!appt) {
      throw ApiError.notFound('APPOINTMENT_NOT_FOUND', 'Appointment not found');
    }

    const rule = STATUS_TRANSITIONS[action];
    if (!rule) {
      throw ApiError.badRequest('INVALID_ACTION', `Action ${action} is not supported`);
    }
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
    return updated!.toDetail();
  },

  async getDayAvailability(doctorId: string | object, date: string) {
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
