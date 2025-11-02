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

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <Table aria-label="Transactions">
      <TableHeader>
        <TableRow>
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

          return (
            <TableRow key={tx.id} className="h-12">
              <TableCell className="font-medium">
                {formatDate(tx.txDate)}
              </TableCell>
              <TableCell>
                <Badge className={typeBadge.className}>{typeBadge.label}</Badge>
              </TableCell>
              <TableCell>
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
                  <span className="text-muted-foreground">—</span>
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
