import { appointmentService } from './appointment.service.js';
import { patientService } from '../patient/patient.service.js';
import { doctorService } from '../doctor/doctor.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Resolve the caller's role-specific profile `_id` (Patient or Doctor) so the service can do
 * pure _id comparison for ownership. Admin sessions never carry a profile id — the service
 * skips the ownership check for the `admin` role.
 *
 * Alternative considered: middleware that resolves + attaches `req.profileId` once per
 * request lifecycle. Rejected — getById and cancel are the only endpoints that need this,
 * so they resolve lazily. Adding a middleware would force the resolution on every protected
 * route (auth's /me, all of admin/*, etc.) for no benefit.
 */
async function resolveProfileId(user) {
  if (user.role === 'patient') {
    return (await patientService.getProfile(user.id))._id;
  }
  if (user.role === 'doctor') {
    return (await doctorService.getProfile(user.id))._id;
  }
  return null;
}

export async function create(req, res) {
  const appointment = await appointmentService.create({
    patientUserId: req.user.id,
    ...req.body,
  });
  return res.status(201).json(ApiResponse.ok({ appointment }));
}

export async function listMine(req, res) {
  const result = await appointmentService.listMine(req.user.id, req.query);
  return res.json(
    ApiResponse.paginated({
      items: result.items,
      page: result.page,
      limit: result.limit,
      total: result.total,
    }),
  );
}

export async function getById(req, res) {
  const profileId = await resolveProfileId(req.user);
  const appointment = await appointmentService.getById(req.params.id, {
    role: req.user.role,
    profileId,
  });
  return res.json(ApiResponse.ok({ appointment }));
}

export async function cancel(req, res) {
  const profileId = await resolveProfileId(req.user);
  const appointment = await appointmentService.cancel(req.params.id, {
    role: req.user.role,
    profileId,
  }, req.body.cancelReason);
  return res.json(ApiResponse.ok({ appointment }));
}

export async function listForDoctor(req, res) {
  const result = await appointmentService.listForDoctor(req.user.id, req.query);
  return res.json(
    ApiResponse.paginated({
      items: result.items,
      page: result.page,
      limit: result.limit,
      total: result.total,
    }),
  );
}

export async function manage(req, res) {
  if (req.user.role !== 'doctor') {
    // Double-defense: route guard already enforces doctor, but service-layer callers must never
    // be able to bypass role checks via direct invocation. Cheap insurance.
    throw ApiError.forbidden('ROLE_FORBIDDEN', 'Only doctors can manage appointment status');
  }
  const appointment = await appointmentService.manage(
    req.params.id,
    req.user.id,
    req.body,
  );
  return res.json(ApiResponse.ok({ appointment }));
}

export async function getAvailability(req, res) {
  const availability = await appointmentService.getDayAvailability(req.params.id, req.query.date);
  return res.json(ApiResponse.ok({ availability }));
}
