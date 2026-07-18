import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as authController from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), authController.register);
authRouter.post('/login', validate(loginSchema), authController.login);
authRouter.post('/refresh-token', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
authRouter.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
authRouter.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);
authRouter.get('/me', authenticate, authController.getMe);

export default authRouter;
