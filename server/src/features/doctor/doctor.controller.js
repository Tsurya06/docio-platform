import { doctorService } from './doctor.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export async function getMe(req, res) {
  const doctor = await doctorService.getProfile(req.user.id);
  return res.json(ApiResponse.ok({ doctor }));
}

export async function updateMe(req, res) {
  const doctor = await doctorService.updateProfile(req.user.id, req.body);
  return res.json(ApiResponse.ok({ doctor }));
}

export async function updateAvailability(req, res) {
  const doctor = await doctorService.updateAvailability(req.user.id, req.body);
  return res.json(ApiResponse.ok({ doctor }));
}

export async function getPublicProfile(req, res) {
  const doctor = await doctorService.getPublicById(req.params.id);
  return res.json(ApiResponse.ok({ doctor }));
}

export async function search(req, res) {
  const result = await doctorService.search(req.query);
  return res.json(
    ApiResponse.paginated({
      items: result.items.map((d) => d.toPublic()),
      page: result.page,
      limit: result.limit,
      total: result.total,
    }),
  );
}
