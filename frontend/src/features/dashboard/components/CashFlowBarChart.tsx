import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Skeleton } from '@/ui/skeleton';
import type { TrendItem } from '@/api/insights';

interface CashFlowBarChartProps {
  data?: TrendItem[];
  isLoading: boolean;
}

export function CashFlowBarChart({ data, isLoading }: CashFlowBarChartProps) {
  if (isLoading) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Cash Flow Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Cash Flow Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No trend data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Cash Flow Trends</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => formatDate(value, 'dd/MM')} 
            />
            <YAxis 
              tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: "compact", compactDisplay: "short" }).format(value)} 
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value, 'VND')}
              labelFormatter={(label) => formatDate(label, 'dd/MM/yyyy')}
            />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#10b981" /> {/* emerald-500 */}
            <Bar dataKey="expense" name="Expense" fill="#f43f5e" /> {/* rose-500 */}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
