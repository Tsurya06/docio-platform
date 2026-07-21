import { patientRepository } from './patient.repository.js';
import { User } from '../user/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { escapeRegex } from '../../utils/regex.js';

async function safeCreateShell(userId: string | object) {
  try {
    return await patientRepository.createShell(userId);
  } catch (err: any) {
    if (err.code === 11000) return null;
    throw err;
  }
}

export const patientService = {
  async createShell(userId: string | object) {
    return safeCreateShell(userId);
  },

  async getProfile(userId: string | object) {
    const profile = await patientRepository.findByUserId(userId);
    if (!profile) {
      throw ApiError.notFound('PROFILE_NOT_FOUND', 'Patient profile not found');
    }
    return profile.toProfile();
  },

  async updateProfile(userId: string | object, patch: any) {
    const dbPatch = { ...patch };
    if (patch.dateOfBirth) {
      dbPatch.dateOfBirth = new Date(patch.dateOfBirth);
    }
    const updated = await patientRepository.updateByUserId(userId, dbPatch);
    if (!updated) {
      throw ApiError.notFound('PROFILE_NOT_FOUND', 'Patient profile not found');
    }
    return updated.toProfile();
  },

  async listForAdmin({ search, gender, page, limit }: { search?: string; gender?: string; page: number; limit: number }) {
    const filter: any = {};
    if (gender) {
      filter.gender = gender;
    }
    if (search) {
      const searchTerms = search.trim().split(/\s+/).filter(term => term.length > 0);

      if (searchTerms.length > 0) {
        const regexConditions = searchTerms.map(term => {
          const re = new RegExp(escapeRegex(term), 'i');
          return {
            $or: [
              { firstName: re },
              { lastName: re },
              { email: re }
            ]
          };
        });

        const users = await User.find({ $and: regexConditions }, { _id: 1 }).lean();
        filter.userId = { $in: users.map((u) => u._id) };
      }
    }
    return patientRepository.listForAdmin({ filter, page, limit });
  },
};
