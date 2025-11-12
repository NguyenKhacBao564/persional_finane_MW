import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authGuard } from '../auth/middleware';
import { asyncHandler, AppError } from '../../middleware/errorHandler';
import multer from 'multer';
import Papa from 'papaparse';
import logger from '../../lib/logger';

const router = Router();
const prisma = new PrismaClient();
const DEFAULT_ACCOUNT_ID = 'acc_cash';

// Configure multer with size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * Temporary storage for preview data (in production, use Redis/cache)
 */
const previewCache = new Map<string, ParsedCsvData>();

interface ParsedCsvData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  userId: string;
  timestamp: number;
}

interface PreviewRow {
  rowIndex: number;
  data: Record<string, string>;
  issues: string[];
}

/**
 * POST /api/imports/preview - Upload CSV and preview with column detection
 * Returns: { headers, sampleRows, suggestedMapping, totalRows }
 */
router.post(
  '/preview',
  authGuard,
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400, 'NO_FILE');
    }

    const userId = req.user!.id;
    const csvContent = req.file.buffer.toString('utf-8');

    // Parse CSV
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
      throw new AppError('CSV file must have at least 2 rows (header + data)', 400, 'INSUFFICIENT_DATA');
    }

    // Assume first row is header
    const headers = allRows[0].map((h) => h.trim());
    const dataRows = allRows.slice(1);

    // Store in cache with unique ID
    const previewId = `${userId}-${Date.now()}`;
    previewCache.set(previewId, {
      headers,
      rows: dataRows,
      totalRows: dataRows.length,
      userId,
      timestamp: Date.now(),
    });

    // Auto-detect column mapping
    const suggestedMapping = detectColumnMapping(headers);

    // Validate sample rows
    const sampleSize = Math.min(20, dataRows.length);
    const sampleRows: PreviewRow[] = [];

    for (let i = 0; i < sampleSize; i++) {
      const row = dataRows[i];
      const rowData: Record<string, string> = {};
      const issues: string[] = [];

      headers.forEach((header, idx) => {
        rowData[header] = row[idx] || '';
      });

      // Validate based on suggested mapping
      if (suggestedMapping.amount !== undefined) {
        const amountStr = row[suggestedMapping.amount];
        const amount = parseFloat(amountStr?.replace(/,/g, '') || '0');
        if (isNaN(amount) || amount <= 0) {
          issues.push('Invalid amount');
        }
      }

      if (suggestedMapping.date !== undefined) {
        const dateStr = row[suggestedMapping.date];
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          issues.push('Invalid date');
        }
      }

      sampleRows.push({
        rowIndex: i,
        data: rowData,
        issues,
      });
    }

    // Clean up old previews (older than 10 minutes)
    const now = Date.now();
    for (const [key, value] of previewCache.entries()) {
      if (now - value.timestamp > 10 * 60 * 1000) {
        previewCache.delete(key);
      }
    }

    res.json({
      success: true,
      data: {
        previewId,
        headers,
        sampleRows,
        suggestedMapping,
        totalRows: dataRows.length,
        validRows: sampleRows.filter((r) => r.issues.length === 0).length,
        invalidRows: sampleRows.filter((r) => r.issues.length > 0).length,
      },
    });
  })
);

/**
 * POST /api/imports/commit - Commit the imported data
 * Body: { previewId, mapping: { date, amount, type, category, description, currency } }
 */
router.post(
  '/commit',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const schema = z.object({
      previewId: z.string(),
      mapping: z.object({
        date: z.number().int().min(0),
        amount: z.number().int().min(0),
        type: z.number().int().min(0).optional(),
        category: z.number().int().min(0).optional(),
        description: z.number().int().min(0).optional(),
        currency: z.number().int().min(0).optional(),
      }),
    });

    const { previewId, mapping } = schema.parse(req.body);

    // Retrieve preview data
    const previewData = previewCache.get(previewId);

    if (!previewData) {
      throw new AppError('Preview not found or expired', 404, 'PREVIEW_NOT_FOUND');
    }

    if (previewData.userId !== userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; error: string }[],
    };

    // Process each row
    for (let i = 0; i < previewData.rows.length; i++) {
      const row = previewData.rows[i];

      try {
        // Extract values based on mapping
        const dateStr = row[mapping.date];
        const amountStr = row[mapping.amount];
        const typeStr = mapping.type !== undefined ? row[mapping.type] : 'OUT';
        const categoryStr = mapping.category !== undefined ? row[mapping.category] : null;
        const descriptionStr = mapping.description !== undefined ? row[mapping.description] : null;
        const currencyStr = mapping.currency !== undefined ? row[mapping.currency] : 'USD';

        // Validate and parse date
        const occurredAt = new Date(dateStr);
        if (isNaN(occurredAt.getTime())) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            error: 'Invalid date format',
          });
          continue;
        }

        // Parse amount (handle thousands separators)
        const amount = parseFloat(amountStr.replace(/,/g, ''));
        if (isNaN(amount) || amount <= 0) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            error: 'Invalid amount',
          });
          continue;
        }

        // Determine transaction type
        const type = typeStr.toUpperCase() === 'IN' ? 'IN' : 'OUT';

        // Find category if provided
        let categoryId: string | null = null;
        if (categoryStr) {
          const category = await prisma.category.findFirst({
            where: {
              name: {
                equals: categoryStr.trim(),
                mode: 'insensitive',
              },
            },
          });
          categoryId = category?.id || null;
        }

        // Create transaction
        await prisma.transaction.create({
          data: {
            userId,
            type,
            amount,
            categoryId,
            note: descriptionStr || null,
            occurredAt,
            currency: currencyStr,
            accountId: DEFAULT_ACCOUNT_ID,
          },
        });

        results.success++;
      } catch (error) {
        logger.error({ error, row: i + 2 }, 'CSV row import error');
        results.failed++;
        results.errors.push({
          row: i + 2,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Clean up preview data
    previewCache.delete(previewId);

    res.json({
      success: true,
      data: {
        message: 'Import completed',
        results,
      },
    });
  })
);

/**
 * Auto-detect column mapping based on header names
 */
function detectColumnMapping(headers: string[]): {
  date?: number;
  amount?: number;
  type?: number;
  category?: number;
  description?: number;
  currency?: number;
} {
  const mapping: Record<string, number> = {};

  const patterns = {
    date: /date|time|when|occurred/i,
    amount: /amount|value|sum|total|price/i,
    type: /type|kind|direction|in\/out/i,
    category: /category|cat|type|group/i,
    description: /description|note|memo|detail|comment/i,
    currency: /currency|curr/i,
  };

  headers.forEach((header, index) => {
    const normalized = header.toLowerCase().trim();

    for (const [field, pattern] of Object.entries(patterns)) {
      if (pattern.test(normalized) && mapping[field] === undefined) {
        mapping[field] = index;
      }
    }
  });

  return mapping;
}

export default { router };
