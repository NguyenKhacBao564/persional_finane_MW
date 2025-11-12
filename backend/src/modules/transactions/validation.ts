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
const noteField = z
  .string()
  .max(500, 'Note must be 500 characters or less')
  .optional()
  .nullable()
  .transform((val) => {
    if (val === undefined) {
      return undefined;
    }
    if (val === null) {
      return null;
    }
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

const baseCreateTransactionSchema = z.object({
  type: transactionTypeSchema,
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be greater than zero')
    .max(1e11, 'Amount is too large'),
  categoryId: z.string().min(1, 'Invalid category ID').optional(),
  accountId: z.string().min(1, 'Invalid account ID'),
  note: noteField,
  description: noteField.optional(),
  txDate: z // Renamed from occurredAt
    .string({ required_error: 'Date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD')
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  currency: z.string().min(3).max(3).default('USD'),
});

export const createTransactionSchema = baseCreateTransactionSchema.transform(
  ({ description, ...data }) => ({
    ...data,
    note: data.note ?? description ?? null,
  })
);

/**
 * Zod schema for updating a transaction
 */
const baseUpdateTransactionSchema = z.object({
  type: transactionTypeSchema.optional(),
  amount: z
    .number()
    .positive('Amount must be greater than zero')
    .max(1e11, 'Amount is too large')
    .optional(),
  categoryId: z
    .string()
    .min(1, 'Invalid category ID') // Relaxed validation
    .optional()
    .nullable()
    .transform((val) => val || null),
  accountId: z.string().min(1, 'Invalid account ID').optional(),
  note: noteField,
  description: noteField.optional(),
  txDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD')
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val))
    .optional(),
  currency: z.string().min(3).max(3).optional(),
});

export const updateTransactionSchema = baseUpdateTransactionSchema.transform(
  ({ description, ...data }) => ({
    ...data,
    note: data.note ?? description ?? undefined,
  })
);

/**
 * Zod schema for transaction filters/query params
 */
export const transactionFiltersSchema = z.object({
  q: z.string().optional(), // Search query for note
  type: transactionTypeSchema.optional(),
  categoryId: z.string().min(1).optional(), // Relaxed validation
  accountId: z.string().min(1).optional(), // Relaxed validation
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
