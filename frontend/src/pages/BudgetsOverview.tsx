import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/ui/button';
import { BudgetOverview } from '@/features/budgets/BudgetOverview';

function BudgetsOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Track your spending across categories with monthly budgets
          </p>
        </div>
        <Link to="/budgets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Budget
          </Button>
        </Link>
      </div>

      <BudgetOverview />
    </div>
  );
}

export default BudgetsOverviewPage;
