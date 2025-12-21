import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/ui/skeleton';
import type { SpendingByCategoryItem } from '@/api/insights';

interface SpendingPieChartProps {
  data?: SpendingByCategoryItem[];
  isLoading: boolean;
}

// Professional pastel palette
const PASTEL_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: data.fill }}
          />
          <span className="font-medium text-sm text-foreground">{data.categoryName}</span>
        </div>
        <div className="text-lg font-bold tabular-nums">
          {formatCurrency(data.totalAmount, 'VND')}
        </div>
      </div>
    );
  }
  return null;
};

export function SpendingPieChart({ data, isLoading }: SpendingPieChartProps) {
  // Calculate total expense
  const totalExpense = data?.reduce((acc, item) => acc + item.totalAmount, 0) || 0;

  if (isLoading) {
    return (
      <Card className="col-span-1 border-gray-100 shadow-sm rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-foreground">
            Spending Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <Skeleton className="h-[250px] w-[250px] rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="col-span-1 border-gray-100 shadow-sm rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-foreground">
            Spending Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground text-sm">
          No spending data available
        </CardContent>
      </Card>
    );
  }

  // Sort data by amount desc
  const sortedData = [...data].sort((a, b) => b.totalAmount - a.totalAmount);

  return (
    <Card className="col-span-1 border-gray-100 shadow-sm rounded-xl bg-white dark:bg-zinc-950">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">
          Spending Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] flex flex-col md:flex-row items-center gap-4">
        {/* Chart Section */}
        <div className="relative h-[250px] w-[250px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sortedData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                cornerRadius={5}
                paddingAngle={2}
                dataKey="totalAmount"
                nameKey="categoryName"
                stroke="none"
              >
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.categoryColor || PASTEL_COLORS[index % PASTEL_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Total
            </span>
            <span className="text-lg font-bold text-foreground tabular-nums">
              {new Intl.NumberFormat('vi-VN', { notation: "compact", compactDisplay: "short" }).format(totalExpense)}
            </span>
          </div>
        </div>

        {/* Custom Legend Section */}
        <div className="flex-1 w-full overflow-y-auto max-h-[250px] pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          <div className="flex flex-col gap-3">
            {sortedData.map((item, index) => {
              const percent = totalExpense > 0 ? (item.totalAmount / totalExpense) * 100 : 0;
              const color = item.categoryColor || PASTEL_COLORS[index % PASTEL_COLORS.length];
              
              return (
                <div key={item.categoryId} className="flex items-center justify-between text-sm group">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0 ring-2 ring-opacity-20 transition-all group-hover:ring-4"
                      style={{ backgroundColor: color, ringColor: color }}
                    />
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]" title={item.categoryName}>
                      {item.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-gray-500 font-medium tabular-nums text-xs">
                      {percent.toFixed(1)}%
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                      {new Intl.NumberFormat('vi-VN', { notation: "compact", compactDisplay: "short" }).format(item.totalAmount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
