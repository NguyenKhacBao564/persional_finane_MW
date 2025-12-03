import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { getBudgetSummary } from '@/api/budgets';
import { fetchSpendingByCategory, fetchTrends } from '@/api/insights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Progress } from '@/ui/progress';
import { formatCurrency } from '@/lib/formatters';
import { SpendingPieChart } from '@/features/dashboard/components/SpendingPieChart';
import { CashFlowBarChart } from '@/features/dashboard/components/CashFlowBarChart';

function Dashboard() {
  const today = new Date();
  const currentMonth = format(today, 'yyyy-MM');
  
  // Calculate date range for trends (e.g., last 30 days)
  const fromDate = format(subDays(today, 30), 'yyyy-MM-dd');
  const toDate = format(today, 'yyyy-MM-dd');
  
  const startOfMonthDate = format(startOfMonth(today), 'yyyy-MM-dd');
  const endOfMonthDate = format(endOfMonth(today), 'yyyy-MM-dd');

  const { data: budgetData, isLoading: isBudgetLoading } = useQuery({
    queryKey: ['budgets', 'summary', currentMonth],
    queryFn: () => getBudgetSummary(currentMonth),
    staleTime: 5 * 60 * 1000,
  });

  const { data: spendingData, isLoading: isSpendingLoading } = useQuery({
    queryKey: ['insights', 'spending', currentMonth],
    queryFn: () => fetchSpendingByCategory({ from: startOfMonthDate, to: endOfMonthDate }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: trendsData, isLoading: isTrendsLoading } = useQuery({
    queryKey: ['insights', 'trends', fromDate, toDate],
    queryFn: () => fetchTrends({ from: fromDate, to: toDate, groupBy: 'day' }),
    staleTime: 5 * 60 * 1000,
  });

  const alertItems = budgetData?.items.filter((item) => item.percent >= 0.8) || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <CashFlowBarChart data={trendsData?.items} isLoading={isTrendsLoading} />
        </div>
        <div className="col-span-3">
          <SpendingPieChart data={spendingData?.items} isLoading={isSpendingLoading} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Alerts</CardTitle>
          <CardDescription>
            Categories that are over 80% of their budget limit
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isBudgetLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : alertItems.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>All budgets are within limits</span>
            </div>
          ) : (
            <div className="space-y-4">
              {alertItems.map((item) => {
                const percentValue = item.percent * 100;
                const isDanger = item.percent >= 1.0;
                const isWarning = item.percent >= 0.8 && item.percent < 1.0;

                return (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isDanger ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                        <div className="flex items-center gap-2">
                          {item.categoryColor && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.categoryColor }}
                            />
                          )}
                          <span className="font-medium">{item.categoryName}</span>
                        </div>
                      </div>
                      <div className="text-sm text-right">
                        <div className="font-medium">
                          {formatCurrency(item.spent, 'VND')} / {formatCurrency(item.limit, 'VND')}
                        </div>
                        <div className={isDanger ? 'text-red-600' : 'text-yellow-600'}>
                          {percentValue.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(percentValue, 100)}
                      className={isDanger ? 'bg-red-100' : 'bg-yellow-100'}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
