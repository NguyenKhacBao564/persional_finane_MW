import type { Transaction } from '@/types/transactions';
import { Badge } from '@/ui/badge';
import { formatCurrency, formatDate, badgeByType, resolveTxDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { EditTransactionDialog } from './EditTransactionDialog';

interface TransactionCardItemProps {
  transaction: Transaction;
}

export function TransactionCardItem({ transaction: tx }: TransactionCardItemProps) {
  const typeBadge = badgeByType(tx.type);
  const isNegative = tx.amount < 0;

  return (
    <div className="p-4 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-card transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-1">
            {formatDate(resolveTxDate(tx))}
          </div>
          <Badge className={typeBadge.className}>{typeBadge.label}</Badge>
        </div>
        <div className="flex items-start gap-2">
          <div
            className={cn(
              'text-xl font-bold',
              isNegative
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            )}
          >
            {isNegative ? '−' : '+'} {formatCurrency(tx.amount, tx.currency)}
          </div>
          <EditTransactionDialog transaction={tx} variant="icon" />
        </div>
      </div>

      <div className="space-y-1">
        {tx.category && (
          <div className="flex items-center gap-2 text-sm">
            {tx.category.color && (
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: tx.category.color }}
              />
            )}
            <span className="font-medium">{tx.category.name}</span>
          </div>
        )}

        {tx.note && (
          <div className="text-sm text-muted-foreground truncate">{tx.note}</div>
        )}

        {tx.account && (
          <div className="text-xs text-muted-foreground">
            {tx.account.name}
          </div>
        )}
      </div>
    </div>
  );
}
