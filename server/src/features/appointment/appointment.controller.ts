import type { Request, Response } from 'express';
import { appointmentService } from './appointment.service.js';
import { patientService } from '../patient/patient.service.js';
import { doctorService } from '../doctor/doctor.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

async function resolveProfileId(user: { id: string; role: string }): Promise<string | null> {
  if (user.role === 'patient') {
    return (await patientService.getProfile(user.id))._id;
  }
  if (user.role === 'doctor') {
    return (await doctorService.getProfile(user.id))._id;
  }
  return null;
}

export async function create(req: Request, res: Response): Promise<Response> {
  const appointment = await appointmentService.create({
    patientUserId: req.user!.id,
    ...req.body,
  });
  return res.status(201).json(ApiResponse.ok({ appointment }));
}

export async function listMine(req: Request, res: Response): Promise<Response> {
  const result = await appointmentService.listMine(req.user!.id, req.query);
  return res.json(
    ApiResponse.paginated({
      items: result.items,
      page: result.page,
      limit: result.limit,
      total: result.total,
    }),
  );
}

export async function getById(req: Request, res: Response): Promise<Response> {
  const profileId = await resolveProfileId(req.user!);
  const appointment = await appointmentService.getById(req.params.id!, {
    role: req.user!.role,
    profileId,
  });
  return res.json(ApiResponse.ok({ appointment }));
}

export async function cancel(req: Request, res: Response): Promise<Response> {
  const profileId = await resolveProfileId(req.user!);
  const appointment = await appointmentService.cancel(req.params.id!, {
    role: req.user!.role,
    profileId,
  }, req.body.cancelReason);
  return res.json(ApiResponse.ok({ appointment }));
}

export async function listForDoctor(req: Request, res: Response): Promise<Response> {
  const result = await appointmentService.listForDoctor(req.user!.id, req.query);
  return res.json(
    ApiResponse.paginated({
      items: result.items,
      page: result.page,
      limit: result.limit,
      total: result.total,
    }),
  );
}

export async function manage(req: Request, res: Response): Promise<Response> {
  if (req.user!.role !== 'doctor') {
    throw ApiError.forbidden('ROLE_FORBIDDEN', 'Only doctors can manage appointment status');
  }
  const appointment = await appointmentService.manage(
    req.params.id!,
    req.user!.id,
    req.body,
  );
  return res.json(ApiResponse.ok({ appointment }));
}

export async function getAvailability(req: Request, res: Response): Promise<Response> {
  const availability = await appointmentService.getDayAvailability(req.params.id!, req.query.date as string);
  return res.json(ApiResponse.ok({ availability }));
}
