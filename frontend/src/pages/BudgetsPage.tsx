import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { listBudgets, upsertBudget, updateBudgetLimit, deleteBudgetById } from '@/api/budgets';
import { fetchCategories, type Category } from '@/api/categories';
import type { UpdateBudgetLimitInput } from '@/api/budgets';
import { budgetFormSchema } from '@/schemas/budget';
import type { BudgetFormOutput } from '@/schemas/budget';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';
import { formatCurrency } from '@/lib/formatters';

function BudgetsPage() {
  const [currentMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<{ id: string; limit: number } | null>(null);

  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      categoryId: '',
      month: currentMonth,
      limit: 0,
    },
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets', currentMonth],
    queryFn: () => listBudgets({ month: currentMonth }),
  });

  const isLoading = categoriesLoading || budgetsLoading;

  const upsertMutation = useMutation({
    mutationFn: (data: BudgetFormOutput) => upsertBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget saved successfully');
      setCreateDialogOpen(false);
      form.reset({ categoryId: '', month: currentMonth, limit: 0 });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save budget');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBudgetLimitInput }) =>
      updateBudgetLimit(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget updated successfully');
      setEditDialogOpen(false);
      setSelectedBudget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update budget');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBudgetById,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete budget');
    },
  });

  const handleCreateSubmit = (data: BudgetFormOutput) => {
    upsertMutation.mutate(data);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBudget) {
      updateMutation.mutate({
        id: selectedBudget.id,
        input: { limit: selectedBudget.limit },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Manage your monthly spending limits by category
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budgets for {currentMonth}</CardTitle>
          <CardDescription>
            Set spending limits for each category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : !data?.items || data.items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No budgets yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first budget to start tracking spending
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Limit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {budget.categoryColor && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: budget.categoryColor }}
                          />
                        )}
                        {budget.categoryName}
                      </div>
                    </TableCell>
                    <TableCell>{budget.month}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(budget.limit, 'VND')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBudget({ id: budget.id, limit: budget.limit });
                            setEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this budget?')) {
                              deleteMutation.mutate(budget.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Budget</DialogTitle>
            <DialogDescription>
              Set a spending limit for a category
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.watch('categoryId')}
                onValueChange={(value) => form.setValue('categoryId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No categories available
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          {cat.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                          )}
                          <span>{cat.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.categoryId && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.categoryId.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="month">Month (YYYY-MM)</Label>
              <Input
                id="month"
                type="month"
                {...form.register('month')}
              />
              {form.formState.errors.month && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.month.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="limit">Limit (VND)</Label>
              <Input
                id="limit"
                type="number"
                {...form.register('limit', { valueAsNumber: true })}
                placeholder="5000000"
              />
              {form.formState.errors.limit && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.limit.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? 'Saving...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget Limit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-limit">Limit (VND)</Label>
              <Input
                id="edit-limit"
                type="number"
                value={selectedBudget?.limit || ''}
                onChange={(e) =>
                  setSelectedBudget((prev) =>
                    prev ? { ...prev, limit: Number(e.target.value) } : null
                  )
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedBudget(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BudgetsPage;
