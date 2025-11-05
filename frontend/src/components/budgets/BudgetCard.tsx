import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/ui/card';
import { Badge } from '@/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/tooltip';
import { BudgetProgress } from './BudgetProgress';
import { formatCurrency } from '@/lib/formatters';
import { getBudgetStatus } from '@/types/budgets';
import { cn } from '@/lib/utils';
import type { BudgetItem } from '@/types/budgets';

interface BudgetCardProps {
  budget: BudgetItem;
  currency?: string;
}

/**
 * BudgetCard - Displays individual budget with status, progress, and amounts
 * 
 * Shows:
 * - Category name
 * - Period (MONTHLY/WEEKLY/ANNUAL)
 * - Allocated, Spent, Remaining amounts
 * - Progress bar with status coloring
 * - Status badge with warnings/alerts
 * 
 * @param budget - Budget item data
 * @param currency - Currency code (default: VND)
 */
export function BudgetCard({ budget, currency = 'VND' }: BudgetCardProps) {
  const { categoryName, period, allocated, spent } = budget;
  const remaining = allocated - spent;
  const status = getBudgetStatus(allocated, spent);

  // Status badge styling
  const statusBadgeClasses = {
    ok: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    over: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };

  const statusLabels = {
    ok: 'On Track',
    warning: 'Warning',
    over: 'Over Budget',
  };

  // Period label
  const periodLabel = period.charAt(0) + period.slice(1).toLowerCase();

  return (
    <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{categoryName}</h3>
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'flex items-center gap-1',
                      statusBadgeClasses[status]
                    )}
                  >
                    {status === 'over' && (
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                    )}
                    {statusLabels[status]}
                  </Badge>
                </div>
              </TooltipTrigger>
              {status === 'warning' && (
                <TooltipContent>
                  <p className="text-xs">Getting close to limit</p>
                </TooltipContent>
              )}
              {status === 'over' && (
                <TooltipContent>
                  <p className="text-xs">Exceeded budget allocation</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Budget amounts */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Allocated</p>
            <p className="font-medium">{formatCurrency(allocated, currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Spent</p>
            <p className="font-medium">{formatCurrency(spent, currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Remaining</p>
            <p
              className={cn(
                'font-medium',
                remaining < 0 ? 'text-red-600 dark:text-red-400' : ''
              )}
            >
              {formatCurrency(Math.abs(remaining), currency)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <BudgetProgress allocated={allocated} spent={spent} />
      </CardContent>
    </Card>
  );
}
