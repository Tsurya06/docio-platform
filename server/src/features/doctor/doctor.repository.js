import { Doctor } from './doctor.model.js';
import { escapeRegex } from '../../utils/regex.js';

/**
 * Doctor data-access layer.
 *
 * `findPublicById` and `search` use a projection — never expose the internal `userId` ObjectId
 * to public callers. Patients see doctor info; they do not see the underlying user account ID.
 */
export const doctorRepository = {
  findByUserId(userId) {
    return Doctor.findOne({ userId });
  },

  findById(id) {
    return Doctor.findById(id);
  },

  /**
   * Public-facing fetch. Only returns approved + active doctors. We project away
   * `userId`, `isApproved`, `isActive` — they're internal bookkeeping.
   */
  findPublicById(id) {
    return Doctor.findOne(
      { _id: id, isApproved: true, isActive: true },
      { userId: 0, isApproved: 0, isActive: 0 },
    );
  },

  createShell(userId) {
    // Doctors register an empty profile, fill in specialization/etc. via PATCH /me.
    // `specialization` is required by the schema, so we set a sentinel the doctor can update.
    // Alternative considered: making specialization optional. Rejected — public search filters
    // by specialization; an empty specialization pollutes search results. The sentinel is the
    // cleaner default: doctors without a real specialization are filtered out of public search
    // via `isApproved=false` until admin approval (which is gated by specialization being set).
    return Doctor.create({ userId, specialization: 'Unspecified' });
  },

  async updateByUserId(userId, patch) {
    return Doctor.findOneAndUpdate({ userId }, { $set: patch }, { new: true });
  },

  async updateAvailabilityByUserId(userId, patch) {
    return Doctor.findOneAndUpdate({ userId }, { $set: patch }, { new: true });
  },

  /**
   * Substring search across the public-facing text fields.
   *
   * Why regex, not `$text`: MongoDB's `$text` does whole-word/stemmed matching only, so a query
   * of "cardio" would NOT match "cardiologist" — a patient typing a prefix gets zero results and
   * (rightly) thinks search is broken. A case-insensitive regex on the three indexed text fields
   * matches prefixes/substrings as users expect. The `{ isApproved, isActive }` index is used as
   * the primary filter; the regex is applied on the narrowed set — fine for platform scale, and
   * the text index we declared on the model remains for any future full-text relevance ranking.
   *
   * `search` is regex-escaped so a user typing `.+*?` can't inject pattern syntax or trigger
   * catastrophic backtracking.
   */
  async search({ search, specialization, page, limit, sort, order }) {
    const filter = { isApproved: true, isActive: true };
    if (specialization) filter.specialization = specialization;

    if (search) {
      const re = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { specialization: re },
        { bio: re },
        { qualifications: re },
      ];
    }

    const sortSpec = { [sort]: order === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      Doctor.find(filter, { userId: 0, isApproved: 0, isActive: 0 })
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit),
      Doctor.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  },

  async listForAdmin({ isApproved, specialization, page, limit }) {
    const filter = {};
    if (typeof isApproved === 'boolean') filter.isApproved = isApproved;
    if (specialization) filter.specialization = specialization;

    const [items, total] = await Promise.all([
      Doctor.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'firstName lastName email isActive'),
      Doctor.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  },

  async setApproved(id, isApproved) {
    return Doctor.findByIdAndUpdate(id, { $set: { isApproved } }, { new: true })
      .populate('userId', 'firstName lastName email isActive lastLoginAt');
  },

  async setActive(id, isActive) {
    return Doctor.findByIdAndUpdate(id, { $set: { isActive } }, { new: true })
      .populate('userId', 'firstName lastName email isActive lastLoginAt');
  },

  /**
   * Atomically bumps `totalAppointments` on completion. Using `$inc` avoids a read-modify-write
   * race: two concurrent completions on the same doctor increment from the same base value
   * without overwriting one another.
   */
  async incrementTotalAppointments(doctorId, by = 1) {
    return Doctor.updateOne({ _id: doctorId }, { $inc: { totalAppointments: by } });
  },
};
