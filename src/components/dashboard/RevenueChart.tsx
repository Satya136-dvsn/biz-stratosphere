
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
import { cn, formatCurrency, formatNumber } from '@/lib/utils';

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
    return <div className="p-4 text-red-500 font-bold uppercase tracking-widest text-xs">No Data Available</div>;
  }

  const CHART_HEIGHT = 320;
  // Use theme variables for more professional color palette
  const STRATEGIC_BLUE = "hsl(var(--primary))";
  const STRATEGIC_PURPLE = "hsl(var(--secondary))";
  const STRATEGIC_EMERALD = "hsl(var(--success))";
  const STRATEGIC_AMBER = "hsl(var(--warning))";
  
  const COLORS = [STRATEGIC_BLUE, STRATEGIC_PURPLE, STRATEGIC_EMERALD, STRATEGIC_AMBER, 'hsl(var(--accent))'];

  const renderChart = () => {
    // 1. BAR CHART
    if (variant === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={STRATEGIC_BLUE} stopOpacity={1} />
                <stop offset="100%" stopColor={STRATEGIC_PURPLE} stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border) / 0.3)" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground) / 0.5)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
              fontFamily="JetBrains Mono, monospace"
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground) / 0.5)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => metric === 'revenue' ? `$${v/1000}k` : v}
              fontFamily="JetBrains Mono, monospace"
            />
            <Tooltip content={<GlassTooltip formatter={metric === 'revenue' ? (v) => formatCurrency(v as number) : (v) => formatNumber(v as number)} />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
            <Bar 
              dataKey={metric} 
              fill="url(#barGradient)" 
              name={metric === 'revenue' ? 'Actual Revenue' : 'Customer Base'} 
              radius={[6, 6, 0, 0]} 
              barSize={32}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // 2. AREA CHART
    if (variant === 'area') {
      return (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={STRATEGIC_BLUE} stopOpacity={0.3} />
                <stop offset="95%" stopColor={STRATEGIC_BLUE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border) / 0.3)" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground) / 0.5)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
              fontFamily="JetBrains Mono, monospace"
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground) / 0.5)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => metric === 'revenue' ? `$${v/1000}k` : v}
              fontFamily="JetBrains Mono, monospace"
            />
            <Tooltip content={<GlassTooltip formatter={metric === 'revenue' ? (v) => formatCurrency(v as number) : (v) => formatNumber(v as number)} />} />
            <Area 
              type="monotone" 
              dataKey={metric} 
              stroke={STRATEGIC_BLUE} 
              strokeWidth={3}
              fill="url(#areaGradient)" 
              animationDuration={1500}
            />
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
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              animationDuration={1500}
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="none"
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </Pie>
            <Tooltip content={<GlassTooltip formatter={metric === 'revenue' ? (v) => formatCurrency(v as number) : (v) => formatNumber(v as number)} />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // DEFAULT: LINE CHART
    return (
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border) / 0.3)" />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground) / 0.5)" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dy={10}
            fontFamily="JetBrains Mono, monospace"
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground) / 0.5)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => metric === 'revenue' ? `$${v/1000}k` : v}
            fontFamily="JetBrains Mono, monospace"
          />
          <Tooltip content={<GlassTooltip formatter={(v) => metric === 'revenue' ? formatCurrency(v as number) : formatNumber(v as number)} />} />
          <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
          {metric === 'revenue' ? (
            <>
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke={STRATEGIC_BLUE} 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }} 
                activeDot={{ r: 6, strokeWidth: 0, fill: STRATEGIC_BLUE }} 
                animationDuration={1500}
                name="Actual Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke={STRATEGIC_EMERALD} 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                dot={{ r: 2, strokeWidth: 2, fill: 'hsl(var(--background))' }} 
                activeDot={{ r: 4, strokeWidth: 0, fill: STRATEGIC_EMERALD }} 
                animationDuration={1500}
                name="System Target"
              />
            </>
          ) : (
            <Line 
              type="monotone" 
              dataKey="customers" 
              stroke={STRATEGIC_PURPLE} 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }} 
              activeDot={{ r: 6, strokeWidth: 0, fill: STRATEGIC_PURPLE }} 
              animationDuration={1500}
              name="Active Entities"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className={cn("bg-card/40 border-border/40 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden group/card", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors group-hover/card:text-primary/70">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 px-2 sm:px-4">
        <div style={{ width: '100%', height: CHART_HEIGHT }}>
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
}