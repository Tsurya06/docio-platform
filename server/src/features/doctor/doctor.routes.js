import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import * as doctorController from './doctor.controller.js';
import * as appointmentController from '../appointment/appointment.controller.js';
import {
  updateProfileSchema,
  updateAvailabilitySchema,
  searchDoctorsSchema,
} from './doctor.schema.js';
import {
  manageAppointmentSchema,
  listAppointmentsSchema,
  availabilityQuerySchema,
} from '../appointment/appointment.schema.js';

export const doctorRouter = Router();

/**
 * Route order matters: literal segments (/me, /me/availability, /me/appointments) must precede
 * param routes (/:id, /:id/availability) so they don't get captured by the param route.
 */
doctorRouter.get('/', validate(searchDoctorsSchema), doctorController.search);

doctorRouter.get('/me', authenticate, requireRole('doctor'), doctorController.getMe);
doctorRouter.patch('/me', authenticate, requireRole('doctor'), validate(updateProfileSchema), doctorController.updateMe);
doctorRouter.put(
  '/me/availability',
  authenticate,
  requireRole('doctor'),
  validate(updateAvailabilitySchema),
  doctorController.updateAvailability,
);

doctorRouter.get(
  '/me/appointments',
  authenticate,
  requireRole('doctor'),
  validate(listAppointmentsSchema),
  appointmentController.listForDoctor,
);
doctorRouter.patch(
  '/me/appointments/:id',
  authenticate,
  requireRole('doctor'),
  validate(manageAppointmentSchema),
  appointmentController.manage,
);

doctorRouter.get('/:id', doctorController.getPublicProfile);
doctorRouter.get('/:id/availability', validate(availabilityQuerySchema), appointmentController.getAvailability);

export default doctorRouter;
