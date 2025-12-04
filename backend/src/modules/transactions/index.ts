import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authGuard } from '../auth/middleware.js';
import { asyncHandler, AppError } from '../../middleware/errorHandler.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFiltersSchema,
  type TransactionFilters,
} from './validation.js';
import multer from 'multer';
import Papa from 'papaparse';
import logger from '../../lib/logger.js';

const router = Router();
const prisma = new PrismaClient();
const DEFAULT_ACCOUNT_ID = 'acc_cash';

const categorySelect = {
  id: true,
  name: true,
  type: true,
  color: true,
} as const;

const accountSelect = {
  id: true,
  name: true,
  currency: true,
} as const;

type TransactionLike = {
  id: string;
  occurredAt: Date | string | number;
  type: string;
  amount: Prisma.Decimal | number;
  note?: string | null;
  description?: string | null;
  currency: string;
  category?:
    | {
        id: string;
        name: string;
        type?: string | null;
        color?: string | null;
      }
    | null;
  account?:
    | {
        id: string;
        name: string;
        currency?: string | null;
      }
    | null;
};

const toIsoDate = (value: Date | string | number): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    logger.warn(
      { value },
      'Unable to parse occurredAt value into ISO string, falling back to current time'
    );
    return new Date().toISOString();
  }

  return parsed.toISOString();
};

const toTxDto = <T extends TransactionLike>(transaction: T) => {
  const note = transaction.note ?? transaction.description ?? null;

  return {
    id: transaction.id,
    txDate: toIsoDate(transaction.occurredAt),
    type: transaction.type,
    amount:
      typeof transaction.amount === 'number'
        ? transaction.amount
        : Number(transaction.amount),
    note,
    description: note,
    currency: transaction.currency,
    category: transaction.category
      ? {
          id: transaction.category.id,
          name: transaction.category.name,
          color: transaction.category.color ?? null,
          type: transaction.category.type ?? null,
        }
      : null,
    account: transaction.account
      ? {
          id: transaction.account.id,
          name: transaction.account.name,
          currency: transaction.account.currency ?? null,
        }
      : null,
  };
};

// Configure multer for CSV upload with size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * GET /api/transactions - Get all transactions with filtering and pagination
 * Query params: q, type, categoryId, accountId, minAmount, maxAmount, startDate, endDate, sort, page, limit
 */
router.get(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Validate and parse query params with Zod
    const filters = transactionFiltersSchema.parse(req.query);

    // Build where clause
    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    // Search query in note
    if (filters.q) {
      where.note = {
        contains: filters.q,
        mode: 'insensitive',
      };
    }

    // Filter by transaction type
    if (filters.type) {
      where.type = filters.type;
    }

    // Filter by category
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    // Filter by account
    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    // Filter by amount range
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) {
        where.amount.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        where.amount.lte = filters.maxAmount;
      }
    }

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      where.occurredAt = {};
      if (filters.startDate) {
        where.occurredAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.occurredAt.lte = filters.endDate;
      }
    }

    // Parse sort parameter (format: "field:order")
    const [sortField, sortOrder] = filters.sort?.split(':') ?? [];
    const normalizedField =
      sortField === 'txDate' ? 'occurredAt' : sortField || 'occurredAt';
    const orderBy: Prisma.TransactionOrderByWithRelationInput = {
      [normalizedField]: sortOrder === 'asc' ? 'asc' : 'desc',
    };

    // Pagination
    const skip = (filters.page - 1) * filters.limit;

    // Execute query
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: {
            select: categorySelect,
          },
          account: {
            select: accountSelect,
          },
        },
        orderBy,
        skip,
        take: filters.limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Return unified envelope
    res.json({
      success: true,
      data: {
        items: transactions.map(toTxDto),
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    });
  })
);

/**
 * GET /api/transactions/recent - Get recent transactions (E3-S2)
 * Query params: limit (default: 10)
 */
router.get(
  '/recent',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        category: {
          select: categorySelect,
        },
        account: {
          select: accountSelect,
        },
      },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });

    res.json({
      success: true,
      data: {
        items: transactions.map(toTxDto),
      },
    });
  })
);

/**
 * GET /api/transactions/:id - Get transaction by ID
 */
router.get(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        category: {
          select: categorySelect,
        },
        account: {
          select: accountSelect,
        },
        aiInsights: true,
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        ...toTxDto(transaction),
        aiInsights: transaction.aiInsights,
      },
    });
  })
);

/**
 * POST /api/transactions - Create new transaction
 */
router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Validate with Zod
    const input = createTransactionSchema.parse(req.body);

    // Validate foreign keys exist
    const [category, account] = await Promise.all([
      prisma.category.findUnique({ where: { id: input.categoryId } }),
      prisma.account.findUnique({ where: { id: input.accountId } }),
    ]);

    if (!category) {
      throw new AppError(
        'Invalid categoryId: category not found',
        400,
        'FK_INVALID'
      );
    }

    if (!account) {
      throw new AppError(
        'Invalid accountId: account not found',
        400,
        'FK_INVALID'
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        accountId: input.accountId,
        type: input.type,
        amount: input.amount,
        categoryId: input.categoryId,
        note: input.note ?? null,
        occurredAt: input.txDate,
        currency: input.currency,
      },
      include: {
        category: {
          select: categorySelect,
        },
        account: {
          select: accountSelect,
        },
      },
    });

    res.status(201).json({
      success: true,
      data: toTxDto(transaction),
    });
  })
);

/**
 * PATCH /api/transactions/:id - Update transaction
 */
