// FE CONTRACT NOTE: Updated to align with frontend expectations ({ success, data: { user, tokens } }) and E1 specs; avoids FE parsing mismatches.
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './lib/logger.js';

// Factory for Express app to keep testing/composability simple.
export function createServer() {
  const app = express();
  
  // CORS
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  
  // Body parsing
  app.use(express.json());
  
  // Request logging
  app.use((req, _res, next) => {
    logger.info({
      method: req.method,
      url: req.url,
      userId: req.user?.id,
    }, 'Incoming request');
    next();
  });

  // Health checks
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

  // API routes
  app.use('/api', apiRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'Not found',
        code: 'NOT_FOUND',
      },
    });
  });

  // Centralized error handler (must be last)
  app.use(errorHandler);

  return app;
}
