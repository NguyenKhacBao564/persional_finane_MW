import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, parse } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';
import { Textarea } from '@/ui/textarea';
import { AmountInput } from '../transactions/AmountInput';
import { fetchCategories } from '@/api/categories';
import {
  budgetCreateSchema,
  budgetUpdateSchema,
  type BudgetCreateSchema,
  type BudgetUpdateSchema,
} from '@/schemas/budget';
import type { BudgetItem, BudgetPeriod } from '@/types/budgets';
import { cn } from '@/lib/utils';

interface BudgetFormProps {
  mode: 'create' | 'edit';
  initial?: Partial<BudgetItem>;
  onSubmit: (values: BudgetCreateSchema | BudgetUpdateSchema) => Promise<void>;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

/**
 * BudgetForm - Create/Edit budget with full validation
 * 
 * Features:
 * - Category selection dropdown
 * - Period selection (MONTHLY/WEEKLY/ANNUAL)
 * - Start/End date pickers
 * - Amount input with VND formatting
 * - Optional notes field
 * - Zod validation with React Hook Form
 * - Accessible keyboard navigation
 */
export function BudgetForm({
  mode,
  initial,
  onSubmit,
  isSubmitting = false,
  onCancel,
}: BudgetFormProps) {
  const isEdit = mode === 'edit';

  // Fetch categories for dropdown
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const form = useForm<BudgetCreateSchema | BudgetUpdateSchema>({
    resolver: zodResolver(isEdit ? budgetUpdateSchema : budgetCreateSchema),
    defaultValues: {
      ...(isEdit && initial?.budgetId ? { budgetId: initial.budgetId } : {}),
      categoryId: initial?.categoryId || '',
      period: initial?.period || 'MONTHLY',
      allocated: initial?.allocated || 0,
      start: initial?.start || new Date().toISOString().split('T')[0],
      end: initial?.end || new Date().toISOString().split('T')[0],
      notes: initial?.notes || '',
    },
  });

  const handleSubmit = async (values: BudgetCreateSchema | BudgetUpdateSchema) => {
    await onSubmit(values);
  };

  const periodOptions: { value: BudgetPeriod; label: string }[] = [
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'ANNUAL', label: 'Annual' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Category Selection */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting || loadingCategories}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingCategories ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Loading categories...
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No categories available
                    </div>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Period Selection */}
        <FormField
          control={form.control}
          name="period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Period</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Date */}
          <FormField
            control={form.control}
            name="start"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
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
                          <span>Pick start date</span>
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
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End Date */}
          <FormField
            control={form.control}
            name="end"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
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
                          <span>Pick end date</span>
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
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Allocated Amount */}
        <FormField
          control={form.control}
          name="allocated"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allocated Amount</FormLabel>
              <FormControl>
                <AmountInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={isSubmitting}
                  placeholder="Enter amount"
                />
              </FormControl>
              <FormDescription>
                Total amount allocated for this budget period
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any notes about this budget..."
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
            {isEdit ? 'Update Budget' : 'Create Budget'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
