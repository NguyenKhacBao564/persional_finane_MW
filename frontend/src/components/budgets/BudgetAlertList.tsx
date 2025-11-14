import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { computeBudgetStatus } from '@/lib/budget';
import type { BudgetItem } from '@/types/budgets';
import { formatCurrency } from '@/lib/formatters';

interface BudgetAlertListProps {
  items: BudgetItem[];
  limit?: number;
}

/**
 * BudgetAlertList - Shows budgets that are approaching or exceeding limits
 * 
 * Features:
 * - Filters budgets with warning or over state
 * - Sorts by usage ratio (highest first)
 * - Limits display to top N items
 * - Shows category name, usage percentage, and state
 * - Accessible with ARIA region and semantic HTML
 */
export function BudgetAlertList({ items, limit = 5 }: BudgetAlertListProps) {
  const flagged = items
    .map((b) => ({ 
      b, 
      status: computeBudgetStatus({ 
        allocated: b.allocated, 
        spent: b.spent, 
        start: b.start, 
        end: b.end 
      }) 
    }))
    .filter((x) => x.status.state !== 'ok')
    .sort((a, b) => (b.status.ratio - a.status.ratio))
    .slice(0, limit);

  if (flagged.length === 0) return null;

  return (
    <Card role="region" aria-label="Budget alerts">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          Budget Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {flagged.map(({ b, status }) => (
          <div 
            key={b.budgetId} 
            className="flex items-center justify-between rounded-md border p-2"
          >
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{b.categoryName}</span>
              <span className="text-xs text-slate-500">
                {status.state === 'over' ? 'Exceeded' : 'Approaching'} • Used {Math.round(status.ratio * 100)}% of {formatCurrency(b.allocated, 'VND')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span 
                className={status.state === 'over' ? 'text-red-700 font-semibold' : 'text-amber-700 font-semibold'}
              >
                {status.state.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
