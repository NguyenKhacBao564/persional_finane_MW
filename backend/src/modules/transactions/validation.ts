import { z } from 'zod';

/**
 * Transaction type enum schema
 */
export const transactionTypeSchema = z.enum(['IN', 'OUT'], {
  required_error: 'Transaction type is required',
  invalid_type_error: 'Type must be IN or OUT',
});

/**
 * Zod schema for creating a transaction
 */
export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be greater than zero')
    .max(1e11, 'Amount is too large'),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  accountId: z.string().uuid('Invalid account ID').optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .nullable()
    .transform((val) => val || null),
  occurredAt: z
    .string()
    .datetime({ message: 'Invalid date format, expected ISO 8601' })
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  currency: z.string().min(3).max(3).default('USD'),
});

/**
 * Zod schema for updating a transaction
 */
export const updateTransactionSchema = z.object({
  type: transactionTypeSchema.optional(),
  amount: z
    .number()
    .positive('Amount must be greater than zero')
    .max(1e11, 'Amount is too large')
    .optional(),
  categoryId: z
    .string()
    .uuid('Invalid category ID')
    .optional()
    .nullable()
    .transform((val) => val || null),
  accountId: z.string().uuid('Invalid account ID').optional().nullable(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .nullable()
    .transform((val) => val || null),
  occurredAt: z
    .string()
    .datetime({ message: 'Invalid date format, expected ISO 8601' })
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val))
    .optional(),
  currency: z.string().min(3).max(3).optional(),
});

/**
 * Zod schema for transaction filters/query params
 */
export const transactionFiltersSchema = z.object({
  q: z.string().optional(), // Search query for description
  type: transactionTypeSchema.optional(),
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sort: z.string().default('occurredAt:desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

/**
 * TypeScript types derived from schemas
 */
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
