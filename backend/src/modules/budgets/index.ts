import { Router, Request, Response } from 'express';
import { PrismaClient, BudgetPeriod } from '@prisma/client';
import { authGuard } from '../auth/middleware.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/budgets - Get all budgets for the authenticated user
router.get('/', authGuard, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { period, categoryId } = req.query;

    const where: any = { userId };

    // Filter by period if provided
    if (period && Object.values(BudgetPeriod).includes(period as BudgetPeriod)) {
      where.period = period as BudgetPeriod;
    }

    // Filter by category if provided
    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ budgets });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// GET /api/budgets/:id - Get budget by ID
router.get('/:id', authGuard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const budget = await prisma.budget.findFirst({
      where: { id, userId },
      include: {
        category: true
      }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({ budget });
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// POST /api/budgets - Create new budget
router.post('/', authGuard, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { amount, period, categoryId } = req.body;

    // Validate required fields
    if (!amount || !period) {
      return res.status(400).json({ error: 'Amount and period are required' });
    }

    // Validate period enum
    if (!Object.values(BudgetPeriod).includes(period)) {
      return res.status(400).json({
        error: 'Invalid period. Must be one of: MONTHLY, WEEKLY, ANNUAL'
      });
    }

    // Validate categoryId if provided
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
    }

    const budget = await prisma.budget.create({
      data: {
        userId,
        amount: parseFloat(amount),
        period: period as BudgetPeriod,
        categoryId: categoryId || null
      },
      include: {
        category: true
      }
    });

    res.status(201).json({ budget });
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// PUT /api/budgets/:id - Update budget
router.put('/:id', authGuard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { amount, period, categoryId } = req.body;

    // Check if budget exists and belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: { id, userId }
    });

    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    const updateData: any = {};

    if (amount !== undefined) {
      updateData.amount = parseFloat(amount);
    }

    if (period !== undefined) {
      if (!Object.values(BudgetPeriod).includes(period)) {
        return res.status(400).json({
          error: 'Invalid period. Must be one of: MONTHLY, WEEKLY, ANNUAL'
        });
      }
      updateData.period = period as BudgetPeriod;
    }

    if (categoryId !== undefined) {
      if (categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: categoryId }
        });

        if (!category) {
          return res.status(404).json({ error: 'Category not found' });
        }
      }
      updateData.categoryId = categoryId || null;
    }

    const budget = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    });

    res.json({ budget });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// DELETE /api/budgets/:id - Delete budget
router.delete('/:id', authGuard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if budget exists and belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: { id, userId }
    });

    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await prisma.budget.delete({
      where: { id }
    });

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

export default { router };
