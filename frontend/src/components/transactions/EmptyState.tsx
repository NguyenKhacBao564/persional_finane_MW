import { Link } from 'react-router-dom';
import { Button } from '@/ui/button';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-6xl mb-4">💳</div>
      <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
        No transactions match your filters. Try adjusting your search criteria or add a new transaction.
      </p>
      <Button asChild>
        <Link to="/transactions/new">Add transaction</Link>
      </Button>
    </div>
  );
}
