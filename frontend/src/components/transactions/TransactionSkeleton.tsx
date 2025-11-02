import { Skeleton } from '@/ui/skeleton';
import { TableRow, TableCell } from '@/ui/table';

interface TransactionSkeletonProps {
  rows?: number;
}

export function TransactionSkeleton({ rows = 10 }: TransactionSkeletonProps) {
  return (
    <>
      {/* Desktop skeleton */}
      <div className="hidden md:block">
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
          </TableRow>
        ))}
      </div>

      {/* Mobile skeleton */}
      <div className="md:hidden space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
