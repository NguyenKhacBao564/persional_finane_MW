/**
 * Budget types for the application
 */

export type BudgetPeriod = 'MONTHLY' | 'WEEKLY' | 'ANNUAL';

export interface BudgetItem {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  period: BudgetPeriod;
  allocated: number;
  spent: number;
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
