import { z } from 'zod';

export const uploadSchema = z.object({
  file: z.any(),
});

export const columnMappingSchema = z.object({
  date: z.number().int().min(0),
  amount: z.number().int().min(0),
  type: z.number().int().min(0),
  note: z.number().int().min(0).optional(),
  category: z.number().int().min(0).optional(),
  account: z.number().int().min(0).optional(),
});

export const importOptionsSchema = z.object({
  dateFormat: z.enum(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']).optional().default('YYYY-MM-DD'),
  hasHeader: z.boolean().optional().default(true),
});

export const previewRequestSchema = z.object({
  cursorId: z.string().min(1),
  mapping: columnMappingSchema,
  options: importOptionsSchema.optional(),
});

export const commitRequestSchema = z.object({
  cursorId: z.string().min(1),
  mapping: columnMappingSchema,
  options: importOptionsSchema.optional(),
  commitAll: z.boolean().optional().default(true),
});

export type ColumnMapping = z.infer<typeof columnMappingSchema>;
export type ImportOptions = z.infer<typeof importOptionsSchema>;
export type PreviewRequest = z.infer<typeof previewRequestSchema>;
export type CommitRequest = z.infer<typeof commitRequestSchema>;
