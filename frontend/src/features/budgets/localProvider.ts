import type { BudgetSummary, BudgetQueryParams, BudgetPeriod } from '@/types/budgets';

/**
 * Local/mock budget provider for development when backend is not ready
 * Generates realistic budget data based on common categories
 */

const MOCK_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Fitness',
];

/**
 * Generate mock budget summary
 * Creates random but realistic budget allocations and spending
 */
export async function fetchBudgetSummaryLocal(
  _params: BudgetQueryParams
): Promise<BudgetSummary> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const items = MOCK_CATEGORIES.map((categoryName, index) => {
    // Random allocation between 500k - 5M VND
    const allocated = Math.floor(Math.random() * 4500000) + 500000;
    
    // Spent is 40%-110% of allocated (to show different statuses)
    const spentPercentage = 0.4 + Math.random() * 0.7;
    const spent = Math.floor(allocated * spentPercentage);

    const period: BudgetPeriod = index % 3 === 0 ? 'WEEKLY' : 'MONTHLY';

    return {
      budgetId: `budget-${index + 1}`,
      categoryId: `category-${index + 1}`,
      categoryName,
      period,
      allocated,
      spent,
    };
  });

  // Calculate totals
  const totals = items.reduce(
    (acc, item) => ({
      allocated: acc.allocated + item.allocated,
      spent: acc.spent + item.spent,
      remaining: acc.remaining + (item.allocated - item.spent),
    }),
    { allocated: 0, spent: 0, remaining: 0 }
  );

  return {
    totals,
    items,
  };
}
