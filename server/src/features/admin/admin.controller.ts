import type { Request, Response } from 'express';
import { adminService } from './admin.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

function toAdminDoctorView(doc: any) {
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

function toAdminPatientView(doc: any) {
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

function paginate(result: any, mapItem: (item: any) => any) {
  return {
    items: result.items.map(mapItem),
    page: result.page,
    limit: result.limit,
    total: result.total,
  };
}

export async function getDashboard(_req: Request, res: Response): Promise<Response> {
  const dashboard = await adminService.getDashboard();
  return res.json(ApiResponse.ok({ dashboard }));
}

export async function listDoctors(req: Request, res: Response): Promise<Response> {
  const result = await adminService.listDoctors(req.query);
  return res.json(ApiResponse.paginated(paginate(result, toAdminDoctorView)));
}

export async function manageDoctor(req: Request, res: Response): Promise<Response> {
  const doctor = await adminService.manageDoctor(req.params.id!, req.body.action);
  return res.json(ApiResponse.ok({ doctor: toAdminDoctorView(doctor) }));
}

export async function listPatients(req: Request, res: Response): Promise<Response> {
  const result = await adminService.listPatients(req.query);
  return res.json(ApiResponse.paginated(paginate(result, toAdminPatientView)));
}

export async function listAppointments(req: Request, res: Response): Promise<Response> {
  const result = await adminService.listAppointments(req.query);
  return res.json(
    ApiResponse.paginated(paginate(result, (a: any) => a.toDetail())),
  );
}
