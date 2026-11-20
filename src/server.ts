import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { loadConfig } from './config/env';

/** Process entry point: validate config, connect to MongoDB, then accept HTTP traffic. */
async function main(): Promise<void> {
  const config = loadConfig();

  await connectDatabase(config.mongodbUri);
  console.log('Connected to MongoDB');

  const server = createApp().listen(config.port, () => {
    console.log(`Movie Reviews API listening on http://localhost:${config.port} (${config.nodeEnv})`);
  });

  const shutdown = (signal: string): void => {
    console.log(`${signal} received, shutting down`);
    server.close(() => {
      disconnectDatabase()
        .then(() => process.exit(0))
        .catch((err: unknown) => {
          console.error(err);
          process.exit(1);
        });
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err: unknown) => {
  console.error('Failed to start server:', err instanceof Error ? err.message : err);
  process.exit(1);
});
