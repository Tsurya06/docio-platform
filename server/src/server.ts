import type { Server } from 'http';
import cluster from 'node:cluster';
import os from 'node:os';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';

let server: Server | undefined;

async function start() {
  if (env.NODE_ENV === 'production' && cluster.isPrimary) {
    const numCPUs = os.availableParallelism ? os.availableParallelism() : os.cpus().length;
    logger.info(`Primary process ${process.pid} is running. Forking ${numCPUs} workers as a load balancer...`);

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      logger.error(`Worker process ${worker.process.pid} died (code: ${code}, signal: ${signal}). Spawning replacement...`);
      cluster.fork();
    });
  } else {
    await connectDatabase();
    const app = createApp();
    server = app.listen(env.PORT, () => {
      logger.info(`Worker process ${process.pid} listening on port ${env.PORT}`);
    });

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});

function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down worker process gracefully');
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
