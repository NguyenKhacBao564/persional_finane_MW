import { axiosClient } from './axiosClient';

export interface UploadResponse {
  hasHeader: boolean;
  headers: string[];
  sample: Array<Record<string, string>>;
  cursorId: string;
  totalRows: number;
  hasMore: boolean;
}

export interface ColumnMapping {
  date: number;
  amount: number;
  type: number;
  note?: number;
  category?: number;
  account?: number;
}

export interface ImportOptions {
  dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  hasHeader?: boolean;
}

export interface PreviewRow {
  txDate: string;
  type: string;
  amount: number;
  categoryId?: string | null;
  accountId?: string | null;
  note?: string | null;
  valid: boolean;
  errors: string[];
}

export interface PreviewResponse {
  rows: PreviewRow[];
  validCount: number;
  invalidCount: number;
  totalRows: number;
}

export interface CommitResponse {
  inserted: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

/**
 * Upload CSV file for import
 */
export async function uploadCsv(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axiosClient.post<{
      success: boolean;
      data?: UploadResponse;
      error?: { message?: string };
    }>('/imports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data?.success || !response.data.data) {
      throw new Error(response.data?.error?.message || 'Failed to upload CSV');
    }

    return response.data.data;
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error(error.message || 'Failed to upload CSV');
  }
}

/**
 * Preview import with column mapping
 */
export async function previewImport(
  cursorId: string,
  mapping: ColumnMapping,
  options?: ImportOptions
): Promise<PreviewResponse> {
  try {
    const response = await axiosClient.post<{
      success: boolean;
      data?: PreviewResponse;
      error?: { message?: string };
    }>('/imports/preview', {
      cursorId,
      mapping,
      options,
    });

    if (!response.data?.success || !response.data.data) {
      throw new Error(response.data?.error?.message || 'Failed to preview import');
    }

    return response.data.data;
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error(error.message || 'Failed to preview import');
  }
}

/**
 * Commit import to database
 */
export async function commitImport(
  cursorId: string,
  mapping: ColumnMapping,
  options?: ImportOptions,
  commitAll: boolean = true
): Promise<CommitResponse> {
  try {
    const response = await axiosClient.post<{
      success: boolean;
      data?: CommitResponse;
      error?: { message?: string };
    }>('/imports/commit', {
      cursorId,
      mapping,
      options,
      commitAll,
    });

    if (!response.data?.success || !response.data.data) {
      throw new Error(response.data?.error?.message || 'Failed to commit import');
    }

    return response.data.data;
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error(error.message || 'Failed to commit import');
  }
}
