import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Wallet, Plus, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';
import { Skeleton } from '@/ui/skeleton';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { BudgetProgress } from '@/components/budgets/BudgetProgress';
import { BudgetFormDialog } from '@/components/budgets/BudgetFormDialog';
import { GoalFormDialog } from '@/components/goals/GoalFormDialog';
import { fetchBudgetSummary } from '@/api/budgets';
import { formatCurrency } from '@/lib/formatters';
import type { BudgetQueryParams } from '@/types/budgets';

const USE_LOCAL = import.meta.env.VITE_BUDGETS_LOCAL === 'true';

/**
 * Get current month date range for budget queries
 */
function getCurrentMonthRange(): BudgetQueryParams {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    period: 'month',
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * BudgetOverview - Main budget overview component
 * 
 * Features:
 * - Fetches budget summary with React Query
 * - Displays summary header with total allocated/spent/remaining
 * - Grid of budget cards for each category
 * - Loading skeletons
 * - Error handling with retry
 * - Empty state when no budgets
 * - Feature flag for local provider (VITE_BUDGETS_LOCAL=true)
 */
export function BudgetOverview() {
  const params = getCurrentMonthRange();
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['budgets', 'summary', params],
    queryFn: () => fetchBudgetSummary(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Summary skeleton */}
        <Card className="rounded-xl">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>

        {/* Budget cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-xl">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20 mt-1" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to load budgets</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>
            {error instanceof Error ? error.message : 'Unable to fetch budget data'}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (!data || data.items.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Track your spending across categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Wallet className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Create your first budget to start tracking spending by category.
            </p>
            <Button>Create Budget</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totals, items } = data;
  const currency = 'VND';

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" aria-hidden="true" />
                Budget Overview
              </CardTitle>
              <CardDescription>
                Monthly spending across all categories
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setGoalDialogOpen(true)}
              >
                <Target className="mr-2 h-4 w-4" />
                New Goal
              </Button>
              <Button size="sm" onClick={() => setBudgetDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Budget
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total amounts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Allocated</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totals.allocated, currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totals.spent, currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Remaining</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totals.remaining, currency)}
              </p>
            </div>
          </div>

          {/* Global progress */}
          <BudgetProgress 
            allocated={totals.allocated} 
            spent={totals.spent} 
            start={params.start} 
            end={params.end} 
          />
        </CardContent>
      </Card>

      {/* Budget cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((budget) => (
          <BudgetCard key={budget.budgetId} budget={budget} currency={currency} />
        ))}
      </div>

      {/* Dialogs */}
      <BudgetFormDialog
        open={budgetDialogOpen}
        onOpenChange={setBudgetDialogOpen}
        defaultPeriod="MONTHLY"
        defaultDates={params}
      />

      <GoalFormDialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen} />
    </div>
  );
}
