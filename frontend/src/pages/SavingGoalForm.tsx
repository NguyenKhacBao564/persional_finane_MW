import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { GoalForm } from '@/components/goals/GoalForm';
import { createGoal } from '@/api/budgets';
import { toast } from 'sonner';
import type { GoalCreateSchema } from '@/schemas/budget';

function SavingGoalFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Saving goal created successfully');
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create goal');
    },
  });

  const handleSubmit = async (values: GoalCreateSchema) => {
    await createMutation.mutateAsync(values);
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate('/dashboard')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create Saving Goal</CardTitle>
          <CardDescription>
            Set a financial target and track your progress toward achieving it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoalForm
            mode="create"
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default SavingGoalFormPage;
