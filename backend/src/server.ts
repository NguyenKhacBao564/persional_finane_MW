// FE CONTRACT NOTE: Updated to align with frontend expectations ({ success, data: { user, tokens } }) and E1 specs; avoids FE parsing mismatches.
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { prisma } from './config/prisma';
import apiRouter from './routes';

// Factory for Express app to keep testing/composability simple.
export function createServer() {
  const app = express();
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json());
  app.use('/api', apiRouter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/health/db', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok' });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: {
          message: 'Database connection failed',
          code: 'DB_CONNECTION_ERROR',
        },
      });
    }
  });

  return app;
}
