import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';
import { GoalForm } from './GoalForm';
import { createGoal, updateGoal } from '@/api/budgets';
import type { SavingGoal } from '@/types/budgets';
import type { GoalCreateSchema, GoalUpdateSchema } from '@/schemas/budget';

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<SavingGoal>;
}

/**
 * GoalFormDialog - Dialog wrapper for saving goal creation/editing
 * 
 * Features:
 * - Automatic mode detection (create vs edit)
 * - Success/error toast notifications
 * - Query invalidation on success
 * - Keyboard accessible (Esc to close)
 * - Focus trap within dialog
 */
export function GoalFormDialog({
  open,
  onOpenChange,
  initial,
}: GoalFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!initial?.goalId;

  // Create goal mutation
  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      toast.success('Saving goal created successfully');
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create goal');
    },
  });

  // Update goal mutation
  const updateMutation = useMutation({
    mutationFn: updateGoal,
    onSuccess: () => {
      toast.success('Saving goal updated successfully');
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update goal');
    },
  });

  const handleSubmit = async (values: GoalCreateSchema | GoalUpdateSchema) => {
    if (isEdit && 'goalId' in values) {
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
          <DialogTitle>
            {isEdit ? 'Edit Saving Goal' : 'Create New Saving Goal'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update your saving goal details and target'
              : 'Set up a new saving goal to track your progress'}
          </DialogDescription>
        </DialogHeader>

        <GoalForm
          mode={isEdit ? 'edit' : 'create'}
          initial={initial}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
