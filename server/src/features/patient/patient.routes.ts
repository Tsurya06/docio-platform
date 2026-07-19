import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getMe, updateMe } from './patient.controller.js';
import { updateProfileSchema } from './patient.schema.js';

export const patientRouter = Router();

patientRouter.get('/me', authenticate, requireRole('patient'), getMe);
patientRouter.patch('/me', authenticate, requireRole('patient'), validate(updateProfileSchema), updateMe);

export default patientRouter;
