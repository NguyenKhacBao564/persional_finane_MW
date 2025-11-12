import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import type { TxType, TxFilters } from '@/types/transactions';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';
import { Separator } from '@/ui/separator';

interface TransactionFilterBarProps {
  value: TxFilters;
  onChange: (filters: TxFilters) => void;
  disabled?: boolean;
}

const CATEGORIES = [
  { id: 'cat_food', name: 'Food', color: '#F97316' },
  { id: 'cat_transport', name: 'Transport', color: '#3B82F6' },
  { id: 'cat_shopping', name: 'Shopping', color: '#EC4899' },
  { id: 'cat_bills', name: 'Bills', color: '#8B5CF6' },
  { id: 'cat_salary', name: 'Salary', color: '#10B981' },
  { id: 'cat_other', name: 'Other', color: '#6B7280' },
];

export function TransactionFilterBar({
  value,
  onChange,
  disabled = false,
}: TransactionFilterBarProps) {
  const [searchInput, setSearchInput] = useState(value.search || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== value.search) {
        onChange({ ...value, search: searchInput, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const hasFilters = useMemo(() => {
    return !!(
      value.search ||
      value.type ||
      value.category ||
      value.min ||
      value.max ||
      value.start ||
      value.end
    );
  }, [value]);

  const handleReset = () => {
    setSearchInput('');
    onChange({
      page: 1,
      limit: value.limit || 10,
      sort: value.sort || 'txDate:desc',
    });
  };

  return (
    <div className="sticky top-16 z-10 bg-card rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Search note, category, account..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={disabled}
            className="w-full"
            aria-controls="transactions-table"
          />
        </div>

        <Separator />

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Type */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Type
            </label>
            <Select
              value={value.type || 'all'}
              onValueChange={(val) =>
                onChange({
                  ...value,
                  type: val === 'all' ? undefined : (val as TxType),
                  page: 1,
                })
              }
              disabled={disabled}
            >
              <SelectTrigger aria-label="Transaction type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="IN">Income</SelectItem>
                <SelectItem value="OUT">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Category
            </label>
            <Select
              value={value.category || 'all'}
              onValueChange={(val) =>
                onChange({
                  ...value,
                  category: val === 'all' ? undefined : val,
                  page: 1,
                })
              }
              disabled={disabled}
            >
              <SelectTrigger aria-label="Category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Sort by
            </label>
            <Select
              value={value.sort || 'txDate:desc'}
              onValueChange={(val) =>
                onChange({ ...value, sort: val, page: 1 })
              }
              disabled={disabled}
            >
              <SelectTrigger aria-label="Sort order">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="txDate:desc">Newest</SelectItem>
                <SelectItem value="txDate:asc">Oldest</SelectItem>
                <SelectItem value="amount:desc">Amount ↑</SelectItem>
                <SelectItem value="amount:asc">Amount ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Range */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Amount (VND)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={value.min || ''}
                onChange={(e) =>
                  onChange({
                    ...value,
                    min: e.target.value ? Number(e.target.value) : undefined,
                    page: 1,
                  })
                }
                disabled={disabled}
                className="w-full"
                min="0"
              />
              <span className="text-xs text-muted-foreground">–</span>
              <Input
                type="number"
                placeholder="Max"
                value={value.max || ''}
                onChange={(e) =>
                  onChange({
                    ...value,
                    max: e.target.value ? Number(e.target.value) : undefined,
                    page: 1,
                  })
                }
                disabled={disabled}
                className="w-full"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Start Date
            </label>
            <Input
              type="date"
              value={value.start || ''}
              onChange={(e) =>
                onChange({ ...value, start: e.target.value || undefined, page: 1 })
              }
              disabled={disabled}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              End Date
            </label>
            <Input
              type="date"
              value={value.end || ''}
              onChange={(e) =>
                onChange({ ...value, end: e.target.value || undefined, page: 1 })
              }
              disabled={disabled}
            />
          </div>
        </div>

        {/* Reset Button */}
        {hasFilters && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={disabled}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Reset filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
