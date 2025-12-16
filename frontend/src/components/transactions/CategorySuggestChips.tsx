import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchCategorySuggestionsByTxId,
  fetchCategorySuggestionsByText,
  applyCategory,
} from '@/api/categorySuggestions';
import type { CategorySuggestion } from '@/types/suggestions';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/tooltip';
import { cn } from '@/lib/utils';

interface CategorySuggestChipsProps {
  txId: string;
  note?: string | null;
  amount?: number | null;
  merchant?: string | null;
  currentCategoryId?: string | null;
  onApplied?: (nextCategoryId: string) => void;
  size?: 'sm' | 'md';
  variant?: 'inline' | 'popover';
  max?: number;
}

/**
 * CategorySuggestChips - Display AI-powered category suggestions as clickable chips.
 * Supports inline display or popover mode with confidence scores and reasons.
 * 
 * @param txId - Transaction ID for fetching suggestions
 * @param note - Transaction note for text-based suggestions
 * @param amount - Transaction amount for heuristics
 * @param merchant - Merchant name for matching
 * @param currentCategoryId - Current category to de-emphasize
 * @param onApplied - Callback when category is applied
 * @param size - Chip size variant
 * @param variant - Display mode (inline or popover)
 * @param max - Maximum number of suggestions to show
 */
export function CategorySuggestChips({
  txId,
  note,
  amount,
  merchant,
  currentCategoryId,
  onApplied,
  size = 'sm',
  variant = 'inline',
  max = 3,
}: CategorySuggestChipsProps) {
  const queryClient = useQueryClient();

  // Fetch suggestions (prefer by ID, fallback to text-based)
  const { data: suggestions = [], isLoading } = useQuery<CategorySuggestion[]>({
    queryKey: ['category-suggestions', txId, note, amount, merchant],
    queryFn: async () => {
      try {
        // Try fetching by transaction ID first
        return await fetchCategorySuggestionsByTxId(txId);
      } catch {
        // Fallback to text-based suggestions
        return await fetchCategorySuggestionsByText({
          note: note || undefined,
          amount: amount ?? undefined,
          merchant: merchant || undefined,
        });
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Apply category mutation
  const applyMutation = useMutation({
    mutationFn: (categoryId: string) => applyCategory(txId, categoryId),
    onSuccess: (data, categoryId) => {
      toast.success('Category applied successfully');
      
      if (onApplied) {
        onApplied(categoryId);
      } else {
        // Invalidate transactions query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to apply category');
    },
  });

  // Filter out current category and limit results
  const filteredSuggestions = suggestions
    .filter((s) => s.categoryId !== currentCategoryId)
    .slice(0, max);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading suggestions...</span>
      </div>
    );
  }

  if (filteredSuggestions.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        No suggestions yet
      </div>
    );
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300';
    if (confidence >= 0.5) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300';
    return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Smart suggestions:</span>
      
      <TooltipProvider>
        {filteredSuggestions.map((suggestion) => (
          <Tooltip key={suggestion.categoryId}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'rounded-full gap-1.5 h-7 px-3 text-xs',
                  getConfidenceColor(suggestion.confidence)
                )}
                onClick={() => applyMutation.mutate(suggestion.categoryId)}
                disabled={applyMutation.isPending}
                aria-pressed={applyMutation.isPending}
              >
                {applyMutation.isPending && applyMutation.variables === suggestion.categoryId && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                <span>{suggestion.categoryName}</span>
                <span className="text-[10px] opacity-70">
                  {Math.round(suggestion.confidence * 100)}%
                </span>
              </Button>
            </TooltipTrigger>
            {suggestion.reason && (
              <TooltipContent>
                <p className="text-xs">{suggestion.reason}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
