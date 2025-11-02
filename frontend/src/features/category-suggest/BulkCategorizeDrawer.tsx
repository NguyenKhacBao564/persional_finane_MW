import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchCategorySuggestionsByTxId,
  applyCategoryBulk,
} from '@/api/categorySuggestions';
import type { CategorySuggestion } from '@/types/suggestions';
import type { Transaction } from '@/types/transactions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { Separator } from '@/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/tooltip';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface BulkCategorizeDrawerProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  selection: string[];
  transactions: Transaction[];
}

type TransactionWithSuggestions = {
  transaction: Transaction;
  suggestions: CategorySuggestion[];
  selectedCategoryId?: string;
};

/**
 * BulkCategorizeDrawer - Bulk categorization interface with AI suggestions.
 * Shows suggestions for each selected transaction and allows batch application.
 * 
 * @param open - Dialog open state
 * @param onOpenChange - Dialog state change handler
 * @param selection - Array of selected transaction IDs
 * @param transactions - Full transaction list for data lookup
 */
export function BulkCategorizeDrawer({
  open,
  onOpenChange,
  selection,
  transactions,
}: BulkCategorizeDrawerProps) {
  const queryClient = useQueryClient();
  const [selectedCategories, setSelectedCategories] = useState<
    Record<string, string>
  >({});

  // Get selected transactions
  const selectedTransactions = useMemo(
    () => transactions.filter((tx) => selection.includes(tx.id)),
    [transactions, selection]
  );

  // Fetch suggestions for all selected transactions in parallel
  const suggestionsQueries = useQuery<TransactionWithSuggestions[]>({
    queryKey: ['bulk-suggestions', selection],
    queryFn: async () => {
      const results = await Promise.all(
        selectedTransactions.map(async (tx) => {
          try {
            const suggestions = await fetchCategorySuggestionsByTxId(tx.id);
            return {
              transaction: tx,
              suggestions,
              selectedCategoryId: undefined,
            };
          } catch {
            return {
              transaction: tx,
              suggestions: [],
              selectedCategoryId: undefined,
            };
          }
        })
      );
      return results;
    },
    enabled: open && selection.length > 0,
  });

  const txWithSuggestions = suggestionsQueries.data || [];

  // Apply bulk categorization mutation
  const applyBulkMutation = useMutation({
    mutationFn: applyCategoryBulk,
    onSuccess: (data) => {
      toast.success(`Applied categories to ${data.updated} transactions`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      onOpenChange(false);
      setSelectedCategories({});
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to apply categories');
    },
  });

  const handleSelectCategory = (txId: string, categoryId: string) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [txId]: categoryId,
    }));
  };

  const handleApplyBestForAll = () => {
    const autoSelected: Record<string, string> = {};
    txWithSuggestions.forEach((item) => {
      if (item.suggestions.length > 0 && !item.transaction.category) {
        autoSelected[item.transaction.id] = item.suggestions[0].categoryId;
      }
    });
    setSelectedCategories((prev) => ({ ...prev, ...autoSelected }));
  };

  const handleApply = async () => {
    const items = Object.entries(selectedCategories).map(([txId, categoryId]) => ({
      txId,
      categoryId,
    }));

    if (items.length === 0) {
      toast.error('Please select at least one category to apply');
      return;
    }

    await applyBulkMutation.mutateAsync(items);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-emerald-600 dark:text-emerald-400';
    if (confidence >= 0.5) return 'text-amber-600 dark:text-amber-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Bulk Categorize Transactions
          </DialogTitle>
          <DialogDescription>
            Review AI suggestions and apply categories to {selection.length} transactions.
          </DialogDescription>
        </DialogHeader>

        {suggestionsQueries.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-sm text-muted-foreground">
              Loading suggestions...
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Apply Best for All Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyBestForAll}
                disabled={applyBulkMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Apply Best for All
              </Button>
            </div>

            <Separator />

            {/* Transaction List with Suggestions */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {txWithSuggestions.map((item) => {
                const isNegative = item.transaction.amount < 0;
                const selectedCat = selectedCategories[item.transaction.id];

                return (
                  <div
                    key={item.transaction.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    {/* Transaction Info */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatDate(item.transaction.txDate)}
                          </span>
                          {item.transaction.note && (
                            <span className="text-sm text-muted-foreground">
                              {item.transaction.note}
                            </span>
                          )}
                        </div>
                        {item.transaction.category && (
                          <div className="text-xs text-muted-foreground">
                            Current: {item.transaction.category.name}
                          </div>
                        )}
                      </div>
                      <div
                        className={cn(
                          'text-lg font-bold',
                          isNegative
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        )}
                      >
                        {formatCurrency(item.transaction.amount, item.transaction.currency)}
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        Suggestions:
                      </div>
                      {item.suggestions.length === 0 ? (
                        <div className="text-xs text-muted-foreground italic">
                          No suggestions available
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {item.suggestions.slice(0, 3).map((suggestion) => {
                            const isSelected = selectedCat === suggestion.categoryId;

                            return (
                              <TooltipProvider key={suggestion.categoryId}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant={isSelected ? 'default' : 'outline'}
                                      size="sm"
                                      className={cn(
                                        'rounded-full gap-1.5 h-8',
                                        !isSelected && 'hover:border-primary'
                                      )}
                                      onClick={() =>
                                        handleSelectCategory(
                                          item.transaction.id,
                                          suggestion.categoryId
                                        )
                                      }
                                      disabled={applyBulkMutation.isPending}
                                    >
                                      {isSelected && (
                                        <CheckCircle2 className="h-3 w-3" />
                                      )}
                                      <span>{suggestion.categoryName}</span>
                                      <Badge
                                        variant="secondary"
                                        className={cn(
                                          'text-[10px] px-1.5 py-0',
                                          getConfidenceColor(suggestion.confidence)
                                        )}
                                      >
                                        {Math.round(suggestion.confidence * 100)}%
                                      </Badge>
                                    </Button>
                                  </TooltipTrigger>
                                  {suggestion.reason && (
                                    <TooltipContent>
                                      <p className="text-xs">{suggestion.reason}</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={applyBulkMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={
              Object.keys(selectedCategories).length === 0 ||
              applyBulkMutation.isPending
            }
          >
            {applyBulkMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Apply Categories ({Object.keys(selectedCategories).length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
