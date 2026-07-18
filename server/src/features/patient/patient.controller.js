import { patientService } from './patient.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export async function getMe(req, res) {
  const profile = await patientService.getProfile(req.user.id);
  return res.json(ApiResponse.ok({ profile }));
}

export async function updateMe(req, res) {
  const profile = await patientService.updateProfile(req.user.id, req.body);
  return res.json(ApiResponse.ok({ profile }));
}
