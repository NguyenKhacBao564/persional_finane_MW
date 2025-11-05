import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authGuard } from '../auth/middleware';
import { asyncHandler, AppError } from '../../middleware/errorHandler';
import logger from '../../lib/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * Category suggestion structure
 */
interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reason?: string;
}

/**
 * Simple keyword-based category suggestion engine
 * In production, this would use ML/AI models
 */
class SuggestionEngine {
  private readonly keywords: Record<string, { categoryName: string; keywords: string[] }> = {
    // Income categories
    salary: { categoryName: 'Salary', keywords: ['salary', 'wage', 'payroll', 'income'] },
    freelance: { categoryName: 'Freelance', keywords: ['freelance', 'contract', 'consulting'] },

    // Expense categories
    food: { categoryName: 'Food & Dining', keywords: ['restaurant', 'cafe', 'food', 'dining', 'lunch', 'dinner', 'breakfast'] },
    groceries: { categoryName: 'Groceries', keywords: ['supermarket', 'grocery', 'market', 'food store'] },
    transport: { categoryName: 'Transportation', keywords: ['uber', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'bus'] },
    utilities: { categoryName: 'Utilities', keywords: ['electric', 'water', 'gas', 'internet', 'phone'] },
    entertainment: { categoryName: 'Entertainment', keywords: ['movie', 'cinema', 'netflix', 'spotify', 'game'] },
    shopping: { categoryName: 'Shopping', keywords: ['amazon', 'store', 'shop', 'mall'] },
    health: { categoryName: 'Healthcare', keywords: ['doctor', 'hospital', 'pharmacy', 'medical'] },
    fitness: { categoryName: 'Fitness', keywords: ['gym', 'fitness', 'yoga', 'sport'] },
  };

  async suggest(params: {
    description?: string;
    amount?: number;
    merchant?: string;
  }): Promise<CategorySuggestion[]> {
    const suggestions: CategorySuggestion[] = [];
    const searchText = [params.description, params.merchant]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (!searchText) {
      return suggestions;
    }

    // Score each category based on keyword matches
    for (const [key, config] of Object.entries(this.keywords)) {
      let score = 0;
      const matchedKeywords: string[] = [];

      for (const keyword of config.keywords) {
        if (searchText.includes(keyword)) {
          score += 1;
          matchedKeywords.push(keyword);
        }
      }

      if (score > 0) {
        // Find category in database
        const category = await prisma.category.findFirst({
          where: {
            name: {
              equals: config.categoryName,
              mode: 'insensitive',
            },
          },
        });

        if (category) {
          const confidence = Math.min(score * 0.3, 0.95);
          suggestions.push({
            categoryId: category.id,
            categoryName: category.name,
            confidence,
            reason: `Matched keywords: ${matchedKeywords.join(', ')}`,
          });
        }
      }
    }

    // Sort by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);

    return suggestions.slice(0, 3); // Return top 3
  }
}

const suggestionEngine = new SuggestionEngine();

/**
 * GET /api/suggestions/transaction/:id - Get category suggestions for a transaction
 */
router.get(
  '/transaction/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    // Fetch transaction
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404, 'NOT_FOUND');
    }

    // Skip if already has category
    if (transaction.categoryId) {
      res.json({
        success: true,
        data: {
          suggestions: [],
          message: 'Transaction already has a category',
        },
      });
      return;
    }

    // Generate suggestions
    const suggestions = await suggestionEngine.suggest({
      description: transaction.description || undefined,
      amount: Number(transaction.amount),
    });

    res.json({
      success: true,
      data: {
        suggestions,
      },
    });
  })
);

/**
 * GET /api/suggestions/category - Get category suggestions based on query params
 * Query params: note, amount, merchant
 */
router.get(
  '/category',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      note: z.string().optional(),
      amount: z.coerce.number().optional(),
      merchant: z.string().optional(),
    });

    const params = schema.parse(req.query);

    const suggestions = await suggestionEngine.suggest({
      description: params.note,
      amount: params.amount,
      merchant: params.merchant,
    });

    res.json({
      success: true,
      data: {
        suggestions,
      },
    });
  })
);

/**
 * POST /api/suggestions/apply/:id - Apply category to a single transaction
 */
router.post(
  '/apply/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const schema = z.object({
      categoryId: z.string().uuid('Invalid category ID'),
    });

    const { categoryId } = schema.parse(req.body);

    // Check transaction ownership
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404, 'NOT_FOUND');
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    // Update transaction
    const updated = await prisma.transaction.update({
      where: { id },
      data: { categoryId },
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
      data: updated,
    });
  })
);

/**
 * POST /api/suggestions/apply-bulk - Apply categories to multiple transactions
 * Body: { items: [{ txId: string, categoryId: string }] }
 */
router.post(
  '/apply-bulk',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const schema = z.object({
      items: z.array(
        z.object({
          txId: z.string().uuid(),
          categoryId: z.string().uuid(),
        })
      ),
    });

    const { items } = schema.parse(req.body);

    if (items.length === 0) {
      throw new AppError('No items provided', 400, 'NO_ITEMS');
    }

    if (items.length > 100) {
      throw new AppError('Too many items (max 100)', 400, 'TOO_MANY_ITEMS');
    }

    // Verify all transactions belong to user
    const txIds = items.map((i) => i.txId);
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: txIds },
        userId,
      },
      select: { id: true },
    });

    if (transactions.length !== items.length) {
      throw new AppError(
        'Some transactions not found or do not belong to user',
        403,
        'FORBIDDEN'
      );
    }

    // Bulk update using transaction
    const results = await prisma.$transaction(
      items.map((item) =>
        prisma.transaction.update({
          where: { id: item.txId },
          data: { categoryId: item.categoryId },
        })
      )
    );

    res.json({
      success: true,
      data: {
        updated: results.length,
        message: `Successfully updated ${results.length} transactions`,
      },
    });
  })
);

export default { router };
