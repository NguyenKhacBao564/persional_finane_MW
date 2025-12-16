import { z } from 'zod';

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const budgetCreateSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  month: z.string()
    .regex(monthRegex, 'Month must be in YYYY-MM format')
    .transform((val) => {
      // If date string like "YYYY-MM-DD", extract month
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return val.slice(0, 7);
      }
      return val;
    }),
  limit: z.union([z.number(), z.string()])
    .transform((val) => {
      const num = typeof val === 'string' 
        ? Number(val.replace(/[,\s]/g, ''))
        : val;
      if (isNaN(num) || num <= 0) {
        throw new Error('Limit must be a positive number');
      }
      return num;
    }),
});

export const listQuerySchema = z.object({
  month: z.string().regex(monthRegex, 'Month must be in YYYY-MM format').optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const summaryQuerySchema = z.object({
  // Cho phép cả periodMonth HOẶC month, ưu tiên cái nào có giá trị
  periodMonth: z.string().optional(),
  month: z.string().regex(monthRegex, 'Month must be in YYYY-MM format').optional(),
}).refine((data) => data.periodMonth || data.month, {
  message: "Month is required",
  path: ["month"]
}).transform((val) => ({
  // Chuẩn hóa về 1 field duy nhất là 'month' để logic bên trong sử dụng
  month: val.periodMonth || val.month!, 
}));

export const updateBudgetSchema = z.object({
  limit: z.number().positive('Limit must be a positive number'),
});

export type BudgetCreateInput = z.infer<typeof budgetCreateSchema>;
export type ListQueryInput = z.infer<typeof listQuerySchema>;
export type SummaryQueryInput = z.infer<typeof summaryQuerySchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

// Alias for backward compatibility
export const upsertBudgetSchema = budgetCreateSchema;
export type UpsertBudgetInput = BudgetCreateInput;
