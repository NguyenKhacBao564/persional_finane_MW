import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authGuard } from '../auth/middleware.js';
import { asyncHandler, AppError } from '../../middleware/errorHandler.js';
import {
  budgetCreateSchema,
  listQuerySchema,
  summaryQuerySchema,
  updateBudgetSchema,
} from './validation.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * Helper: Get month start and end dates
 */
function getMonthWindow(month: string): { start: Date; end: Date } {
  const [year, monthNum] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthNum, 1, 0, 0, 0, 0));
  return { start, end };
}

/**
 * GET /api/budgets - List budgets
 */
router.get(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const query = listQuerySchema.parse(req.query);

    const where: any = { userId };
    if (query.month) {
      where.month = query.month;
    }

    const skip = (query.page - 1) * query.limit;

    const [budgets, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        orderBy: { month: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.budget.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: budgets.map((b) => ({
          id: b.id,
          categoryId: b.categoryId,
          categoryName: b.category.name,
          categoryColor: b.category.color,
          month: b.month,
          limit: Number(b.limit),
          createdAt: b.createdAt.toISOString(),
        })),
        total,
        page: query.page,
        limit: query.limit,
      },
    });
  })
);

/**
 * POST /api/budgets - Upsert budget
 */
router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    // Parse and validate with coercion
    const input = budgetCreateSchema.parse(req.body);

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });

    if (!category) {
      throw new AppError('Category not found', 400, 'INVALID_CATEGORY');
    }

    // Upsert budget
    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month: {
          userId,
          categoryId: input.categoryId,
          month: input.month,
        },
      },
      update: {
        limit: input.limit,
      },
      create: {
        userId,
        categoryId: input.categoryId,
        month: input.month,
        limit: input.limit,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.category.name,
        categoryColor: budget.category.color,
        month: budget.month,
        limit: Number(budget.limit),
      },
    });
  })
);

/**
 * PATCH /api/budgets/:id - Update budget
 */
router.patch(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const input = updateBudgetSchema.parse(req.body);

    // Check ownership
    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Budget not found', 404, 'NOT_FOUND');
    }

    const budget = await prisma.budget.update({
      where: { id },
      data: { limit: input.limit },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.category.name,
        categoryColor: budget.category.color,
        month: budget.month,
        limit: Number(budget.limit),
      },
    });
  })
);

/**
 * DELETE /api/budgets/:id - Delete budget
 */
router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check ownership
    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Budget not found', 404, 'NOT_FOUND');
    }

    await prisma.budget.delete({ where: { id } });

    res.json({
      success: true,
      data: { id },
    });
  })
);

/**
 * GET /api/budgets/summary - Get budget summary with spending
 */
router.get(
  '/summary',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const query = summaryQuerySchema.parse(req.query);

    const { start, end } = getMonthWindow(query.month);

    // Get all budgets for the month
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        month: query.month,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // Compute spending for each budget
    const items = await Promise.all(
      budgets.map(async (budget) => {
        const result = await prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            type: 'OUT',
            occurredAt: {
              gte: start,
              lt: end,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const spent = Number(result._sum.amount || 0);
        const limit = Number(budget.limit);
        const percent = limit > 0 ? spent / limit : 0;

        return {
          id: budget.id,
          categoryId: budget.categoryId,
          categoryName: budget.category.name,
          categoryColor: budget.category.color,
          month: budget.month,
          limit,
          spent,
          percent,
        };
      })
    );

    // Calculate totals
    const totals = items.reduce(
      (acc, item) => ({
        limit: acc.limit + item.limit,
        spent: acc.spent + item.spent,
      }),
      { limit: 0, spent: 0 }
    );

    res.json({
      success: true,
      data: {
        items,
        totals,
      },
    });
  })
);

export default { router };
