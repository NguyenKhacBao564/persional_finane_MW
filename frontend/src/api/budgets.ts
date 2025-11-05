import { axiosClient } from './axiosClient';
import type {
  BudgetSummary,
  BudgetQueryParams,
  BudgetCreateInput,
  BudgetUpdateInput,
  SavingGoal,
  GoalCreateInput,
  GoalUpdateInput,
} from '@/types/budgets';

const useLocal = import.meta.env.VITE_BUDGETS_LOCAL === 'true';

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
  if (useLocal) {
    // Lightweight mock for dev only
    await new Promise((resolve) => setTimeout(resolve, 300));
    const items = [
      {
        budgetId: 'b1',
        categoryId: 'cat_food',
        categoryName: 'Food & Dining',
        period: 'MONTHLY' as const,
        allocated: 3000000,
        spent: 1250000,
        start: params.start,
        end: params.end,
      },
    ];
    const totals = { allocated: 3000000, spent: 1250000, remaining: 1750000 };
    return { items, totals };
  }

  const response = await axiosClient.get<{
    success: boolean;
    data?: BudgetSummary;
    error?: { message?: string };
  }>('/budgets/summary', { params });

  if (!response.data?.success || !response.data.data) {
    throw new Error(response.data?.error?.message || 'Failed to fetch budget summary');
  }

  return response.data.data;
}

/**
 * Create a new budget
 */
export async function createBudget(
  input: BudgetCreateInput
): Promise<{ budgetId: string }> {
  if (useLocal) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { budgetId: crypto.randomUUID() };
  }

  const response = await axiosClient.post<{
    success: boolean;
    data?: { budgetId: string };
    error?: { message?: string };
  }>('/budgets', input);

  if (!response.data?.success || !response.data.data) {
    throw new Error(response.data?.error?.message || 'Create budget failed');
  }

  return response.data.data;
}

/**
 * Update an existing budget
 */
export async function updateBudget(input: BudgetUpdateInput): Promise<void> {
  if (useLocal) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return;
  }

  const { budgetId, ...updateData } = input;
  const response = await axiosClient.put<{
    success: boolean;
    error?: { message?: string };
  }>(`/budgets/${budgetId}`, updateData);

  if (!response.data?.success) {
    throw new Error(response.data?.error?.message || 'Update budget failed');
  }
}

/**
 * Delete a budget
 */
export async function deleteBudget(budgetId: string): Promise<void> {
  if (useLocal) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return;
  }

  const response = await axiosClient.delete<{
    success: boolean;
    error?: { message?: string };
  }>(`/budgets/${budgetId}`);

  if (!response.data?.success) {
    throw new Error(response.data?.error?.message || 'Delete budget failed');
  }
}

/**
 * Fetch all saving goals
 */
export async function fetchGoals(): Promise<SavingGoal[]> {
  if (useLocal) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [];
  }

  const response = await axiosClient.get<{
    success: boolean;
    data?: { items: SavingGoal[] };
    error?: { message?: string };
  }>('/goals');

  if (!response.data?.success || !response.data.data) {
    throw new Error(response.data?.error?.message || 'Failed to fetch goals');
  }

  return response.data.data.items;
}

/**
 * Create a new saving goal
 */
export async function createGoal(
  input: GoalCreateInput
): Promise<{ goalId: string }> {
  if (useLocal) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { goalId: crypto.randomUUID() };
  }

  const response = await axiosClient.post<{
    success: boolean;
    data?: { goalId: string };
    error?: { message?: string };
  }>('/goals', input);

  if (!response.data?.success || !response.data.data) {
    throw new Error(response.data?.error?.message || 'Create goal failed');
  }

  return response.data.data;
}

/**
 * Update an existing saving goal
 */
export async function updateGoal(input: GoalUpdateInput): Promise<void> {
  if (useLocal) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return;
  }

  const { goalId, ...updateData } = input;
  const response = await axiosClient.put<{
    success: boolean;
    error?: { message?: string };
  }>(`/goals/${goalId}`, updateData);

  if (!response.data?.success) {
    throw new Error(response.data?.error?.message || 'Update goal failed');
  }
}

/**
 * Delete a saving goal
 */
export async function deleteGoal(goalId: string): Promise<void> {
  if (useLocal) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return;
  }

  const response = await axiosClient.delete<{
    success: boolean;
    error?: { message?: string };
  }>(`/goals/${goalId}`);

  if (!response.data?.success) {
    throw new Error(response.data?.error?.message || 'Delete goal failed');
  }
}
