import type { Transaction } from '@/types/transactions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table';
import { Badge } from '@/ui/badge';
import { formatCurrency, formatDate, badgeByType } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { EditTransactionDialog } from './EditTransactionDialog';
import { CategorySuggestChips } from './CategorySuggestChips';

interface TransactionTableProps {
  transactions: Transaction[];
  selection?: string[];
  onSelectionChange?: (selected: string[]) => void;
}

export function TransactionTable({
  transactions,
  selection = [],
  onSelectionChange,
}: TransactionTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(transactions.map((tx) => tx.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (txId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selection, txId]);
    } else {
      onSelectionChange(selection.filter((id) => id !== txId));
    }
  };

  const allSelected = transactions.length > 0 && selection.length === transactions.length;
  const someSelected = selection.length > 0 && !allSelected;

  return (
    <Table aria-label="Transactions">
      <TableHeader>
        <TableRow>
          {onSelectionChange && (
            <TableHead className="w-[40px]">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-input"
                aria-label="Select all transactions"
              />
            </TableHead>
          )}
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Note</TableHead>
          <TableHead>Account</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="w-[80px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => {
          const typeBadge = badgeByType(tx.type);
          const isNegative = tx.amount < 0;

          const isSelected = selection.includes(tx.id);

          return (
            <TableRow key={tx.id} className="h-12">
              {onSelectionChange && (
                <TableCell>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectRow(tx.id, e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                    aria-label={`Select transaction ${tx.id}`}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">
                {formatDate(tx.txDate)}
              </TableCell>
              <TableCell>
                <Badge className={typeBadge.className}>{typeBadge.label}</Badge>
              </TableCell>
              <TableCell className="min-w-[200px]">
                {tx.category ? (
                  <div className="flex items-center gap-2">
                    {tx.category.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tx.category.color }}
                      />
                    )}
                    <span>{tx.category.name}</span>
                  </div>
                ) : (
                  <div className="py-1">
                    <CategorySuggestChips
                      txId={tx.id}
                      note={tx.note || null}
                      amount={tx.amount}
                      currentCategoryId={null}
                      variant="inline"
                      size="sm"
                      max={2}
                    />
                  </div>
                )}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {tx.note || (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {tx.account?.name || (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell
                className={cn(
                  'text-right font-semibold',
                  isNegative
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                )}
              >
                {isNegative ? '−' : '+'} {formatCurrency(tx.amount, tx.currency)}
              </TableCell>
              <TableCell>
                <EditTransactionDialog transaction={tx} variant="icon" />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
