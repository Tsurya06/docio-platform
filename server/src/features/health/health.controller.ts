import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ApiResponse } from '../../utils/ApiResponse.js';

const DB_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export async function getHealth(_req: Request, res: Response): Promise<Response> {
  const database = DB_STATES[mongoose.connection.readyState] ?? 'unknown';

  return res.json(
    ApiResponse.ok({
      status: 'ok',
      database,
      uptime: process.uptime(),
    }),
  );
}
