import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parse, isValid } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import {
  transactionCreateSchema,
  transactionEditFormSchema,
  type TransactionCreateInput,
  type TransactionEditFormInput,
  type TransactionUpdateInput,
} from '@/schemas/transaction';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { Calendar } from '@/ui/calendar';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';
import { Textarea } from '@/ui/textarea';
import { Separator } from '@/ui/separator';
import { AmountInput } from './AmountInput';

/**
 * Transaction form props.
 */
interface TransactionFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<TransactionCreateInput & { id?: string }>;
  onSubmit: (values: TransactionCreateInput | TransactionEditFormInput) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  categories?: Array<{ id: string; name: string; color?: string }>;
  accounts?: Array<{ id: string; name: string }>;
}

/**
 * TransactionForm - Pure form component for creating and editing transactions.
 * Uses react-hook-form with Zod validation.
 * 
 * @param mode - 'create' or 'edit' determines validation schema
 * @param defaultValues - Initial form values for editing
 * @param onSubmit - Form submission handler
 * @param onCancel - Cancel handler
 * @param isSubmitting - Loading state for submit button
 * @param categories - Available categories for selection
 * @param accounts - Available accounts for selection
 */
export function TransactionForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  categories = [],
  accounts = [],
}: TransactionFormProps) {
  const schema = mode === 'create' ? transactionCreateSchema : transactionEditFormSchema;
  
  const form = useForm<TransactionCreateInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      txDate: defaultValues?.txDate || new Date().toISOString().split('T')[0],
      type: defaultValues?.type || 'OUT',
      amount: defaultValues?.amount || 0,
      categoryId: defaultValues?.categoryId || '',
      accountId: defaultValues?.accountId || '',
      note: defaultValues?.note || '',
    },
  });

  const handleSubmit = async (values: TransactionCreateInput | TransactionEditFormInput) => {
    await onSubmit(values);
  };

  const noteLength = form.watch('note')?.length || 0;

  // Helper to safely parse date for display/calendar
  const safeParseDate = (dateString: string | undefined): Date | undefined => {
    if (!dateString) return undefined;
    
    // Try parsing as yyyy-MM-dd first
    let date = parse(dateString, 'yyyy-MM-dd', new Date());
    if (isValid(date)) return date;

    // Try parsing as standard Date (e.g. ISO string)
    date = new Date(dateString);
    if (isValid(date)) return date;

    return undefined;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Date and Type Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date Picker */}
          <FormField
            control={form.control}
            name="txDate"
            render={({ field }) => {
              const dateValue = safeParseDate(field.value);
              return (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {dateValue ? (
                            format(dateValue, 'dd/MM/yyyy')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateValue}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(format(date, 'yyyy-MM-dd'));
                          }
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* Type Select */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="IN">
                      <span className="flex items-center gap-2">
                        <span className="text-green-600 font-semibold">+</span>
                        Income
                      </span>
                    </SelectItem>
                    <SelectItem value="OUT">
                      <span className="flex items-center gap-2">
                        <span className="text-red-600 font-semibold">−</span>
                        Expense
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <AmountInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={isSubmitting}
                  placeholder="Enter amount"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category and Account Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category Select */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No categories available
                      </div>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            {category.color && (
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                            )}
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Account Select */}
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No accounts available
                      </div>
                    ) : (
                      accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Note */}
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add a note (optional)"
                  className="resize-none"
                  disabled={isSubmitting}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription className="flex justify-between">
                <span>Optional description for this transaction</span>
                <span className="text-xs">{noteLength}/300</span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
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
            {mode === 'create' ? 'Create' : 'Save'} Transaction
          </Button>
        </div>
      </form>
    </Form>
  );
}
