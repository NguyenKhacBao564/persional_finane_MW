import { cn } from '@/lib/utils';
import { computeBudgetStatus, fmtPercent, type BudgetState } from '@/lib/budget';

interface BudgetStatusPillProps {
  allocated: number;
  spent: number;
  start: string;
  end: string;
  className?: string;
}

const colorByState: Record<BudgetState, string> = {
  ok: 'bg-slate-100 text-slate-700 border-slate-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  over: 'bg-red-100 text-red-800 border-red-200',
};

/**
 * BudgetStatusPill - Visual indicator of budget health
 * 
 * Features:
 * - Color-coded status (ok/warning/over)
 * - Shows percentage used
 * - Accessible with ARIA labels
 * - Small visual indicator dot
 */
export function BudgetStatusPill({ allocated, spent, start, end, className }: BudgetStatusPillProps) {
  const { ratio, state } = computeBudgetStatus({ allocated, spent, start, end });
  const label =
    state === 'over' ? `Over (${fmtPercent(ratio)})` :
    state === 'warning' ? `High (${fmtPercent(ratio)})` : `OK (${fmtPercent(ratio)})`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium',
        colorByState[state],
        className
      )}
      aria-label={`Budget status ${label}`}
    >
      <span 
        className={cn(
          'h-1.5 w-1.5 rounded-full', 
          state === 'over' ? 'bg-red-600' : state === 'warning' ? 'bg-amber-500' : 'bg-slate-400'
        )} 
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
