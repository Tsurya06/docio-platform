import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { notFound } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { healthRouter } from './features/health/health.routes.js';
import { authRouter } from './features/auth/auth.routes.js';
import { patientRouter } from './features/patient/patient.routes.js';
import { doctorRouter } from './features/doctor/doctor.routes.js';
import { appointmentRouter } from './features/appointment/appointment.routes.js';
import { adminRouter } from './features/admin/admin.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN ?? true,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === '/api/v1/health',
      },
    }),
  );

  app.get('/', (_req, res) => {
    res.json({ name: 'Docio API', version: '0.1.0' });
  });

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/patients', patientRouter);
  app.use('/api/v1/doctors', doctorRouter);
  app.use('/api/v1/appointments', appointmentRouter);
  app.use('/api/v1/admin', adminRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
