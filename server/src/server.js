import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';

let server;

async function start() {
  await connectDatabase();
  const app = createApp();
  server = app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
  });
}

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});

function shutdown(signal) {
  logger.info({ signal }, 'Shutting down gracefully');
  if (!server) {
    process.exit(0);
    return;
  }
  server.close(async () => {
    logger.info('HTTP server closed');
    await disconnectDatabase();
    logger.info('Database disconnected');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