router.patch(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check ownership
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Transaction not found', 404, 'NOT_FOUND');
    }

    // Validate with Zod
    const input = updateTransactionSchema.parse(req.body);

    // Build update data (use plain object to avoid relation typing issues)
    const updateData: Record<string, unknown> = {};
    if (input.type !== undefined) updateData.type = input.type;
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
    if (input.accountId !== undefined) updateData.accountId = input.accountId;
    if (input.note !== undefined) updateData.note = input.note;
    if (input.txDate !== undefined) updateData.occurredAt = input.txDate;
    if (input.currency !== undefined) updateData.currency = input.currency;

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: categorySelect,
        },
        account: {
          select: accountSelect,
        },
      },
    });

    res.json({
      success: true,
      data: toTxDto(transaction),
    });
  })
);

/**
 * DELETE /api/transactions/:id - Delete transaction
 */
router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check ownership
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Transaction not found', 404, 'NOT_FOUND');
    }

    await prisma.transaction.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: {
        message: 'Transaction deleted successfully',
      },
    });
  })
);

/**
 * POST /api/transactions/upload-csv - Upload and parse CSV file
 */
router.post(
  '/upload-csv',
  authGuard,
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400, 'NO_FILE');
    }

    const userId = req.user!.id;
    const csvContent = req.file.buffer.toString('utf-8');

    // Parse CSV
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
    });

    if (parsed.errors.length > 0) {
      throw new AppError('CSV parsing failed', 400, 'CSV_PARSE_ERROR');
    }

    const rows = parsed.data as Record<string, string>[];
    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; error: string }[],
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Validate required fields
        if (!row.amount || !row.date) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            error: 'Missing required fields: amount or date',
          });
          continue;
        }

        // Parse date
        const occurredAt = new Date(row.date);
        if (isNaN(occurredAt.getTime())) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            error: 'Invalid date format',
          });
          continue;
        }

        // Parse amount (handle thousands separators)
        const amount = parseFloat(row.amount.replace(/,/g, ''));
        if (isNaN(amount) || amount <= 0) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            error: 'Invalid amount',
          });
          continue;
        }

        // Determine transaction type
        const type = row.type?.toUpperCase() === 'IN' ? 'IN' : 'OUT';

        // Find category by name if provided
        let categoryId: string | null = null;
        if (row.category) {
          const category = await prisma.category.findFirst({
            where: {
              name: {
                equals: row.category.trim(),
                mode: 'insensitive',
              },
            },
          });
          categoryId = category?.id || null;
        }

        // Create transaction
        await prisma.transaction.create({
          data: {
            userId,
            type,
            amount,
            categoryId,
            note: row.description || null,
            occurredAt,
            currency: row.currency || 'USD',
            accountId: DEFAULT_ACCOUNT_ID,
          },
        });

        results.success++;
      } catch (error) {
        logger.error({ error, row: i + 2 }, 'CSV row processing error');
        results.failed++;
        results.errors.push({
          row: i + 2,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    res.json({
      success: true,
      data: {
        message: 'CSV processing completed',
        results,
      },
    });
  })
);

// GET /api/transactions/analytics/spending - Calculate total spending by category/month (Task 31)
router.get('/analytics/spending', authGuard, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, groupBy = 'month' } = req.query;

    // Build date filter
    const where: any = { userId };
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) {
        where.occurredAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.occurredAt.lte = new Date(endDate as string);
      }
    }

    // Fetch all transactions within the date range
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true
      },
      orderBy: { occurredAt: 'asc' }
    });

    // Group transactions by period and category
    const spendingData: any = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.occurredAt);
      let periodKey: string;

      // Determine period key based on groupBy parameter
      if (groupBy === 'month') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'week') {
        // Get ISO week number
        const weekNumber = getISOWeekNumber(date);
        periodKey = `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
      } else if (groupBy === 'year') {
        periodKey = `${date.getFullYear()}`;
      } else {
        // Default to month
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      // Initialize period if not exists
      if (!spendingData[periodKey]) {
        spendingData[periodKey] = {
          period: periodKey,
          totalAmount: 0,
          categories: {},
          transactionCount: 0
        };
      }

      // Get category name
      const categoryName = transaction.category?.name || 'Uncategorized';
      const categoryType = transaction.category?.type || 'EXPENSE';

      // Initialize category if not exists
      if (!spendingData[periodKey].categories[categoryName]) {
        spendingData[periodKey].categories[categoryName] = {
          categoryId: transaction.categoryId,
          categoryName,
          categoryType,
          totalAmount: 0,
          transactionCount: 0
        };
      }

      // Add to totals (convert Decimal to number)
      const amount = parseFloat(transaction.amount.toString());
      spendingData[periodKey].totalAmount += amount;
      spendingData[periodKey].categories[categoryName].totalAmount += amount;
      spendingData[periodKey].categories[categoryName].transactionCount += 1;
      spendingData[periodKey].transactionCount += 1;
    });

    // Convert to array and sort by period
    const result = Object.values(spendingData).map((period: any) => ({
      ...period,
      categories: Object.values(period.categories)
    })).sort((a: any, b: any) => a.period.localeCompare(b.period));

    res.json({
      spending: result,
      summary: {
        totalPeriods: result.length,
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
      }
    });
  } catch (error) {
    console.error('Error calculating spending analytics:', error);
    res.status(500).json({ error: 'Failed to calculate spending analytics' });
  }
});

// Helper function to get ISO week number
function getISOWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

export default { router };
