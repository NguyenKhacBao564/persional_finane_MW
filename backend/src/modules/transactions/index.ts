import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authGuard } from '../auth/middleware';
import { asyncHandler, AppError } from '../../middleware/errorHandler';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFiltersSchema,
  type TransactionFilters,
} from './validation';
import multer from 'multer';
import Papa from 'papaparse';
import logger from '../../lib/logger';

const router = Router();
const prisma = new PrismaClient();

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

    // Search query in description
    if (filters.q) {
      where.description = {
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

    // Filter by account (if accountId field exists)
    if (filters.accountId) {
      // Note: Current schema doesn't have accountId on Transaction
      // This is a placeholder for when it's added
      // where.accountId = filters.accountId;
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
    const [sortField, sortOrder] = filters.sort.split(':');
    const orderBy: Prisma.TransactionOrderByWithRelationInput = {
      [sortField || 'occurredAt']: sortOrder === 'asc' ? 'asc' : 'desc',
    };

    // Pagination
    const skip = (filters.page - 1) * filters.limit;

    // Execute query
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              type: true,
            },
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
        items: transactions,
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
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });

    res.json({
      success: true,
      data: {
        items: transactions,
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
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        aiInsights: true,
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: transaction,
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

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: input.type,
        amount: input.amount,
        categoryId: input.categoryId || null,
        description: input.description,
        occurredAt: input.occurredAt,
        currency: input.currency,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: transaction,
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
    if (input.description !== undefined) updateData.description = input.description;
    if (input.occurredAt !== undefined) updateData.occurredAt = input.occurredAt;
    if (input.currency !== undefined) updateData.currency = input.currency;

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: transaction,
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
            description: row.description || null,
            occurredAt,
            currency: row.currency || 'USD',
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

export default { router };
