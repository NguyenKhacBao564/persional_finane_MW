import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createTransaction } from '@/api/transactions';
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

/**
 * Mock categories for now - replace with actual API call
 */
const MOCK_CATEGORIES = [
  { id: 'cat_food', name: 'Food', color: '#F97316' },
  { id: 'cat_transport', name: 'Transport', color: '#3B82F6' },
  { id: 'cat_shopping', name: 'Shopping', color: '#EC4899' },
  { id: 'cat_bills', name: 'Bills', color: '#8B5CF6' },
  { id: 'cat_salary', name: 'Salary', color: '#10B981' },
  { id: 'cat_other', name: 'Other', color: '#6B7280' },
];

/**
 * Mock accounts for now - replace with actual API call
 */
const MOCK_ACCOUNTS = [
  { id: 'acc_cash', name: 'Cash' },
  { id: 'acc_bank', name: 'Bank Account' },
  { id: 'acc_card', name: 'Credit Card' },
];

/**
 * CreateTransactionDialog - Dialog wrapper for creating new transactions.
 * Uses TanStack Query mutation with cache invalidation on success.
 */
export function CreateTransactionDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      // Invalidate transactions query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction created successfully');
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create transaction');
    },
  });

  const handleSubmit = async (values: TransactionCreateInput) => {
    await createMutation.mutateAsync(values);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
          <DialogDescription>
            Add a new transaction to your financial records.
          </DialogDescription>
        </DialogHeader>
        <TransactionForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createMutation.isPending}
          categories={MOCK_CATEGORIES}
          accounts={MOCK_ACCOUNTS}
        />
      </DialogContent>
    </Dialog>
  );
}
