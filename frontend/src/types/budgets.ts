/**
 * Budget types for the application
 */

export type BudgetPeriod = 'MONTHLY' | 'WEEKLY' | 'ANNUAL';

export interface BudgetItem {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  period: BudgetPeriod;
  allocated: number;   // planned amount
  spent: number;       // actual to date
  start: string;       // YYYY-MM-DD
  end: string;         // YYYY-MM-DD
  notes?: string | null;
}

export interface BudgetSummary {
  totals: {
    allocated: number;
    spent: number;
    remaining: number;
  };
  items: BudgetItem[];
}

export interface BudgetQueryParams {
  period: string;
  start: string;
  end: string;
}

export interface BudgetCreateInput {
  categoryId: string;
  month: string;       // YYYY-MM
  limit: number;
  period?: BudgetPeriod;
  allocated?: number;
  start?: string;
  end?: string;
  notes?: string | null;
}

export interface BudgetUpdateInput {
  budgetId: string;
  month?: string;
  limit?: number;
  period?: BudgetPeriod;
  allocated?: number;
  start?: string;
  end?: string;
  notes?: string | null;
}

export interface SavingGoal {
  goalId: string;
  name: string;
  targetAmount: number;
  targetDate: string;   // YYYY-MM-DD
  currentSaved: number; // server computed or derived
  notes?: string | null;
}

export interface GoalCreateInput {
  name: string;
  targetAmount: number;
  targetDate: string;   // YYYY-MM-DD
  notes?: string | null;
}

export interface GoalUpdateInput extends GoalCreateInput {
  goalId: string;
}

/**
 * Budget status based on usage percentage
 */
export type BudgetStatus = 'ok' | 'warning' | 'over';

/**
 * Helper to determine budget status
 */
export function getBudgetStatus(allocated: number, spent: number): BudgetStatus {
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
  
  if (percentage > 90) return 'over';
  if (percentage >= 70) return 'warning';
  return 'ok';
}

/**
 * Helper to calculate percentage
 */
export function getBudgetPercentage(allocated: number, spent: number): number {
  if (allocated <= 0) return 0;
  return Math.min((spent / allocated) * 100, 100);
}
