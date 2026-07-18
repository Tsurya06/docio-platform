import { patientRepository } from './patient.repository.js';
import { User } from '../user/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { escapeRegex } from '../../utils/regex.js';

/**
 * createShell swallows duplicate-key errors: if two register requests race for the same user
 * (e.g. double-submit), the second call still resolves cleanly instead of bubbling a 500.
 * Re-throws other errors so they surface in auth.service.register and fail the registration.
 */
async function safeCreateShell(userId) {
  try {
    return await patientRepository.createShell(userId);
  } catch (err) {
    if (err.code === 11000) return null;
    throw err;
  }
}

export const patientService = {
  async createShell(userId) {
    return safeCreateShell(userId);
  },

  async getProfile(userId) {
    const profile = await patientRepository.findByUserId(userId);
    if (!profile) {
      throw ApiError.notFound('PROFILE_NOT_FOUND', 'Patient profile not found');
    }
    return profile.toProfile();
  },

  async updateProfile(userId, patch) {
    // Convert YYYY-MM-DD → Date for Mongoose. Done here (not in Zod) so the schema stays a
    // pure-string contract; the service owns the format translation to the DB.
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

  /**
   * Admin-side listing. `search` matches against the linked User's firstName / lastName / email
   * (the Patient collection has no name of its own — names live on User). We resolve matching
   * user IDs first, then filter patients by `userId: { $in }`. Population still happens in the
   * repository so the returned docs carry the full User fields for the admin view shaper.
   *
   * If `search` yields no users, `userId: { $in: [] }` legitimately returns zero patients —
   * the admin typed something that matches no one. Unlike the old behavior (silently ignoring
   * `search` and returning everyone), this is correct and matches the "Search by name" label.
   *
   * The search string is split into individual terms (by whitespace), and all terms must match
   * at least one of the fields (firstName, lastName, email) for a user to be included.
   */
  async listForAdmin({ search, page, limit } = {}) {
    const filter = {};
    if (search) {
      // Split search into individual terms (by whitespace) and filter out empty strings
      const searchTerms = search.trim().split(/\s+/).filter(term => term.length > 0);

      if (searchTerms.length === 0) {
        // No valid search terms
        return patientRepository.listForAdmin({ filter, page, limit });
      }

      // Build a query that requires ALL search terms to match (AND logic)
      // Each term must match at least one of firstName, lastName, or email (OR logic within term)
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
    return patientRepository.listForAdmin({ filter, page, limit });
  },
};
