import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authGuard } from '../auth/middleware.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/goals - Get all goals for the authenticated user
router.get('/', authGuard, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// GET /api/goals/:id - Get goal by ID
router.get('/:id', authGuard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const goal = await prisma.goal.findFirst({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ goal });
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// POST /api/goals - Create new goal
router.post('/', authGuard, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, targetAmount, targetDate, progress } = req.body;

    // Validate required fields
    if (!title || !targetAmount) {
      return res.status(400).json({ error: 'Title and targetAmount are required' });
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        title,
        targetAmount: parseFloat(targetAmount),
        targetDate: targetDate ? new Date(targetDate) : null,
        progress: progress ? parseFloat(progress) : 0
      }
    });

    res.status(201).json({ goal });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PUT /api/goals/:id - Update goal
router.put('/:id', authGuard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { title, targetAmount, targetDate, progress } = req.body;

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId }
    });

    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = title;
    }

    if (targetAmount !== undefined) {
      updateData.targetAmount = parseFloat(targetAmount);
    }

    if (targetDate !== undefined) {
      updateData.targetDate = targetDate ? new Date(targetDate) : null;
    }

    if (progress !== undefined) {
      updateData.progress = parseFloat(progress);
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData
    });

    res.json({ goal });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// DELETE /api/goals/:id - Delete goal
router.delete('/:id', authGuard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId }
    });

    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await prisma.goal.delete({
      where: { id }
    });

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default { router };
