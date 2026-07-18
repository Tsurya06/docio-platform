import { adminService } from './admin.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

/**
 * Admin response shapers. Each function takes a populated Mongoose doc and yields a plain
 * admin-facing view. The pattern drops `userId` from `toProfile()` output and substitutes
 * a richer `user` object so the FE can show name + email + lifecycle state in one row.
 */
function toAdminDoctorView(doc) {
  const { userId, ...profile } = doc.toProfile();
  const user = doc.populated('userId') ? doc.userId : null;
  return {
    ...profile,
    user: user
      ? {
          _id: String(user._id),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          createdAt: user.createdAt?.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString(),
        }
      : null,
  };
}

function toAdminPatientView(doc) {
  const user = doc.populated('userId') ? doc.userId : null;
  return {
    _id: String(doc._id),
    user: user
      ? {
          _id: String(user._id),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          createdAt: user.createdAt?.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString(),
        }
      : null,
    dateOfBirth: doc.dateOfBirth?.toISOString().slice(0, 10) ?? null,
    gender: doc.gender ?? null,
    bloodGroup: doc.bloodGroup ?? null,
    address: doc.address ?? null,
    medicalHistory: doc.medicalHistory ?? [],
    allergies: doc.allergies ?? [],
    emergencyContact: doc.emergencyContact ?? null,
    createdAt: doc.createdAt?.toISOString(),
  };
}

function paginate(result, mapItem) {
  return {
    items: result.items.map(mapItem),
    page: result.page,
    limit: result.limit,
    total: result.total,
  };
}

export async function getDashboard(_req, res) {
  const dashboard = await adminService.getDashboard();
  return res.json(ApiResponse.ok({ dashboard }));
}

export async function listDoctors(req, res) {
  const result = await adminService.listDoctors(req.query);
  return res.json(ApiResponse.paginated(paginate(result, toAdminDoctorView)));
}

export async function manageDoctor(req, res) {
  const doctor = await adminService.manageDoctor(req.params.id, req.body.action);
  return res.json(ApiResponse.ok({ doctor: toAdminDoctorView(doctor) }));
}

export async function listPatients(req, res) {
  const result = await adminService.listPatients(req.query);
  return res.json(ApiResponse.paginated(paginate(result, toAdminPatientView)));
}

export async function listAppointments(req, res) {
  const result = await adminService.listAppointments(req.query);
  return res.json(
    ApiResponse.paginated(paginate(result, (a) => a.toDetail())),
  );
}
