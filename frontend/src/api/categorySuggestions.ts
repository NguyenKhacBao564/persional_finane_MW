import { axiosClient } from './axiosClient';
import type { CategorySuggestion } from '@/types/suggestions';
import { getLocalSuggestions } from '@/features/category-suggest/localProvider';

const USE_LOCAL = import.meta.env.VITE_SUGGESTIONS_LOCAL === 'true';

/**
 * Fetch category suggestions for a specific transaction.
 * @param txId - Transaction ID
 * @returns Array of category suggestions
 */
export async function fetchCategorySuggestionsByTxId(
  txId: string
): Promise<CategorySuggestion[]> {
  if (USE_LOCAL) {
    return [];
  }

  try {
    const response = await axiosClient.get(`/transactions/${txId}/suggest-category`);

    if (response.data?.success === false) {
      throw new Error(
        response.data?.error?.message || 'Failed to fetch suggestions'
      );
    }

    return response.data.data as CategorySuggestion[];
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error(error.message || 'Failed to fetch suggestions');
  }
}

/**
 * Fetch category suggestions based on transaction text data.
 * @param params - Text parameters for suggestion matching
 * @returns Array of category suggestions
 */
export async function fetchCategorySuggestionsByText(params: {
  note?: string;
  amount?: number;
  merchant?: string;
}): Promise<CategorySuggestion[]> {
  if (USE_LOCAL) {
    return getLocalSuggestions(params);
  }

  try {
    const response = await axiosClient.get('/categories/suggest', { params });

    if (response.data?.success === false) {
      throw new Error(
        response.data?.error?.message || 'Failed to fetch suggestions'
      );
    }

    return response.data.data as CategorySuggestion[];
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error(error.message || 'Failed to fetch suggestions');
  }
}

/**
 * Apply a category to a transaction.
 * @param txId - Transaction ID
 * @param categoryId - Category to apply
 * @returns Updated transaction reference
 */
export async function applyCategory(
  txId: string,
  categoryId: string
): Promise<{ txId: string; categoryId: string }> {
  if (USE_LOCAL) {
    return { txId, categoryId };
  }

  try {
    const response = await axiosClient.post(`/transactions/${txId}/category`, {
      categoryId,
    });

    if (response.data?.success === false) {
      throw new Error(
        response.data?.error?.message || 'Failed to apply category'
      );
    }

    return response.data.data as { txId: string; categoryId: string };
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error(error.message || 'Failed to apply category');
  }
}

/**
 * Apply categories to multiple transactions in bulk.
 * @param items - Array of transaction-category pairs
 * @returns Number of transactions updated
 */
export async function applyCategoryBulk(
  items: Array<{ txId: string; categoryId: string }>
): Promise<{ updated: number }> {
  if (USE_LOCAL) {
    return { updated: items.length };
  }

  try {
    const response = await axiosClient.post('/transactions/category/bulk', {
      items,
    });

    if (response.data?.success === false) {
      throw new Error(
        response.data?.error?.message || 'Failed to apply categories'
      );
    }

    return response.data.data as { updated: number };
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error(error.message || 'Failed to apply categories');
  }
}
