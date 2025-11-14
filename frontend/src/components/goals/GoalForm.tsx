import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2, Info } from 'lucide-react';
import { format, parse, differenceInMonths } from 'date-fns';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/form';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Calendar } from '@/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { Textarea } from '@/ui/textarea';
import { Alert, AlertDescription } from '@/ui/alert';
import { AmountInput } from '../transactions/AmountInput';
import {
  goalCreateSchema,
  goalUpdateSchema,
  type GoalCreateSchema,
  type GoalUpdateSchema,
} from '@/schemas/budget';
import type { SavingGoal } from '@/types/budgets';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface GoalFormProps {
  mode: 'create' | 'edit';
  initial?: Partial<SavingGoal>;
  onSubmit: (values: GoalCreateSchema | GoalUpdateSchema) => Promise<void>;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

/**
 * GoalForm - Create/Edit saving goal with validation
 * 
 * Features:
 * - Goal name input
 * - Target amount with VND formatting
 * - Target date picker (must be in future)
 * - Optional notes field
 * - Monthly savings calculator hint
 * - Zod validation with React Hook Form
 * - Accessible keyboard navigation
 */
export function GoalForm({
  mode,
  initial,
  onSubmit,
  isSubmitting = false,
  onCancel,
}: GoalFormProps) {
  const isEdit = mode === 'edit';

  const form = useForm<GoalCreateSchema | GoalUpdateSchema>({
    resolver: zodResolver(isEdit ? goalUpdateSchema : goalCreateSchema),
    defaultValues: {
      ...(isEdit && initial?.goalId ? { goalId: initial.goalId } : {}),
      name: initial?.name || '',
      targetAmount: initial?.targetAmount || 0,
      targetDate: initial?.targetDate || '',
      notes: initial?.notes || '',
    },
  });

  const handleSubmit = async (values: GoalCreateSchema | GoalUpdateSchema) => {
    await onSubmit(values);
  };

  // Calculate monthly savings needed
  const watchTargetAmount = form.watch('targetAmount');
  const watchTargetDate = form.watch('targetDate');
  const currentSaved = initial?.currentSaved || 0;

  const getMonthlySavingsHint = (): string | null => {
    if (!watchTargetDate || !watchTargetAmount || watchTargetAmount <= 0) {
      return null;
    }

    try {
      const targetDate = parse(watchTargetDate, 'yyyy-MM-dd', new Date());
      const today = new Date();
      const monthsRemaining = differenceInMonths(targetDate, today);

      if (monthsRemaining <= 0) {
        return null;
      }

      const amountNeeded = watchTargetAmount - currentSaved;
      if (amountNeeded <= 0) {
        return 'Goal already achieved!';
      }

      const monthlyAmount = Math.ceil(amountNeeded / monthsRemaining);
      return `≈ ${formatCurrency(monthlyAmount, 'VND')} per month for ${monthsRemaining} months`;
    } catch {
      return null;
    }
  };

  const savingsHint = getMonthlySavingsHint();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Goal Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Emergency Fund, Vacation, New Car"
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </FormControl>
              <FormDescription>
                Give your saving goal a meaningful name (2-60 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Target Amount */}
        <FormField
          control={form.control}
          name="targetAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Amount</FormLabel>
              <FormControl>
                <AmountInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={isSubmitting}
                  placeholder="Enter target amount"
                />
              </FormControl>
              <FormDescription>
                How much do you want to save for this goal?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Target Date */}
        <FormField
          control={form.control}
          name="targetDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Target Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                      disabled={isSubmitting}
                    >
                      {field.value ? (
                        format(
                          parse(field.value, 'yyyy-MM-dd', new Date()),
                          'dd/MM/yyyy'
                        )
                      ) : (
                        <span>Pick target date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      field.value
                        ? parse(field.value, 'yyyy-MM-dd', new Date())
                        : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        field.onChange(format(date, 'yyyy-MM-dd'));
                      }
                    }}
                    disabled={(date) => date <= new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                When do you want to achieve this goal?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Monthly Savings Hint */}
        {savingsHint && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {savingsHint}
            </AlertDescription>
          </Alert>
        )}

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any notes about this goal..."
                  className="resize-none"
                  disabled={isSubmitting}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Max 300 characters ({(field.value?.length || 0)}/300)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Update Goal' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
