import { z } from 'zod';

/**
 * Helper to validate YYYY-MM-DD date format
 */
export const yyyyMmDd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');

/**
 * Budget creation schema
 */
export const budgetCreateSchema = z
  .object({
    categoryId: z.string().min(1, 'Category is required'),
    period: z.enum(['MONTHLY', 'WEEKLY', 'ANNUAL'], {
      required_error: 'Period is required',
    }),
    allocated: z
      .number({ invalid_type_error: 'Amount is required' })
      .positive('Amount must be greater than 0')
      .max(1e12, 'Amount is too large'),
    start: yyyyMmDd,
    end: yyyyMmDd,
    notes: z
      .string()
      .max(300, 'Notes must be 300 characters or less')
      .optional()
      .nullable()
      .transform((val) => val || null),
  })
  .refine((data) => data.start <= data.end, {
    message: 'Start date must be before or equal to end date',
    path: ['end'],
  });

/**
 * Budget update schema (includes budgetId)
 */
export const budgetUpdateSchema = z
  .object({
    budgetId: z.string().min(1, 'Budget ID is required'),
    categoryId: z.string().min(1, 'Category is required'),
    period: z.enum(['MONTHLY', 'WEEKLY', 'ANNUAL'], {
      required_error: 'Period is required',
    }),
    allocated: z
      .number({ invalid_type_error: 'Amount is required' })
      .positive('Amount must be greater than 0')
      .max(1e12, 'Amount is too large'),
    start: yyyyMmDd,
    end: yyyyMmDd,
    notes: z
      .string()
      .max(300, 'Notes must be 300 characters or less')
      .optional()
      .nullable()
      .transform((val) => val || null),
  })
  .refine((data) => data.start <= data.end, {
    message: 'Start date must be before or equal to end date',
    path: ['end'],
  });

/**
 * Saving goal creation schema
 */
export const goalCreateSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name must be 60 characters or less'),
    targetAmount: z
      .number({ invalid_type_error: 'Target amount is required' })
      .positive('Target amount must be greater than 0')
      .max(1e12, 'Amount is too large'),
    targetDate: yyyyMmDd,
    notes: z
      .string()
      .max(300, 'Notes must be 300 characters or less')
      .optional()
      .nullable()
      .transform((val) => val || null),
  })
  .refine(
    (data) => {
      const targetDate = new Date(data.targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return targetDate > today;
    },
    {
      message: 'Target date must be in the future',
      path: ['targetDate'],
    }
  );

/**
 * Saving goal update schema (includes goalId)
 */
export const goalUpdateSchema = z
  .object({
    goalId: z.string().min(1, 'Goal ID is required'),
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name must be 60 characters or less'),
    targetAmount: z
      .number({ invalid_type_error: 'Target amount is required' })
      .positive('Target amount must be greater than 0')
      .max(1e12, 'Amount is too large'),
    targetDate: yyyyMmDd,
    notes: z
      .string()
      .max(300, 'Notes must be 300 characters or less')
      .optional()
      .nullable()
      .transform((val) => val || null),
  })
  .refine(
    (data) => {
      const targetDate = new Date(data.targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return targetDate > today;
    },
    {
      message: 'Target date must be in the future',
      path: ['targetDate'],
    }
  );

/**
 * TypeScript types derived from schemas
 */
export type BudgetCreateSchema = z.infer<typeof budgetCreateSchema>;
export type BudgetUpdateSchema = z.infer<typeof budgetUpdateSchema>;
export type GoalCreateSchema = z.infer<typeof goalCreateSchema>;
export type GoalUpdateSchema = z.infer<typeof goalUpdateSchema>;
