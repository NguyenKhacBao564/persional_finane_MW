// FE CONTRACT NOTE: Updated to align with frontend expectations ({ success, data: { user, tokens } }) and E1 specs; avoids FE parsing mismatches.
import { Router } from 'express';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { registerSchema, loginSchema, refreshTokenSchema } from './validation';
import * as authService from './service';
import { authGuard, optionalAuth } from './middleware';

// Auth module handles registration, login, password reset, token refresh flows.
const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          message: error.errors.map(e => e.message).join(', '),
          code: 'VALIDATION_ERROR',
        },
      });
    } else if (error instanceof Error) {
      const statusCode = error.message.includes('already exists') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        error: {
          message: error.message,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          message: 'An unexpected error occurred',
        },
      });
    }
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          message: error.errors.map(e => e.message).join(', '),
          code: 'VALIDATION_ERROR',
        },
      });
    } else if (error instanceof Error) {
      res.status(401).json({
        success: false,
        error: {
          message: error.message,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          message: 'An unexpected error occurred',
        },
      });
    }
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const input = refreshTokenSchema.parse(req.body);
    const result = await authService.refreshAccessToken(input.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          message: error.errors.map(e => e.message).join(', '),
          code: 'VALIDATION_ERROR',
        },
      });
    } else if (error instanceof Error) {
      res.status(401).json({
        success: false,
        error: {
          message: error.message,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          message: 'An unexpected error occurred',
        },
      });
    }
  }
});

export default { router, authGuard, optionalAuth };
