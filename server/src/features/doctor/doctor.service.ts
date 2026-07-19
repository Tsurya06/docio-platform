import { doctorRepository } from './doctor.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { globalCache } from '../../utils/cache.js';

function invalidateDoctorCache(doctorProfileId: string | object): void {
  globalCache.delete(`doc_pub_${doctorProfileId.toString()}`);
  globalCache.deleteMatching('doc_search_');
}

async function safeCreateShell(userId: string | object) {
  try {
    return await doctorRepository.createShell(userId);
  } catch (err: any) {
    if (err.code === 11000) return null;
    throw err;
  }
}

function validateAvailability(workingHours: { start: string; end: string }): void {
  if (workingHours.start >= workingHours.end) {
    throw ApiError.badRequest(
      'INVALID_WORKING_HOURS',
      'workingHours.start must be earlier than workingHours.end',
    );
  }
}

export const doctorService = {
  async createShell(userId: string | object) {
    return safeCreateShell(userId);
  },

  async getProfile(userId: string | object) {
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw ApiError.notFound('PROFILE_NOT_FOUND', 'Doctor profile not found');
    }
    return doctor.toProfile();
  },

  async updateProfile(userId: string | object, patch: any) {
    const updated = await doctorRepository.updateByUserId(userId, patch);
    if (!updated) {
      throw ApiError.notFound('PROFILE_NOT_FOUND', 'Doctor profile not found');
    }
    const profile = updated.toProfile();
    invalidateDoctorCache(profile._id);
    return profile;
  },

  async updateAvailability(userId: string | object, patch: any) {
    validateAvailability(patch.workingHours);
    const updated = await doctorRepository.updateAvailabilityByUserId(userId, patch);
    if (!updated) {
      throw ApiError.notFound('PROFILE_NOT_FOUND', 'Doctor profile not found');
    }
    const profile = updated.toProfile();
    invalidateDoctorCache(profile._id);
    return profile;
  },

  async getPublicById(id: string | object) {
    const cacheKey = `doc_pub_${id.toString()}`;
    const cached = globalCache.get<any>(cacheKey);
    if (cached) return cached;

    const doctor = await doctorRepository.findPublicById(id);
    if (!doctor) {
      throw ApiError.notFound('DOCTOR_NOT_FOUND', 'Doctor not found');
    }
    const result = doctor.toPublic();
    globalCache.set(cacheKey, result, 5 * 60 * 1000); // 5 min TTL
    return result;
  },

  async search(params: any) {
    const cacheKey = `doc_search_${JSON.stringify(params)}`;
    const cached = globalCache.get<any>(cacheKey);
    if (cached) return cached;

    const result = await doctorRepository.search(params);
    globalCache.set(cacheKey, result, 60 * 1000); // 1 min TTL
    return result;
  },

  async listForAdmin(params: any) {
    return doctorRepository.listForAdmin(params);
  },

  async setApproved(id: string | object, isApproved: boolean) {
    const updated = await doctorRepository.setApproved(id, isApproved);
    if (!updated) {
      throw ApiError.notFound('DOCTOR_NOT_FOUND', 'Doctor not found');
    }
    invalidateDoctorCache(id);
    return updated;
  },

  async setActive(id: string | object, isActive: boolean) {
    const updated = await doctorRepository.setActive(id, isActive);
    if (!updated) {
      throw ApiError.notFound('DOCTOR_NOT_FOUND', 'Doctor not found');
    }
    invalidateDoctorCache(id);
    return updated;
  },

  async incrementTotalAppointments(doctorId: string | object) {
    const result = await doctorRepository.incrementTotalAppointments(doctorId);
    invalidateDoctorCache(doctorId);
    return result;
  },
};
