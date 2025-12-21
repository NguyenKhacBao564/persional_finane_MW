import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authGuard } from '../auth/middleware.js';
import { asyncHandler, AppError } from '../../middleware/errorHandler.js';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const router = Router();
const prisma = new PrismaClient();

const accountCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  currency: z.string().min(1, 'Currency is required').default('VND'),
});

const accountUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  currency: z.string().min(1, 'Currency is required').optional(),
});

/**
 * GET /api/accounts - Get all accounts for the authenticated user
 * Returns accounts where userId equals the logged-in user OR userId is null (global accounts)
 */
router.get(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const accounts = await prisma.account.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: { accounts },
    });
  })
);

/**
 * POST /api/accounts - Create a new account
 */
router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const input = accountCreateSchema.parse(req.body);

    const account = await prisma.account.create({
      data: {
        id: `acc_${randomUUID()}`,
        name: input.name,
        currency: input.currency,
        userId,
      },
    });

    res.status(201).json({
      success: true,
      data: { account },
    });
  })
);

/**
 * PATCH /api/accounts/:id - Update account
 */
router.patch(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const input = accountUpdateSchema.parse(req.body);

    const existing = await prisma.account.findFirst({
      where: {
        id,
        OR: [{ userId }, { userId: null }],
      },
    });

    if (!existing) {
      throw new AppError('Account not found', 404, 'NOT_FOUND');
    }

    if (existing.userId !== userId) {
      throw new AppError('Cannot update global account', 403, 'FORBIDDEN');
    }

    const account = await prisma.account.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.currency && { currency: input.currency }),
      },
    });

    res.json({
      success: true,
      data: { account },
    });
  })
);

/**
 * DELETE /api/accounts/:id - Delete account (only if no transactions reference it)
 */
router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const account = await prisma.account.findFirst({
      where: {
        id,
        OR: [{ userId }, { userId: null }],
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!account) {
      throw new AppError('Account not found', 404, 'NOT_FOUND');
    }

    if (account.userId !== userId) {
      throw new AppError('Cannot delete global account', 403, 'FORBIDDEN');
    }

    if (account._count.transactions > 0) {
      throw new AppError(
        'Cannot delete account with associated transactions',
        400,
        'DELETION_BLOCKED'
      );
    }

    await prisma.account.delete({ where: { id } });

    res.json({
      success: true,
      data: { message: 'Account deleted successfully' },
    });
  })
);

export default { router };
