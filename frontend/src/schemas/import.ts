import { z } from 'zod';

/**
 * Schema for CSV upload step.
 * Validates file type, size, and parsing options.
 */
export const uploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, { message: 'File cannot be empty' })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'File size must be less than 5MB',
    })
    .refine(
      (file) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ext === 'csv';
      },
      { message: 'Only .csv files are allowed' }
    ),

  delimiter: z.enum([',', ';', '\t']).default(','),

  encoding: z.string().default('utf-8'),
});

/**
 * Schema for column mapping.
 * Defines how CSV columns map to app fields.
 */
export const mappingSchema = z.object({
  mapping: z.object({
    txDate: z.object({
      columnIndex: z.number().int().min(0),
    }),
    amount: z.object({
      columnIndex: z.number().int().min(0),
    }),
    type: z.object({
      columnIndex: z.number().int().min(0),
    }),
    note: z
      .object({
        columnIndex: z.number().int().min(0),
      })
      .optional(),
    categoryName: z
      .object({
        columnIndex: z.number().int().min(0),
      })
      .optional(),
    accountName: z
      .object({
        columnIndex: z.number().int().min(0),
      })
      .optional(),
  }),
});

/**
 * Parse and validate date string, converting to YYYY-MM-DD format.
 */
const parseDateString = (dateStr: string): string => {
  // Try YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return dateStr;
  }

  // Try DD/MM/YYYY format
  const ddmmyyyy = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    if (!isNaN(date.getTime())) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  // Try MM/DD/YYYY format
  const mmddyyyy = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    if (!isNaN(date.getTime())) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  throw new Error('Invalid date format');
};

/**
 * Normalize type string to IN or OUT.
 */
const normalizeType = (typeStr: string): 'IN' | 'OUT' => {
  const normalized = typeStr.toLowerCase().trim();
  if (['income', 'in', 'credit'].includes(normalized)) return 'IN';
  if (['expense', 'out', 'debit'].includes(normalized)) return 'OUT';
  throw new Error('Invalid type value');
};

/**
 * Schema for a single parsed row.
 * Validates and coerces CSV data to app format.
 */
export const parsedRowSchema = z.object({
  txDate: z
    .string()
    .min(1, 'Date is required')
    .transform((val, ctx) => {
      try {
        return parseDateString(val);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid date format',
        });
        return z.NEVER;
      }
    }),

  amount: z
    .string()
    .or(z.number())
    .transform((val) => {
      if (typeof val === 'number') return val;
      // Remove thousands separators and normalize decimal
      const cleaned = val.replace(/[\s,]/g, '').replace(',', '.');
      return parseFloat(cleaned);
    })
    .pipe(z.number().positive('Amount must be positive')),

  type: z
    .string()
    .min(1, 'Type is required')
    .transform((val, ctx) => {
      try {
        return normalizeType(val);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Type must be IN/OUT, income/expense, or credit/debit',
        });
        return z.NEVER;
      }
    }),

  note: z
    .string()
    .trim()
    .max(300, 'Note must be 300 characters or less')
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null ? undefined : val)),

  categoryName: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null ? undefined : val)),

  accountName: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null ? undefined : val)),
});

/**
 * TypeScript types inferred from schemas.
 */
export type UploadInput = z.infer<typeof uploadSchema>;
export type MappingInput = z.infer<typeof mappingSchema>;
export type ImportRow = z.infer<typeof parsedRowSchema>;
export type ColumnMapping = MappingInput['mapping'];
