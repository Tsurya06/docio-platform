import { doctorRepository } from './doctor.repository.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Same race-safety pattern as patient.repository — duplicate-key (11000) on shell creation
 * during a double-submit register means another request already created the shell: safe to no-op.
 */
async function safeCreateShell(userId) {
  try {
    return await doctorRepository.createShell(userId);
  } catch (err) {
    if (err.code === 11000) return null;
    throw err;
  }
}

function validateAvailability(workingHours) {
  if (workingHours.start >= workingHours.end) {
    throw ApiError.badRequest(
      'INVALID_WORKING_HOURS',
      'workingHours.start must be earlier than workingHours.end',
    );
  }
}

export const doctorService = {
  async createShell(userId) {
    return safeCreateShell(userId);
  },

  async getProfile(userId) {
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw ApiError.notFound('PROFILE_NOT_FOUND', 'Doctor profile not found');
    }
    return doctor.toProfile();
  },

  async updateProfile(userId, patch) {
    const updated = await doctorRepository.updateByUserId(userId, patch);
    if (!updated) {
      throw ApiError.notFound('PROFILE_NOT_FOUND', 'Doctor profile not found');
    }
    return updated.toProfile();
  },

  async updateAvailability(userId, patch) {
    validateAvailability(patch.workingHours);
    const updated = await doctorRepository.updateAvailabilityByUserId(userId, patch);
    if (!updated) {
      throw ApiError.notFound('PROFILE_NOT_FOUND', 'Doctor profile not found');
    }
    return updated.toProfile();
  },

  async getPublicById(id) {
    const doctor = await doctorRepository.findPublicById(id);
    if (!doctor) {
      throw ApiError.notFound('DOCTOR_NOT_FOUND', 'Doctor not found');
    }
    return doctor.toPublic();
  },

  async search(params) {
    return doctorRepository.search(params);
  },

  async listForAdmin(params) {
    return doctorRepository.listForAdmin(params);
  },

  /**
   * Returns raw Mongoose doc — the admin controller shapes via `toAdminDoctorView(doctor)`.
   */
  async setApproved(id, isApproved) {
    const updated = await doctorRepository.setApproved(id, isApproved);
    if (!updated) {
      throw ApiError.notFound('DOCTOR_NOT_FOUND', 'Doctor not found');
    }
    return updated;
  },

  async setActive(id, isActive) {
    const updated = await doctorRepository.setActive(id, isActive);
    if (!updated) {
      throw ApiError.notFound('DOCTOR_NOT_FOUND', 'Doctor not found');
    }
    return updated;
  },

  async incrementTotalAppointments(doctorId) {
    return doctorRepository.incrementTotalAppointments(doctorId);
  },
};
