import mongoose from 'mongoose';
import { ApiResponse } from '../../utils/ApiResponse.js';

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

export async function getHealth(_req, res) {
  const database = DB_STATES[mongoose.connection.readyState] ?? 'unknown';

  return res.json(
    ApiResponse.ok({
      status: 'ok',
      database,
      uptime: process.uptime(),
    }),
  );
}
