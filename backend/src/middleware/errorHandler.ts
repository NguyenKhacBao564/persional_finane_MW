import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import logger from '../lib/logger.js';

/**
 * Standard API error response shape
 */
export interface ApiError {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

/**
 * Centralized error handler middleware
 * Converts all errors to unified envelope format: { success: false, error: { message, code } }
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error for debugging (production-safe with pino)
  logger.error(
    {
      err,
      method: req.method,
      url: req.url,
      body: req.body,
      userId: req.user?.id,
    },
    'Request error'
  );

  // Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details,
      },
    } satisfies ApiError);
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint violation
        res.status(409).json({
          success: false,
          error: {
            message: 'Resource already exists',
            code: 'CONFLICT',
          },
        } satisfies ApiError);
        return;
      case 'P2025': // Record not found
        res.status(404).json({
          success: false,
          error: {
            message: 'Resource not found',
            code: 'NOT_FOUND',
          },
        } satisfies ApiError);
        return;
      case 'P2003': // Foreign key constraint failed
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid reference',
            code: 'INVALID_REFERENCE',
          },
        } satisfies ApiError);
        return;
      default:
        res.status(500).json({
          success: false,
          error: {
            message: 'Database error',
            code: 'DATABASE_ERROR',
          },
        } satisfies ApiError);
        return;
    }
  }

  // Custom app errors with status codes
  if ('statusCode' in err && typeof err.statusCode === 'number') {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: 'code' in err && typeof err.code === 'string' ? err.code : undefined,
      },
    } satisfies ApiError);
    return;
  }

  // Default 500 error
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  } satisfies ApiError);
}

/**
 * Custom error class for app-specific errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
