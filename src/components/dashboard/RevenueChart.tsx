import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ChartType } from './ChartTypeSelector';

interface ChartDataPoint {
  month: string;
  revenue: number;
  target: number;
  customers: number;
  date: Date;
}

interface ChartProps {
  variant: ChartType;
  title: string;
  className?: string;
  data: ChartDataPoint[];
  isLoading?: boolean;
  metric?: 'revenue' | 'customers';
}

export function RevenueChart({ variant, title, className, data, isLoading, metric = 'revenue' }: ChartProps) {
  // ... (loading/empty states same) ...

  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--revenue))',
    'hsl(var(--warning))',
    'hsl(var(--info))',
    'hsl(var(--secondary))'
  ];

  const renderChart = () => {
    switch (variant) {
      case 'line':
        return (
          <LineChart data={data}>
            <XAxis
              dataKey="month"
              className="text-muted-foreground"
              fontSize={12}
              minTickGap={30}
            />
            <YAxis
              className="text-muted-foreground"
              fontSize={12}
              tickFormatter={(value) => metric === 'revenue' ? `$${(value / 1000).toFixed(0)}K` : `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number, name: string) => [
                metric === 'revenue' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                name === 'revenue' ? 'Revenue' : (name === 'target' ? 'Target' : 'Customers')
              ]}
            />
            <Legend />
            {metric === 'revenue' ? (
              <>
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--revenue))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--revenue))', strokeWidth: 2, r: 4 }}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="hsl(var(--warning))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2, r: 3 }}
                  name="Target"
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="customers"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                name="Customers"
              />
            )}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            <XAxis
              dataKey="month"
              className="text-muted-foreground"
              fontSize={12}
              minTickGap={30}
            />
            <YAxis
              className="text-muted-foreground"
              fontSize={12}
              tickFormatter={(value) => metric === 'revenue' ? `$${(value / 1000).toFixed(0)}K` : `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number) => [
                metric === 'revenue' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                metric === 'revenue' ? 'Revenue' : 'Customers'
              ]}
            />
            <Legend />
            <Bar
              dataKey={metric}
              fill={metric === 'revenue' ? "hsl(var(--revenue))" : "hsl(var(--primary))"}
              radius={[4, 4, 0, 0]}
              name={metric === 'revenue' ? "Revenue" : "Customers"}
            />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            <XAxis
              dataKey="month"
              className="text-muted-foreground"
              fontSize={12}
              minTickGap={30}
            />
            <YAxis
              className="text-muted-foreground"
              fontSize={12}
              tickFormatter={(value) => metric === 'revenue' ? `$${(value / 1000).toFixed(0)}K` : `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number, name: string) => [
                metric === 'revenue' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                name === 'revenue' ? 'Revenue' : (name === 'target' ? 'Target' : 'Customers')
              ]}
            />
            <Legend />
            {metric === 'revenue' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="hsl(var(--revenue))"
                  fill="hsl(var(--revenue))"
                  fillOpacity={0.6}
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stackId="1"
                  stroke="hsl(var(--warning))"
                  fill="hsl(var(--warning))"
                  fillOpacity={0.4}
                  name="Target"
                />
              </>
            ) : (
              <Area
                type="monotone"
                dataKey="customers"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
                name="Customers"
              />
            )}
          </AreaChart>
        );

      case 'pie':
        const pieData = data.slice(0, 6).map((item, index) => ({
          name: item.month,
          value: metric === 'revenue' ? item.revenue : item.customers,
          fill: colors[index % colors.length]
        }));

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number) => [
                metric === 'revenue' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                metric === 'revenue' ? 'Revenue' : 'Customers'
              ]}
            />
            <Legend />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}