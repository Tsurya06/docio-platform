import { Patient } from './patient.model.js';

export const patientRepository = {
  findByUserId(userId) {
    return Patient.findOne({ userId });
  },

  createShell(userId) {
    return Patient.create({ userId });
  },

  async updateByUserId(userId, patch) {
    // `findOneAndUpdate` with new:true + upsert:false: we never silently create on PATCH.
    // If the shell is missing (auth registration partial failure), service throws 404 so the
    // user knows to re-register or contact support — better than silently materializing a profile.
    return Patient.findOneAndUpdate({ userId }, { $set: patch }, { new: true });
  },

  /**
   * Admin-side listing. Populates the User document so the FE can show name + email + isActive
   * alongside the Patient profile columns in one table row. Sorted by createdAt desc so newly
   * registered patients surface first — admin's default lens is "what just happened".
   *
   * `filter` carries an optional `userId: { $in: [...] }` narrowed by the admin's name/email
   * search (resolved in the service), and is empty when no search is supplied.
   */
  async listForAdmin({ filter = {}, page, limit }) {
    const [items, total] = await Promise.all([
      Patient.find(filter)
        .populate('userId', 'firstName lastName email isActive createdAt lastLoginAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Patient.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  },
};
