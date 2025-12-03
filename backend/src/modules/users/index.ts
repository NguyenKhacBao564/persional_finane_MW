// FE CONTRACT NOTE: Updated to align with frontend expectations ({ success, data: { user, tokens } }) and E1 specs; avoids FE parsing mismatches.
import { Router } from 'express';
import type { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { prisma } from '../../config/prisma';
import authModule from '../auth';

// Users module manages profiles, preferences, and linked financial accounts metadata.
const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').trim(),
});

// GET /api/users/me - Protected route example
router.get('/me', authModule.authGuard, (req: Request, res: Response) => {
  // req.user is guaranteed to exist due to authGuard middleware
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

// PATCH /api/users/me - Update user profile
router.patch('/me', authModule.authGuard, async (req: Request, res: Response) => {
  try {
    const input = updateProfileSchema.parse(req.body);
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: input.name },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    res.json({
      success: true,
      data: {
        user: updatedUser,
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

export default { router };