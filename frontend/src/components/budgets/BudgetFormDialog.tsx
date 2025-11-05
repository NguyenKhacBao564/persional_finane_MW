import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';
import { BudgetForm } from './BudgetForm';
import { createBudget, updateBudget } from '@/api/budgets';
import type { BudgetItem } from '@/types/budgets';
import type { BudgetCreateSchema, BudgetUpdateSchema } from '@/schemas/budget';

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<BudgetItem>;
  defaultPeriod?: 'MONTHLY' | 'WEEKLY' | 'ANNUAL';
  defaultDates?: { start: string; end: string };
}

/**
 * BudgetFormDialog - Dialog wrapper for budget creation/editing
 * 
 * Features:
 * - Automatic mode detection (create vs edit)
 * - Success/error toast notifications
 * - Query invalidation on success
 * - Keyboard accessible (Esc to close)
 * - Focus trap within dialog
 */
export function BudgetFormDialog({
  open,
  onOpenChange,
  initial,
  defaultPeriod,
  defaultDates,
}: BudgetFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!initial?.budgetId;

  // Merge defaults with initial values
  const initialValues = {
    ...initial,
    ...(defaultPeriod && !initial?.period ? { period: defaultPeriod } : {}),
    ...(defaultDates && !initial?.start ? defaultDates : {}),
  };

  // Create budget mutation
  const createMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      toast.success('Budget created successfully');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create budget');
    },
  });

  // Update budget mutation
  const updateMutation = useMutation({
    mutationFn: updateBudget,
    onSuccess: () => {
      toast.success('Budget updated successfully');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update budget');
    },
  });

  const handleSubmit = async (
    values: BudgetCreateSchema | BudgetUpdateSchema
  ) => {
    if (isEdit && 'budgetId' in values) {
      await updateMutation.mutateAsync(values);
    } else {
      await createMutation.mutateAsync(values);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Budget' : 'Create New Budget'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details of your budget allocation'
              : 'Set up a new budget to track your spending'}
          </DialogDescription>
        </DialogHeader>

        <BudgetForm
          mode={isEdit ? 'edit' : 'create'}
          initial={initialValues}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
