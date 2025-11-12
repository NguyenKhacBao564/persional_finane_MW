import { z } from 'zod';

export const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const budgetFormSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  month: z.string().regex(monthRegex, 'Month must be YYYY-MM format'),
  limit: z.union([z.number(), z.string()])
    .transform((val) => {
      const num = typeof val === 'string' ? Number(val.replace(/[,\s]/g, '')) : val;
      if (isNaN(num) || num <= 0) {
        throw new Error('Limit must be a positive number');
      }
      return num;
    }),
}).transform((v) => ({
  ...v,
  limit: Number(v.limit),
}));

export type BudgetFormInput = z.input<typeof budgetFormSchema>;
export type BudgetFormOutput = z.output<typeof budgetFormSchema>;

// Legacy exports for compatibility
export const budgetCreateSchema = budgetFormSchema;
export const budgetUpdateSchema = z.object({
  limit: z.number().positive().optional(),
});
export type BudgetCreateSchema = BudgetFormOutput;
export type BudgetUpdateSchema = z.infer<typeof budgetUpdateSchema>;

// Goal schemas (placeholder - should be in separate file)
export const goalCreateSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  targetDate: z.string(),
  notes: z.string().optional().nullable(),
});

export const goalUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  targetAmount: z.number().positive().optional(),
  targetDate: z.string().optional(),
  notes: z.string().optional().nullable(),
});
export type GoalCreateSchema = z.infer<typeof goalCreateSchema>;
export type GoalUpdateSchema = z.infer<typeof goalUpdateSchema>;
