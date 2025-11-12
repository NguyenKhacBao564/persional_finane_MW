import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Sparkles } from 'lucide-react';
import { fetchTransactions } from '@/api/transactions';
import type { TxFilters, TxListResponse, Transaction } from '@/types/transactions';
import { Card } from '@/ui/card';
import { Button } from '@/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';
import { TransactionFilterBar } from '@/components/transactions/TransactionFilterBar';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { TransactionCardItem } from '@/components/transactions/TransactionCardItem';
import { PaginationBar } from '@/components/transactions/PaginationBar';
import { TransactionSkeleton } from '@/components/transactions/TransactionSkeleton';
import { EmptyState } from '@/components/transactions/EmptyState';
import { CreateTransactionDialog } from '@/components/transactions/CreateTransactionDialog';
import { BulkCategorizeDrawer } from '@/features/category-suggest/BulkCategorizeDrawer';

function parseFiltersFromUrl(params: URLSearchParams): TxFilters {
  const filters: TxFilters = {
    page: Number(params.get('page')) || 1,
    limit: Number(params.get('limit')) || 10,
    sort: params.get('sort') || 'txDate:desc',
  };

  const search = params.get('search');
  if (search) filters.search = search;

  const type = params.get('type');
  if (type === 'IN' || type === 'OUT') {
    filters.type = type;
  }

  const category = params.get('category');
  if (category) filters.category = category;

  const min = params.get('min');
  if (min) filters.min = Number(min);

  const max = params.get('max');
  if (max) filters.max = Number(max);

  const start = params.get('start');
  if (start) filters.start = start;

  const end = params.get('end');
  if (end) filters.end = end;

  return filters;
}

function serializeFiltersToUrl(filters: TxFilters): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.page) params.page = filters.page.toString();
  if (filters.limit) params.limit = filters.limit.toString();
  if (filters.sort) params.sort = filters.sort;
  if (filters.search) params.search = filters.search;
  if (filters.type) params.type = filters.type;
  if (filters.category) params.category = filters.category;
  if (filters.min !== undefined) params.min = filters.min.toString();
  if (filters.max !== undefined) params.max = filters.max.toString();
  if (filters.start) params.start = filters.start;
  if (filters.end) params.end = filters.end;

  return params;
}

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selection, setSelection] = useState<string[]>([]);
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);

  const filters = useMemo(
    () => parseFiltersFromUrl(searchParams),
    [searchParams]
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<TxListResponse, Error>({
    queryKey: ['transactions', filters],
    queryFn: () => fetchTransactions(filters),
  });

  const handleFiltersChange = (newFilters: TxFilters) => {
    setSearchParams(serializeFiltersToUrl(newFilters));
  };

  const handlePageChange = (page: number) => {
    handleFiltersChange({ ...filters, page });
  };

  const handleLimitChange = (limit: number) => {
    handleFiltersChange({ ...filters, limit, page: 1 });
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transactions</h1>
          <p className="text-muted-foreground">
            View and manage your financial transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateTransactionDialog />
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selection.length > 0 && (
        <div className="mb-4 p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
          <span className="text-sm font-medium">
            {selection.length} transaction{selection.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelection([])}
            >
              Clear Selection
            </Button>
            <Button
              size="sm"
              onClick={() => setBulkDrawerOpen(true)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Suggest & Apply
            </Button>
          </div>
        </div>
      )}

      <TransactionFilterBar
        value={filters}
        onChange={handleFiltersChange}
        disabled={isLoading}
      />

      <Card className="rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        {isError && (
          <div className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="mt-2">
                {error instanceof Error
                  ? error.message
                  : 'Failed to load transactions'}
              </AlertDescription>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-4"
              >
                Retry
              </Button>
            </Alert>
          </div>
        )}

        {isLoading && (
          <div className="p-6">
            <TransactionSkeleton rows={filters.limit || 10} />
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            {data.items.length === 0 ? (
              <div className="p-6">
                <EmptyState />
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block" id="transactions-table">
                  <TransactionTable
                    transactions={data.items}
                    selection={selection}
                    onSelectionChange={setSelection}
                  />
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                  {data.items.map((tx: Transaction) => (
                    <TransactionCardItem key={tx.id} transaction={tx} />
                  ))}
                </div>

                {/* Pagination */}
                <div className="px-6 pb-4 border-t">
                  <PaginationBar
                    page={data.page}
                    limit={data.limit}
                    total={data.total}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                  />
                </div>
              </>
            )}
          </>
        )}
      </Card>

      {/* Bulk Categorize Drawer */}
      {data && (
        <BulkCategorizeDrawer
          open={bulkDrawerOpen}
          onOpenChange={(open) => {
            setBulkDrawerOpen(open);
            if (!open) setSelection([]);
          }}
          selection={selection}
          transactions={data.items}
        />
      )}
    </div>
  );
}
