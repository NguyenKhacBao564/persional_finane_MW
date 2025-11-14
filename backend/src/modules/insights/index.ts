import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authGuard } from '../auth/middleware';
import { asyncHandler, AppError } from '../../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

/**
 * E3-S1: GET /api/insights/summary - Get financial summary for a date range
 * Query params: start (ISO date), end (ISO date)
 * Returns: { income, expense, balance }
 */
router.get(
  '/summary',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Validate query params
    const schema = z.object({
      start: z.coerce.date(),
      end: z.coerce.date(),
    });

    const { start, end } = schema.parse(req.query);

    // Validate date range
    if (start > end) {
      throw new AppError('Start date must be before end date', 400, 'INVALID_DATE_RANGE');
    }

    // Calculate income (IN transactions)
    const incomeResult = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'IN',
        occurredAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate expense (OUT transactions)
    const expenseResult = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'OUT',
        occurredAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const income = Number(incomeResult._sum.amount || 0);
    const expense = Number(expenseResult._sum.amount || 0);
    const balance = income - expense;

    res.json({
      success: true,
      data: {
        income,
        expense,
        balance,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  })
);

/**
 * E3-S3: GET /api/insights/spending-by-category - Get spending grouped by category
 * Query params: start (ISO date), end (ISO date)
 * Returns: [{ categoryId, categoryName, total, transactionCount }]
 */
router.get(
  '/spending-by-category',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Validate query params
    const schema = z.object({
      start: z.coerce.date(),
      end: z.coerce.date(),
    });

    const { start, end } = schema.parse(req.query);

    // Validate date range
    if (start > end) {
      throw new AppError('Start date must be before end date', 400, 'INVALID_DATE_RANGE');
    }

    // Group by category
    const grouped = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'OUT', // Only expenses
        occurredAt: {
          gte: start,
          lte: end,
        },
        categoryId: {
          not: null, // Exclude uncategorized
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Fetch category names
    const categoryIds = grouped
      .map((g) => g.categoryId)
      .filter((id): id is string => id !== null);

    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    // Create category map
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // Build response
    const spending = grouped.map((g) => {
      const category = categoryMap.get(g.categoryId!);
      return {
        categoryId: g.categoryId!,
        categoryName: category?.name || 'Unknown',
        categoryType: category?.type || 'EXPENSE',
        total: Number(g._sum.amount || 0),
        transactionCount: g._count.id,
      };
    });

    // Sort by total descending
    spending.sort((a, b) => b.total - a.total);

    res.json({
      success: true,
      data: {
        spending,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  })
);

/**
 * GET /api/insights/income-by-category - Get income grouped by category
 * Query params: start (ISO date), end (ISO date)
 * Returns: [{ categoryId, categoryName, total, transactionCount }]
 */
router.get(
  '/income-by-category',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Validate query params
    const schema = z.object({
      start: z.coerce.date(),
      end: z.coerce.date(),
    });

    const { start, end } = schema.parse(req.query);

    // Validate date range
    if (start > end) {
      throw new AppError('Start date must be before end date', 400, 'INVALID_DATE_RANGE');
    }

    // Group by category
    const grouped = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'IN', // Only income
        occurredAt: {
          gte: start,
          lte: end,
        },
        categoryId: {
          not: null,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Fetch category names
    const categoryIds = grouped
      .map((g) => g.categoryId)
      .filter((id): id is string => id !== null);

    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    // Create category map
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // Build response
    const income = grouped.map((g) => {
      const category = categoryMap.get(g.categoryId!);
      return {
        categoryId: g.categoryId!,
        categoryName: category?.name || 'Unknown',
        categoryType: category?.type || 'INCOME',
        total: Number(g._sum.amount || 0),
        transactionCount: g._count.id,
      };
    });

    // Sort by total descending
    income.sort((a, b) => b.total - a.total);

    res.json({
      success: true,
      data: {
        income,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  })
);

/**
 * GET /api/insights/trends - Get spending trends over time
 * Query params: start, end, interval ('day' | 'week' | 'month')
 */
router.get(
  '/trends',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const schema = z.object({
      start: z.coerce.date(),
      end: z.coerce.date(),
      interval: z.enum(['day', 'week', 'month']).default('day'),
    });

    const { start, end, interval } = schema.parse(req.query);

    if (start > end) {
      throw new AppError('Start date must be before end date', 400, 'INVALID_DATE_RANGE');
    }

    // Fetch all transactions in range
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        occurredAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        type: true,
        amount: true,
        occurredAt: true,
      },
      orderBy: {
        occurredAt: 'asc',
      },
    });

    // Group by interval
    const trends: Record<string, { income: number; expense: number; date: string }> = {};

    transactions.forEach((tx) => {
      let key: string;
      const date = new Date(tx.occurredAt);

      switch (interval) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        }
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!trends[key]) {
        trends[key] = { income: 0, expense: 0, date: key };
      }

      const amount = Number(tx.amount);
      if (tx.type === 'IN') {
        trends[key].income += amount;
      } else {
        trends[key].expense += amount;
      }
    });

    // Convert to array and sort
    const trendsArray = Object.values(trends).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    res.json({
      success: true,
      data: {
        trends: trendsArray,
        interval,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  })
);

export default { router };
