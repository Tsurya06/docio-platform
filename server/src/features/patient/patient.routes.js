import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import * as patientController from './patient.controller.js';
import { updateProfileSchema } from './patient.schema.js';

export const patientRouter = Router();

patientRouter.use(authenticate, requireRole('patient'));

patientRouter.get('/me', patientController.getMe);
patientRouter.patch('/me', validate(updateProfileSchema), patientController.updateMe);

export default patientRouter;
