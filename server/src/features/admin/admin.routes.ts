import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import * as adminController from './admin.controller.js';
import {
  listDoctorsSchema,
  manageDoctorSchema,
  listPatientsSchema,
  listAppointmentsSchema,
} from './admin.schema.js';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole('admin'));

adminRouter.get('/dashboard', adminController.getDashboard);
adminRouter.get('/doctors', validate(listDoctorsSchema), adminController.listDoctors);
adminRouter.patch('/doctors/:id', validate(manageDoctorSchema), adminController.manageDoctor);
adminRouter.get('/patients', validate(listPatientsSchema), adminController.listPatients);
adminRouter.get('/appointments', validate(listAppointmentsSchema), adminController.listAppointments);

export default adminRouter;
