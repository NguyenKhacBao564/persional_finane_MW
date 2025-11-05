import { useQuery } from '@tanstack/react-query';
import { BudgetOverview } from '@/features/budgets/BudgetOverview';
import { BudgetAlertsBanner } from '@/features/budgets/BudgetAlertsBanner';
import { BudgetAlertList } from '@/components/budgets/BudgetAlertList';
import { fetchBudgetSummary } from '@/api/budgets';

/**
 * Get current month date range for budget queries
 */
function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    period: 'month',
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

function Dashboard() {
  const params = getCurrentMonthRange();

  // Fetch budget summary for alerts
  const { data } = useQuery({
    queryKey: ['budgets', 'summary', params],
    queryFn: () => fetchBudgetSummary(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your financial health and spending
          </p>
        </div>

        {/* Budget alerts (banner + detailed list) */}
        {data?.items && data.items.length > 0 && (
          <>
            <BudgetAlertsBanner items={data.items} />
            <div className="mb-4">
              <BudgetAlertList items={data.items} limit={5} />
            </div>
          </>
        )}

        {/* Budget overview section */}
        <BudgetOverview />
      </div>
    </main>
  );
}

export default Dashboard;
