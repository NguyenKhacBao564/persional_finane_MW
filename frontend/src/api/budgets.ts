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

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor?: string | null;
  month: string;
  limit: number;
  createdAt: string;
}

export interface BudgetListResponse {
  items: Budget[];
  total: number;
  page: number;
  limit: number;
}

export interface BudgetListParams {
  month?: string;
  page?: number;
  limit?: number;
}

export interface UpsertBudgetInput {
  categoryId: string;
  month: string;
  limit: number;
}

export interface UpdateBudgetLimitInput {
  limit: number;
}

export interface BudgetSummaryItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor?: string | null;
  month: string;
  limit: number;
  spent: number;
  percent: number;
}

export interface BudgetSummaryResponse {
  items: BudgetSummaryItem[];
  totals: {
    limit: number;
    spent: number;
  };
}

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
  const response = await axiosClient.delete<{
    success: boolean;
    error?: { message?: string };
  }>(`/budgets/${budgetId}`);

  if (!response.data?.success) {
    throw new Error(response.data?.error?.message || 'Delete budget failed');
  }
}

/**
 * List budgets
 */
export async function listBudgets(params: BudgetListParams): Promise<BudgetListResponse> {
  const response = await axiosClient.get<{
    success: boolean;
    data?: BudgetListResponse;
    error?: { message?: string };
  }>('/budgets', { params });

  if (!response.data?.success || !response.data.data) {
    throw new Error(response.data?.error?.message || 'Failed to list budgets');
  }

  return response.data.data;
}

/**
 * Upsert budget (create or update)
 */
export async function upsertBudget(input: UpsertBudgetInput): Promise<Budget> {
  const response = await axiosClient.post<{
    success: boolean;
    data?: Budget;
    error?: { message?: string };
  }>('/budgets', input);

  if (!response.data?.success || !response.data.data) {
    throw new Error(response.data?.error?.message || 'Failed to upsert budget');
  }

  return response.data.data;
}

/**
 * Update budget limit
 */
export async function updateBudgetLimit(id: string, input: UpdateBudgetLimitInput): Promise<Budget> {
  const response = await axiosClient.patch<{
    success: boolean;
    data?: Budget;
    error?: { message?: string };
  }>(`/budgets/${id}`, input);

  if (!response.data?.success || !response.data.data) {
    throw new Error(response.data?.error?.message || 'Failed to update budget');
  }

  return response.data.data;
}

/**
 * Delete budget
 */
export async function deleteBudgetById(id: string): Promise<void> {
  const response = await axiosClient.delete<{
    success: boolean;
    error?: { message?: string };
  }>(`/budgets/${id}`);

  if (!response.data?.success) {
    throw new Error(response.data?.error?.message || 'Failed to delete budget');
  }
}

/**
 * Get budget summary for a specific month
 */
export async function getBudgetSummary(month: string): Promise<BudgetSummaryResponse> {
  const response = await axiosClient.get<{
    success: boolean;
    data?: BudgetSummaryResponse;
    error?: { message?: string };
  }>('/budgets/summary', { params: { month } });

  if (!response.data?.success || !response.data.data) {
    throw new Error(response.data?.error?.message || 'Failed to get budget summary');
  }

  return response.data.data;
}

/**
 * Fetch all saving goals
 */
export async function fetchGoals(): Promise<SavingGoal[]> {
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
  const response = await axiosClient.delete<{
    success: boolean;
    error?: { message?: string };
  }>(`/goals/${goalId}`);

  if (!response.data?.success) {
    throw new Error(response.data?.error?.message || 'Delete goal failed');
  }
}
