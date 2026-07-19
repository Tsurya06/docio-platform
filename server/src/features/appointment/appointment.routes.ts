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
