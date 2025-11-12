import { useQuery } from '@tanstack/react-query';
import { BudgetAlertList } from '@/components/budgets/BudgetAlertList';
import { fetchBudgetSummary } from '@/api/budgets';

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

  const { data } = useQuery({
    queryKey: ['budgets', 'summary', params],
    queryFn: () => fetchBudgetSummary(params),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Budget Alerts</h3>
        {data?.items && data.items.length > 0 ? (
          <BudgetAlertList items={data.items} limit={5} />
        ) : (
          <p className="text-sm text-muted-foreground">No budget alerts at this time.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
