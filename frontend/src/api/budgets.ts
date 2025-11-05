import { axiosClient } from './axiosClient';
import type { BudgetSummary, BudgetQueryParams } from '@/types/budgets';

/**
 * Fetch budget summary for a given period
 * 
 * @param params - Query parameters (period, start, end)
 * @returns Budget summary with totals and items
 * @throws Error if request fails or backend returns error
 */
export async function fetchBudgetSummary(
  params: BudgetQueryParams
): Promise<BudgetSummary> {
  try {
    const response = await axiosClient.get<{
      success: boolean;
      data: BudgetSummary;
    }>('/budgets/summary', { params });

    if (!response.data.success) {
      throw new Error('Failed to fetch budget summary');
    }

    return response.data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch budget summary');
    }
    throw new Error('Failed to fetch budget summary');
  }
}
