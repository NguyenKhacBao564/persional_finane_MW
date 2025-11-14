import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { BudgetForm } from '@/components/budgets/BudgetForm';
import { createBudget, updateBudget } from '@/api/budgets';
import { toast } from 'sonner';
import type { BudgetCreateSchema, BudgetUpdateSchema } from '@/schemas/budget';

function BudgetFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const createMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget created successfully');
      navigate('/budgets');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create budget');
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget updated successfully');
      navigate('/budgets');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update budget');
    },
  });

  const handleSubmit = async (values: BudgetCreateSchema | BudgetUpdateSchema) => {
    if (isEdit && id) {
      await updateMutation.mutateAsync({ budgetId: id, ...values } as any);
    } else {
      await createMutation.mutateAsync(values as BudgetCreateSchema);
    }
  };

  const handleCancel = () => {
    navigate('/budgets');
  };

  return (
    <div className="max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate('/budgets')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Budgets
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Budget' : 'Create Budget'}</CardTitle>
          <CardDescription>
            {isEdit
              ? 'Update your budget allocation and period'
              : 'Set spending limits for specific categories'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BudgetForm
            mode={isEdit ? 'edit' : 'create'}
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default BudgetFormPage;
