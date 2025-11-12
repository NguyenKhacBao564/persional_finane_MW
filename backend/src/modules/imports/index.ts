import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authGuard } from '../auth/middleware';
import { asyncHandler, AppError } from '../../middleware/errorHandler';
import multer from 'multer';
import Papa from 'papaparse';
import logger from '../../lib/logger';
import { parseAmountNumber, parseDateString } from '../../lib/parseAmountNumber';
import {
  previewRequestSchema,
  commitRequestSchema,
  type ColumnMapping,
  type ImportOptions,
} from './validation';

const router = Router();
const prisma = new PrismaClient();
const DEFAULT_ACCOUNT_ID = 'acc_cash';
const MAX_PREVIEW_ROWS = 2000;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

interface CachedCsvData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  userId: string;
  timestamp: number;
}

const rowCache = new Map<string, CachedCsvData>();

/**
 * POST /api/imports/upload - Upload CSV file
 */
router.post(
  '/upload',
  authGuard,
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400, 'NO_FILE');
    }

    if (req.file.size > 5 * 1024 * 1024) {
      throw new AppError('File size exceeds 5MB limit', 413, 'FILE_TOO_LARGE');
    }

    const userId = req.user!.id;
    const csvContent = req.file.buffer.toString('utf-8');

    const parsed = Papa.parse(csvContent, {
      header: false,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      throw new AppError(
        `CSV parsing failed: ${parsed.errors[0].message}`,
        400,
        'CSV_PARSE_ERROR'
      );
    }

    const allRows = parsed.data as string[][];

    if (allRows.length < 2) {
      throw new AppError(
        'CSV file must have at least 2 rows (header + data)',
        400,
        'INSUFFICIENT_DATA'
      );
    }

    // Assume first row is headers
    const headers = allRows[0].map((h) => String(h).trim());
    const dataRows = allRows.slice(1);

    // Limit cached rows
    const rowsToCache = dataRows.slice(0, MAX_PREVIEW_ROWS);
    const hasMore = dataRows.length > MAX_PREVIEW_ROWS;

    // Generate cursor ID
    const cursorId = `import_${userId}_${Date.now()}`;

    // Cache the data
    rowCache.set(cursorId, {
      headers,
      rows: rowsToCache,
      totalRows: dataRows.length,
      userId,
      timestamp: Date.now(),
    });

    // Clean up old cache entries
    cleanupCache();

    // Prepare sample rows (first 20)
    const sampleSize = Math.min(20, rowsToCache.length);
    const sample = rowsToCache.slice(0, sampleSize).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] || '';
      });
      return obj;
    });

    res.json({
      success: true,
      data: {
        hasHeader: true,
        headers,
        sample,
        cursorId,
        totalRows: dataRows.length,
        hasMore,
      },
    });
  })
);

/**
 * POST /api/imports/preview - Preview mapped data
 */
router.post(
  '/preview',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { cursorId, mapping, options } = previewRequestSchema.parse(req.body);

    const cached = rowCache.get(cursorId);

    if (!cached) {
      throw new AppError('Import session not found or expired', 404, 'CURSOR_NOT_FOUND');
    }

    if (cached.userId !== userId) {
      throw new AppError('Unauthorized access to import session', 403, 'FORBIDDEN');
    }

    const previewSize = Math.min(200, cached.rows.length);
    const previewRows = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < previewSize; i++) {
      const row = cached.rows[i];
      const result = await validateAndMapRow(
        row,
        mapping,
        options || { dateFormat: 'YYYY-MM-DD', hasHeader: true },
        userId,
        false // don't validate foreign keys for preview
      );

      if (result.valid) {
        validCount++;
      } else {
        invalidCount++;
      }

      previewRows.push({
        ...result.data,
        valid: result.valid,
        errors: result.errors,
      });
    }

    res.json({
      success: true,
      data: {
        rows: previewRows,
        validCount,
        invalidCount,
        totalRows: cached.totalRows,
      },
    });
  })
);

/**
 * POST /api/imports/commit - Commit imported data to database
 */
