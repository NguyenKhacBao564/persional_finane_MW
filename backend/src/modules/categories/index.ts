import { Router, Request, Response } from 'express';
import { PrismaClient, CategoryType } from '@prisma/client';
import { authGuard } from '../auth/middleware.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/categories - Get all categories
router.get('/', authGuard, async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    const categories = await prisma.category.findMany({
      where: type ? { type: type as CategoryType } : undefined,
      orderBy: { name: 'asc' }
    });

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/:id - Get category by ID
router.get('/:id', authGuard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true, budgets: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// POST /api/categories - Create new category
router.post('/', authGuard, async (req: Request, res: Response) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    if (!['INCOME', 'EXPENSE', 'TRANSFER'].includes(type)) {
      return res.status(400).json({ error: 'Type must be INCOME, EXPENSE, or TRANSFER' });
    }

    const category = await prisma.category.create({
      data: { name, type }
    });

    res.status(201).json({ category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', authGuard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;

    const updateData: { name?: string; type?: CategoryType } = {};
    if (name) updateData.name = name;
    if (type) {
      if (!['INCOME', 'EXPENSE', 'TRANSFER'].includes(type)) {
        return res.status(400).json({ error: 'Type must be INCOME, EXPENSE, or TRANSFER' });
      }
      updateData.type = type;
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData
    });

    res.json({ category });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', authGuard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category has associated transactions or budgets
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true, budgets: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category._count.transactions > 0 || category._count.budgets > 0) {
      return res.status(400).json({
        error: 'Cannot delete category with associated transactions or budgets'
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default { router };
