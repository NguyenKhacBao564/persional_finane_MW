import { Router, Request, Response } from 'express';
import { PrismaClient, CategoryType } from '@prisma/client';
import { authGuard } from '../auth/middleware';
import { asyncHandler, AppError } from '../../middleware/errorHandler';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// GET /api/categories - Get all categories
router.get(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.query;

    const categories = await prisma.category.findMany({
      where: type ? { type: type as CategoryType } : undefined,
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: { categories } });
  })
);

// GET /api/categories/:id - Get category by ID
router.get(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true, budgets: true },
        },
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }

    res.json({ success: true, data: { category } });
  })
);

const categoryBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['INCOME', 'EXPENSE']), // <-- Xóa 'TRANSFER'
});

// POST /api/categories - Create new category
router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, type } = categoryBodySchema.parse(req.body);

    const category = await prisma.category.create({
      data: { name, type },
    });

    res.status(201).json({ success: true, data: { category } });
  })
);

// PUT /api/categories/:id - Update category
router.put(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, type } = categoryBodySchema.partial().parse(req.body);

    try {
      const category = await prisma.category.update({
        where: { id },
        data: { name, type },
      });
      res.json({ success: true, data: { category } });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Category not found', 404, 'NOT_FOUND');
      }
      throw error;
    }
  })
);

// DELETE /api/categories/:id - Delete category
router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true, budgets: true },
        },
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }

    if (category._count.transactions > 0 || category._count.budgets > 0) {
      throw new AppError(
        'Cannot delete category with associated transactions or budgets',
        400,
        'DELETION_BLOCKED'
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: { message: 'Category deleted successfully' },
    });
  })
);

export default { router };
