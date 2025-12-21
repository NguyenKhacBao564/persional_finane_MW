import { axiosClient } from './axiosClient';

/**
 * Category type for dropdowns and forms
 */
export interface Category {
  id: string;
  name: string;
  type?: 'INCOME' | 'EXPENSE';
  color?: string;
}

/**
 * Fetch all categories for dropdowns
 */
export async function fetchCategories(): Promise<Category[]> {
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

/**
 * Fetch categories filtered by type
 */
export async function fetchCategoriesByType(type: 'INCOME' | 'EXPENSE'): Promise<Category[]> {
  const response = await axiosClient.get<{
    success: boolean;
    data?: { categories: Category[] };
    error?: { message?: string };
  }>(`/categories?type=${type}`);

  if (!response.data?.success || !response.data.data) {
    throw new Error(
      response.data?.error?.message || 'Failed to fetch categories'
    );
  }

  return response.data.data.categories;
}
