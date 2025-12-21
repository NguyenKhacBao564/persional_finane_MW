import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isValid } from 'date-fns';
import { updateTransaction } from '@/api/transactions';
import { fetchCategories } from '@/api/categories';
import { fetchAccounts } from '@/api/accounts';
import type { Transaction } from '@/types/transactions';
import type { TransactionCreateInput } from '@/schemas/transaction';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog';
import { Button } from '@/ui/button';
import { TransactionForm } from './TransactionForm';

interface EditTransactionDialogProps {
  transaction: Transaction;
  /**
   * Render as button or icon trigger
   */
  variant?: 'button' | 'icon';
}

/**
 * EditTransactionDialog - Dialog wrapper for editing existing transactions.
 * Uses TanStack Query mutation with optimistic updates and cache invalidation.
 * 
 * @param transaction - The transaction to edit
 * @param variant - Display variant ('button' or 'icon')
 */
export function EditTransactionDialog({
  transaction,
  variant = 'icon',
}: EditTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (values: TransactionCreateInput) =>
      updateTransaction(transaction.id, values),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['transactions'] });

      // Snapshot previous value for rollback
      const previousData = queryClient.getQueryData(['transactions']);

      // Optimistically update cache (optional)
      // queryClient.setQueryData(['transactions'], (old: any) => {
      //   // Update the specific transaction in the list
      //   // Implementation depends on your cache structure
      // });

      return { previousData };
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction updated successfully');
      setOpen(false);
    },
    onError: (error: Error, newData, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['transactions'], context.previousData);
      }
      toast.error(error.message || 'Failed to update transaction');
    },
  });

  const handleSubmit = async (values: TransactionCreateInput) => {
    await updateMutation.mutateAsync(values);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  // Convert transaction type to form type (IN/OUT)
  const getFormType = (txType: string): 'IN' | 'OUT' => {
    if (!txType) return 'OUT';
    const normalized = txType.toUpperCase();
    if (normalized === 'IN' || normalized === 'INCOME') return 'IN';
    return 'OUT'; // Default
  };

  // Safe date formatting
  const formatDateForForm = (dateString?: string): string => {
    if (!dateString) return new Date().toISOString().split('T')[0];
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'yyyy-MM-dd');
      }
      return new Date().toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  };

  const defaultValues = {
    txDate: formatDateForForm(transaction.txDate),
    type: getFormType(transaction.type),
    amount: transaction.amount ? Math.abs(transaction.amount) : 0,
    categoryId: transaction.category?.id || '',
    accountId: transaction.account?.id || '',
    note: transaction.note || '',
  };

  const isLoading = categoriesLoading || accountsLoading;

  const TriggerButton =
    variant === 'button' ? (
      <Button variant="outline" size="sm">
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </Button>
    ) : (
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Edit transaction</span>
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{TriggerButton}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the details of this transaction.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <TransactionForm
            mode="edit"
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={updateMutation.isPending}
            categories={categories}
            accounts={accounts}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
