import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Skeleton } from '@/ui/skeleton';
import type { TrendItem } from '@/api/insights';

interface CashFlowBarChartProps {
  data?: TrendItem[];
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          {formatDate(label, 'dd MMM, yyyy')}
        </p>
        <div className="flex flex-col gap-1">
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center gap-2 text-sm">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="w-16 font-medium text-muted-foreground">
                {entry.name}:
              </span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(entry.value, 'VND')}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function CashFlowBarChart({ data, isLoading }: CashFlowBarChartProps) {
  if (isLoading) {
    return (
      <Card className="col-span-1 border-gray-100 shadow-sm rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-foreground">
            Cash Flow Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="col-span-1 border-gray-100 shadow-sm rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-foreground">
            Cash Flow Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
          No trend data available for this period
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 border-gray-100 shadow-sm rounded-xl bg-white dark:bg-zinc-950">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">
          Cash Flow Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              className="dark:stroke-zinc-800"
            />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatDate(value, 'dd/MM')}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              dy={10}
              minTickGap={30}
            />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorIncome)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="Expense"
              stroke="#f43f5e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorExpense)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
