import { BudgetOverview } from '@/features/budgets/BudgetOverview';

function Dashboard() {
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

        {/* Budget overview section */}
        <BudgetOverview />
      </div>
    </main>
  );
}

export default Dashboard;
