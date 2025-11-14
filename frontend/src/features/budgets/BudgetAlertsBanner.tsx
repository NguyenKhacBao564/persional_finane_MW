import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type { BudgetItem } from '@/types/budgets';
import { computeBudgetStatus } from '@/lib/budget';
import { Button } from '@/ui/button';
import { useState, useMemo } from 'react';

/**
 * Generate dismiss key based on budget period
 * Uses first item's start date YYYY-MM as unique key per month
 */
function getDismissKey(items: BudgetItem[]) {
  const month = items[0]?.start?.slice(0, 7) ?? 'unknown';
  return `pfm_budget_banner_dismiss_${month}`;
}

interface BudgetAlertsBannerProps {
  items: BudgetItem[];
}

/**
 * BudgetAlertsBanner - Dismissible warning banner for budget overruns
 * 
 * Features:
 * - Shows count of over-budget and approaching-limit budgets
 * - Dismissible per period (month) with localStorage persistence
 * - Feature toggle via VITE_BUDGET_WARNINGS env flag
 * - Accessible with role="alert" and keyboard-friendly dismiss
 * - High contrast colors for visibility
 */
export function BudgetAlertsBanner({ items }: BudgetAlertsBannerProps) {
  const flagged = useMemo(() => {
    return items
      .map((b) => ({ 
        b, 
        s: computeBudgetStatus({ 
          allocated: b.allocated, 
          spent: b.spent, 
          start: b.start, 
          end: b.end 
        }) 
      }))
      .filter(({ s }) => s.state !== 'ok');
  }, [items]);

  const dismissKey = getDismissKey(items);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    return localStorage.getItem(dismissKey) === '1';
  });

  if (dismissed || flagged.length === 0 || import.meta.env.VITE_BUDGET_WARNINGS === 'false') {
    return null;
  }

  const over = flagged.filter(({ s }) => s.state === 'over').length;
  const warn = flagged.filter(({ s }) => s.state === 'warning').length;

  const handleDismiss = () => {
    localStorage.setItem(dismissKey, '1');
    setDismissed(true);
  };

  return (
    <Alert role="alert" className="mb-4 border-red-300 bg-red-50 text-red-800">
      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle className="font-semibold">Budget warnings</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-2">
        <span>
          {over > 0 && (
            <>
              <b>{over}</b> {over === 1 ? 'budget' : 'budgets'} over limit
            </>
          )}
          {over > 0 && warn > 0 && ', '}
          {warn > 0 && (
            <>
              <b>{warn}</b> near limit
            </>
          )}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDismiss}
          aria-label="Dismiss budget warnings"
          className="bg-white hover:bg-red-100"
        >
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
  );
}
