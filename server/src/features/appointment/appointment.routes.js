import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import * as appointmentController from './appointment.controller.js';
import {
  createAppointmentSchema,
  cancelAppointmentSchema,
  manageAppointmentSchema,
  listAppointmentsSchema,
} from './appointment.schema.js';

export const appointmentRouter = Router();

/**
 * POST and GET /mine are patient-only via `requireRole('patient')`. GET /:id and
 * PATCH /:id/cancel accept any authenticated role because ownership is checked by
 * the service — a doctor can read/cancel their own appointment, a patient can read/cancel
 * their own. PATCH /:id/manage is doctor-only — confirm/reject/complete are doctor actions,
 * and the service's `assertOwnership` check constrains the appointment to that doctor.
 *
 * Order: /mine is literal and must precede /:id to avoid /mine matching as `:id`.
 */
appointmentRouter.post(
  '/',
  authenticate,
  requireRole('patient'),
  validate(createAppointmentSchema),
  appointmentController.create,
);

appointmentRouter.get(
  '/mine',
  authenticate,
  requireRole('patient'),
  validate(listAppointmentsSchema),
  appointmentController.listMine,
);

appointmentRouter.get(
  '/:id',
  authenticate,
  appointmentController.getById,
);

appointmentRouter.patch(
  '/:id/cancel',
  authenticate,
  validate(cancelAppointmentSchema),
  appointmentController.cancel,
);

appointmentRouter.patch(
  '/:id/manage',
  authenticate,
  requireRole('doctor'),
  validate(manageAppointmentSchema),
  appointmentController.manage,
);

export default appointmentRouter;
