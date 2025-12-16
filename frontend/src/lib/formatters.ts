import { format, isValid, parseISO } from 'date-fns';
import type { TxType } from '@/types/transactions';

type DateInput = string | number | Date | undefined;

export function formatCurrency(amount: number, currency: string): string {
  const absAmount = Math.abs(amount);
  
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absAmount) + ' ₫';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(absAmount / 100);
}

export function formatDate(input?: DateInput, fmt: string = 'dd/MM/yyyy'): string {
  if (input === undefined || input === null || input === '') {
    return '-';
  }

  const date =
    typeof input === 'string'
      ? /\d{4}-\d{2}-\d{2}/.test(input)
        ? parseISO(input)
        : new Date(input)
      : new Date(input);

  if (!isValid(date)) {
    return '-';
  }

  return format(date, fmt);
}

export function resolveTxDate(
  source?: Partial<Record<'txDate' | 'occurredAt' | 'date', DateInput>> | null
): DateInput {
  if (!source) {
    return undefined;
  }

  return source.txDate ?? source.occurredAt ?? source.date;
}

export function badgeByType(type: TxType): {
  label: string;
  className: string;
} {
  switch (type) {
    case 'IN':
      return {
        label: 'Income',
        className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      };
    case 'OUT':
      return {
        label: 'Expense',
        className: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
      };
    default:
      return {
        label: 'Unknown',
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      };
  }
}
