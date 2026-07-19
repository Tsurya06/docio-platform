import type { Request, Response } from 'express';
import { patientService } from './patient.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export async function getMe(req: Request, res: Response): Promise<Response> {
  const profile = await patientService.getProfile(req.user!.id);
  return res.json(ApiResponse.ok({ profile }));
}

export async function updateMe(req: Request, res: Response): Promise<Response> {
  const profile = await patientService.updateProfile(req.user!.id, req.body);
  return res.json(ApiResponse.ok({ profile }));
}
