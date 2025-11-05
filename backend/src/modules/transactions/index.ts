import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authGuard } from '../auth/middleware.js';
import multer from 'multer';
import Papa from 'papaparse';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for CSV upload
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/transactions - Get all transactions with filtering (Task 20)
router.get('/', authGuard, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      categoryId,
      startDate,
      endDate,
      keyword,
      page = '1',
      limit = '50'
    } = req.query;

    // Build where clause for filtering
    const where: any = { userId };

    // Filter by category
    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) {
        where.occurredAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.occurredAt.lte = new Date(endDate as string);
      }
    }

    // Filter by keyword (search in description)
    if (keyword) {
      where.description = {
        contains: keyword as string,
        mode: 'insensitive'
      };
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: true
        },
        orderBy: { occurredAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /api/transactions/:id - Get transaction by ID
router.get('/:id', authGuard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        category: true,
        aiInsights: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// POST /api/transactions - Create new transaction
router.post('/', authGuard, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { amount, categoryId, description, occurredAt, currency } = req.body;

    if (!amount || !occurredAt) {
      return res.status(400).json({ error: 'Amount and occurredAt are required' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: parseFloat(amount),
        categoryId: categoryId || null,
        description: description || null,
        occurredAt: new Date(occurredAt),
        currency: currency || 'USD'
      },
      include: {
        category: true
      }
    });

    res.status(201).json({ transaction });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// PUT /api/transactions/:id - Update transaction
router.put('/:id', authGuard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { amount, categoryId, description, occurredAt, currency } = req.body;

    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId }
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const updateData: any = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (description !== undefined) updateData.description = description || null;
    if (occurredAt !== undefined) updateData.occurredAt = new Date(occurredAt);
    if (currency !== undefined) updateData.currency = currency;

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    });

    res.json({ transaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', authGuard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId }
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await prisma.transaction.delete({
      where: { id }
    });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// POST /api/transactions/upload-csv - Upload CSV file and parse transactions (Task 24)
router.post('/upload-csv', authGuard, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user!.id;
    const csvContent = req.file.buffer.toString('utf-8');

    // Parse CSV using PapaParse
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase()
    });

    if (parsed.errors.length > 0) {
      return res.status(400).json({
        error: 'CSV parsing failed',
        details: parsed.errors
      });
    }

    const rows = parsed.data as any[];
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Required fields: amount, date
        if (!row.amount || !row.date) {
          results.failed++;
          results.errors.push({
            row: i + 2, // +2 because of header and 0-index
            error: 'Missing required fields: amount or date'
          });
          continue;
        }

        // Parse date
        const occurredAt = new Date(row.date);
        if (isNaN(occurredAt.getTime())) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            error: 'Invalid date format'
          });
          continue;
        }

        // Find category by name if provided
        let categoryId = null;
        if (row.category) {
          const category = await prisma.category.findFirst({
            where: {
              name: {
                equals: row.category.trim(),
                mode: 'insensitive'
              }
            }
          });
          categoryId = category?.id || null;
        }

        // Create transaction
        await prisma.transaction.create({
          data: {
            userId,
            amount: parseFloat(row.amount),
            categoryId,
            description: row.description || null,
            occurredAt,
            currency: row.currency || 'USD'
          }
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: i + 2,
          error: error.message
        });
      }
    }

    res.json({
      message: 'CSV processing completed',
      results
    });
  } catch (error) {
    console.error('Error processing CSV:', error);
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

export default { router };