router.post(
  '/commit',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { cursorId, mapping, options, commitAll } = commitRequestSchema.parse(req.body);

    const cached = rowCache.get(cursorId);

    if (!cached) {
      throw new AppError('Import session not found or expired', 404, 'CURSOR_NOT_FOUND');
    }

    if (cached.userId !== userId) {
      throw new AppError('Unauthorized access to import session', 403, 'FORBIDDEN');
    }

    let inserted = 0;
    let skipped = 0;
    const errors: Array<{ row: number; message: string }> = [];

    const importOptions = options || { dateFormat: 'YYYY-MM-DD', hasHeader: true };

    // Process in batches of 500
    const BATCH_SIZE = 500;
    const totalBatches = Math.ceil(cached.rows.length / BATCH_SIZE);

    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      const batchStart = batchIdx * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, cached.rows.length);
      const batchRows = cached.rows.slice(batchStart, batchEnd);

      const transactionsToCreate: Array<{
        userId: string;
        accountId: string;
        type: 'IN' | 'OUT';
        amount: number;
        occurredAt: Date;
        categoryId: string | null;
        note: string | null;
        currency: string;
      }> = [];

      for (let i = 0; i < batchRows.length; i++) {
        const rowIndex = batchStart + i;
        const row = batchRows[i];

        try {
          const result = await validateAndMapRow(row, mapping, importOptions, userId, true);

          if (!result.valid) {
            if (commitAll) {
              skipped++;
              errors.push({
                row: rowIndex + 2, // +2 for header and 0-indexing
                message: result.errors.join(', '),
              });
            }
            continue;
          }

          transactionsToCreate.push({
            userId,
            accountId: result.data.accountId || DEFAULT_ACCOUNT_ID,
            type: result.data.type as 'IN' | 'OUT',
            amount: result.data.amount,
            occurredAt: new Date(result.data.txDate),
            categoryId: result.data.categoryId || null,
            note: result.data.note || null,
            currency: 'VND',
          });
        } catch (error) {
          skipped++;
          errors.push({
            row: rowIndex + 2,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Batch insert
      if (transactionsToCreate.length > 0) {
        try {
          await prisma.$transaction(async (tx) => {
            for (const txData of transactionsToCreate) {
              await tx.transaction.create({ data: txData });
            }
          });
          inserted += transactionsToCreate.length;
        } catch (error) {
          logger.error({ error, batch: batchIdx }, 'Batch insert failed');
          skipped += transactionsToCreate.length;
          errors.push({
            row: batchStart + 2,
            message: `Batch insert failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }
    }

    // Clean up cache
    rowCache.delete(cursorId);

    res.json({
      success: true,
      data: {
        inserted,
        skipped,
        errors: errors.slice(0, 100), // Limit error details
      },
    });
  })
);

/**
 * Validate and map a single row
 */
async function validateAndMapRow(
  row: string[],
  mapping: ColumnMapping,
  options: ImportOptions,
  userId: string,
  validateForeignKeys: boolean
): Promise<{
  valid: boolean;
  data: {
    txDate: string;
    type: string;
    amount: number;
    categoryId?: string | null;
    accountId?: string | null;
    note?: string | null;
  };
  errors: string[];
}> {
  const errors: string[] = [];
  const data: any = {};

  // Parse date
  try {
    const dateStr = row[mapping.date];
    data.txDate = parseDateString(dateStr, options.dateFormat);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Invalid date');
  }

  // Parse amount
  try {
    const amountStr = row[mapping.amount];
    data.amount = parseAmountNumber(amountStr);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Invalid amount');
  }

  // Parse type
  const typeStr = row[mapping.type] || 'OUT';
  const normalized = typeStr.toLowerCase().trim();
  if (['income', 'in', 'credit', '+'].includes(normalized)) {
    data.type = 'IN';
  } else if (['expense', 'out', 'debit', '-'].includes(normalized)) {
    data.type = 'OUT';
  } else {
    data.type = 'OUT'; // Default
  }

  // Parse category (optional)
  if (mapping.category !== undefined) {
    const categoryName = row[mapping.category]?.trim();
    if (categoryName) {
      if (validateForeignKeys) {
        const category = await prisma.category.findFirst({
          where: {
            name: { equals: categoryName, mode: 'insensitive' },
          },
        });
        data.categoryId = category?.id || null;
      } else {
        data.categoryId = categoryName; // Store name for preview
      }
    }
  }

  // Parse account (optional)
  if (mapping.account !== undefined) {
    const accountName = row[mapping.account]?.trim();
    if (accountName) {
      if (validateForeignKeys) {
        const account = await prisma.account.findFirst({
          where: {
            name: { equals: accountName, mode: 'insensitive' },
          },
        });
        data.accountId = account?.id || null;
      } else {
        data.accountId = accountName; // Store name for preview
      }
    }
  }

  // Parse note (optional)
  if (mapping.note !== undefined) {
    const note = row[mapping.note]?.trim();
    data.note = note || null;
  }

  return {
    valid: errors.length === 0,
    data,
    errors,
  };
}

/**
 * Auto-detect column mapping from headers
 */
function detectColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<Record<keyof ColumnMapping, number>> = {};

  const patterns: Record<keyof ColumnMapping, RegExp> = {
    date: /date|time|when|occurred|txdate/i,
    amount: /amount|value|sum|total|price/i,
    type: /type|kind|direction|category/i,
    note: /note|description|memo|detail|comment/i,
    category: /category|cat|class/i,
    account: /account|acc|bank|wallet/i,
  };

  headers.forEach((header, index) => {
    const normalized = header.toLowerCase().trim();
    for (const [field, pattern] of Object.entries(patterns)) {
      if (pattern.test(normalized) && mapping[field as keyof ColumnMapping] === undefined) {
        mapping[field as keyof ColumnMapping] = index;
      }
    }
  });

  return mapping;
}

/**
 * Clean up expired cache entries
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of rowCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      rowCache.delete(key);
    }
  }
}

export default { router };
