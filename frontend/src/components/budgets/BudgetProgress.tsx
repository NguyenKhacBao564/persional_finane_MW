import { getBudgetPercentage, getBudgetStatus } from '@/types/budgets';
import { cn } from '@/lib/utils';

interface BudgetProgressProps {
  allocated: number;
  spent: number;
  className?: string;
}

/**
 * BudgetProgress - Pure component for rendering budget progress bar
 * 
 * Displays a progress bar with percentage and appropriate status colors:
 * - OK (<70%): neutral slate
 * - Warning (70-90%): amber
 * - Over (>90%): red
 * 
 * @param allocated - Total allocated amount
 * @param spent - Amount spent so far
 * @param className - Optional additional CSS classes
 */
export function BudgetProgress({ allocated, spent, className }: BudgetProgressProps) {
  const percentage = getBudgetPercentage(allocated, spent);
  const status = getBudgetStatus(allocated, spent);

  // Status-based color classes
  const progressColors = {
    ok: 'bg-slate-500',
    warning: 'bg-amber-500',
    over: 'bg-red-500',
  };

  const textColors = {
    ok: 'text-slate-700 dark:text-slate-300',
    warning: 'text-amber-700 dark:text-amber-300',
    over: 'text-red-700 dark:text-red-300',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            progressColors[status]
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={Math.round(percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Budget usage: ${Math.round(percentage)}%`}
        />
      </div>

      {/* Percentage label */}
      <div className="flex justify-between items-center text-xs">
        <span className={cn('font-medium', textColors[status])}>
          {Math.round(percentage)}% used
        </span>
        {status === 'over' && (
          <span className="text-red-600 dark:text-red-400 font-medium">
            Over budget
          </span>
        )}
      </div>
    </div>
  );
}
