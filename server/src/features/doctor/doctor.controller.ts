import type { Request, Response } from 'express';
import { doctorService } from './doctor.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import type { IDoctor } from './doctor.model.js';

export async function getMe(req: Request, res: Response): Promise<Response> {
  const doctor = await doctorService.getProfile(req.user!.id);
  return res.json(ApiResponse.ok({ doctor }));
}

export async function updateMe(req: Request, res: Response): Promise<Response> {
  const doctor = await doctorService.updateProfile(req.user!.id, req.body);
  return res.json(ApiResponse.ok({ doctor }));
}

export async function updateAvailability(req: Request, res: Response): Promise<Response> {
  const doctor = await doctorService.updateAvailability(req.user!.id, req.body);
  return res.json(ApiResponse.ok({ doctor }));
}

export async function getPublicProfile(req: Request, res: Response): Promise<Response> {
  const doctor = await doctorService.getPublicById(req.params.id!);
  return res.json(ApiResponse.ok({ doctor }));
}

export async function search(req: Request, res: Response): Promise<Response> {
  const result = await doctorService.search(req.query);
  return res.json(
    ApiResponse.paginated({
      items: result.items.map((d: IDoctor) => d.toPublic()),
      page: result.page,
      limit: result.limit,
      total: result.total,
    }),
  );
}
