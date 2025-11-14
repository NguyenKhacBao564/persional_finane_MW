import { cn } from '@/lib/utils';
import { computeBudgetStatus, type BudgetState } from '@/lib/budget';

interface BudgetProgressProps {
  allocated: number;
  spent: number;
  start?: string;
  end?: string;
  className?: string;
}

const progressColorByState: Record<BudgetState, string> = {
  ok: 'bg-slate-500',
  warning: 'bg-amber-500',
  over: 'bg-red-500',
};

const textColorByState: Record<BudgetState, string> = {
  ok: 'text-slate-700 dark:text-slate-300',
  warning: 'text-amber-700 dark:text-amber-300',
  over: 'text-red-700 dark:text-red-300',
};

/**
 * BudgetProgress - Pure component for rendering budget progress bar
 * 
 * Displays a progress bar with percentage and appropriate status colors:
 * - OK (under threshold): neutral slate
 * - Warning (at threshold, under 100%): amber
 * - Over (100%+): red
 * 
 * @param allocated - Total allocated amount
 * @param spent - Amount spent so far
 * @param start - Budget start date (YYYY-MM-DD)
 * @param end - Budget end date (YYYY-MM-DD)
 * @param className - Optional additional CSS classes
 */
export function BudgetProgress({ allocated, spent, start, end, className }: BudgetProgressProps) {
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
  const cappedPercentage = Math.min(percentage, 100);

  // Determine state from budget computation or fallback to percentage-based
  const state: BudgetState = start && end 
    ? computeBudgetStatus({ allocated, spent, start, end }).state
    : percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'ok';

  const progressColor = progressColorByState[state];
  const textColor = textColorByState[state];

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            progressColor
          )}
          style={{ width: `${cappedPercentage}%` }}
          role="progressbar"
          aria-valuenow={Math.round(percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Budget usage: ${Math.round(percentage)}%`}
        />
      </div>

      {/* Percentage label */}
      <div className="flex justify-between items-center text-xs">
        <span className={cn('font-medium', textColor)}>
          {Math.round(percentage)}% used
        </span>
        {state === 'over' && (
          <span className="text-red-600 dark:text-red-400 font-medium">
            Over budget
          </span>
        )}
      </div>
    </div>
  );
}
