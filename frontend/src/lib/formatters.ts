import type { TxType } from '@/types/transactions';

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

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function badgeByType(type: TxType): {
  label: string;
  className: string;
} {
  switch (type) {
    case 'INCOME':
      return {
        label: 'Income',
        className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      };
    case 'EXPENSE':
      return {
        label: 'Expense',
        className: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
      };
    case 'TRANSFER':
      return {
        label: 'Transfer',
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      };
  }
}
