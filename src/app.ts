import express, { type Express } from 'express';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { healthRouter } from './routes/health.routes';

/**
 * Builds the Express application without starting a server or touching the
 * database, so tests can drive it directly with Supertest.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.use('/health', healthRouter);
  // Feature routers (/api/auth, /api/movies, /api/reviews) are mounted here in later stages.

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
