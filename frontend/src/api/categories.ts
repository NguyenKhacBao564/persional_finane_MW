import { axiosClient } from './axiosClient';

/**
 * Category type for dropdowns and forms
 */
export interface Category {
  id: string;
  name: string;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  color?: string;
}

const useLocal = import.meta.env.VITE_BUDGETS_LOCAL === 'true';

/**
 * Fetch all categories for dropdowns
 */
export async function fetchCategories(): Promise<Category[]> {
  if (useLocal) {
    // Mock categories for local development
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [
      { id: 'cat_food', name: 'Food & Dining', type: 'EXPENSE' },
      { id: 'cat_groceries', name: 'Groceries', type: 'EXPENSE' },
      { id: 'cat_transport', name: 'Transportation', type: 'EXPENSE' },
      { id: 'cat_utilities', name: 'Utilities', type: 'EXPENSE' },
      { id: 'cat_entertainment', name: 'Entertainment', type: 'EXPENSE' },
      { id: 'cat_shopping', name: 'Shopping', type: 'EXPENSE' },
      { id: 'cat_healthcare', name: 'Healthcare', type: 'EXPENSE' },
      { id: 'cat_fitness', name: 'Fitness', type: 'EXPENSE' },
    ];
  }

  const response = await axiosClient.get<{
    success: boolean;
    data?: { categories: Category[] };
    error?: { message?: string };
  }>('/categories');

  if (!response.data?.success || !response.data.data) {
    throw new Error(
      response.data?.error?.message || 'Failed to fetch categories'
    );
  }

  return response.data.data.categories;
}
