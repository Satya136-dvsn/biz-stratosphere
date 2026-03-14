
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { ChartType } from './ChartTypeSelector';
import { GlassTooltip } from '@/components/ui/GlassTooltip';
import { formatCurrency, formatNumber } from '@/lib/utils';

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
  isFiltering?: boolean;
  metric?: 'revenue' | 'customers';
}

export function RevenueChart({ variant, title, className, data, isLoading, metric = 'revenue' }: ChartProps) {
  // DEBUG: verify data is arriving
  if (!data || data.length === 0) {
    return <div className="p-4 text-red-500">No Data Available</div>;
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

  const renderChart = () => {
    // 1. BAR CHART
    if (variant === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="month" 
              stroke="rgba(255,255,255,0.4)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.4)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => metric === 'revenue' ? `$${v/1000}k` : v}
            />
            <Tooltip content={<GlassTooltip formatter={metric === 'revenue' ? (v) => formatCurrency(v as number) : (v) => formatNumber(v as number)} />} />
            <Legend />
            <Bar dataKey={metric} fill="#8884d8" name={metric === 'revenue' ? 'Revenue' : 'Customers'} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // 2. AREA CHART
    if (variant === 'area') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="month" 
              stroke="rgba(255,255,255,0.4)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.4)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => metric === 'revenue' ? `$${v/1000}k` : v}
            />
            <Tooltip content={<GlassTooltip formatter={metric === 'revenue' ? (v) => formatCurrency(v as number) : (v) => formatNumber(v as number)} />} />
            <Legend />
            <Area type="monotone" dataKey={metric} stroke="#8884d8" fill="#8884d8" fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // 3. PIE CHART
    if (variant === 'pie') {
      const pieData = data.slice(0, 6).map((d) => ({
        name: d.month,
        value: metric === 'revenue' ? d.revenue : d.customers
      }));

      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<GlassTooltip formatter={metric === 'revenue' ? (v) => formatCurrency(v as number) : (v) => formatNumber(v as number)} />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // DEFAULT: LINE CHART
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="month" 
            stroke="rgba(255,255,255,0.4)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.4)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => metric === 'revenue' ? `$${v/1000}k` : v}
          />
          <Tooltip content={<GlassTooltip formatter={(v) => metric === 'revenue' ? formatCurrency(v as number) : formatNumber(v as number)} />} />
          <Legend />
          {metric === 'revenue' ? (
            <>
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="target" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </>
          ) : (
            <Line type="monotone" dataKey="customers" stroke="#8884d8" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
}