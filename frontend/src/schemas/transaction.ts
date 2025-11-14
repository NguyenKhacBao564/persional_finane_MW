import { z } from 'zod';

/**
 * Zod schema for transaction creation.
 * Validates all required fields with strict rules.
 */
export const transactionCreateSchema = z.object({
  txDate: z
    .string()
    .min(1, 'Date is required')
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'Invalid date format' }
    )
    .transform((val) => {
      // Convert YYYY-MM-DD to ISO datetime string
      const date = new Date(val + 'T00:00:00.000Z');
      return date.toISOString();
    }),

  type: z.enum(['IN', 'OUT'], {
    required_error: 'Transaction type is required',
    invalid_type_error: 'Type must be IN or OUT',
  }),

  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be greater than zero')
    .max(1e11, 'Amount is too large')
    .refine((val) => val > 0, { message: 'Amount must be greater than zero' }),

  categoryId: z.string().min(1, 'Category is required'),

  accountId: z.string().min(1, 'Account is required'),

  note: z
    .string()
    .trim()
    .max(300, 'Note must be 300 characters or less')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
});

/**
 * Zod schema for transaction updates.
 * Similar to create schema but with optional fields except ID.
 */
export const transactionUpdateSchema = z.object({
  id: z.string().min(1, 'Transaction ID is required'),
  txDate: z
    .string()
    .min(1, 'Date is required')
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'Invalid date format' }
    )
    .transform((val) => {
      const date = new Date(val);
      return date.toISOString().split('T')[0];
    })
    .optional(),

  type: z.enum(['IN', 'OUT']).optional(),

  amount: z
    .number()
    .positive('Amount must be greater than zero')
    .max(1e11, 'Amount is too large')
    .optional(),

  categoryId: z.string().min(1, 'Category is required').optional(),

  accountId: z.string().min(1, 'Account is required').optional(),

  note: z
    .string()
    .trim()
    .max(300, 'Note must be 300 characters or less')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
});

/**
 * TypeScript type for transaction creation input.
 */
export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;

/**
 * TypeScript type for transaction update input.
 */
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
