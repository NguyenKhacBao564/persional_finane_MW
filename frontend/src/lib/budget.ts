/**
 * Budget status calculation utilities
 * Pure functions for computing budget health and warning states
 */

export type BudgetState = 'ok' | 'warning' | 'over';

/**
 * Get warning threshold from environment variable
 * @returns threshold value between 0 and 1, defaults to 0.8 (80%)
 */
export function getWarningThreshold(): number {
  const raw = import.meta.env.VITE_BUDGET_WARNING_THRESH;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 && n < 1 ? n : 0.8;
}

/**
 * Compute budget status based on allocated amount and spending
 * @returns status object with ratio, remaining amount, state, and threshold
 */
export function computeBudgetStatus(args: {
  allocated: number;
  spent: number;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}): {
  ratio: number;          // spent / allocated (0..∞)
  remaining: number;      // allocated - spent (can be negative)
  state: BudgetState;     // 'ok' | 'warning' | 'over'
  threshold: number;      // used for decisions
} {
  const { allocated, spent } = args;
  const threshold = getWarningThreshold();
  const ratio = allocated > 0 ? spent / allocated : 0;
  const remaining = Math.max(0, allocated) - Math.max(0, spent);
  const state: BudgetState = ratio >= 1 ? 'over' : ratio >= threshold ? 'warning' : 'ok';
  return { ratio, remaining, state, threshold };
}

/**
 * Format percentage value for display
 * @param p - percentage as decimal (0.75 = 75%)
 * @returns formatted string like "75%"
 */
export function fmtPercent(p: number): string {
  if (!Number.isFinite(p)) return '0%';
  return `${Math.round(p * 100)}%`;
}
