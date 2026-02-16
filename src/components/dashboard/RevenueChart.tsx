// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
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
  Legend,
  TooltipProps
} from 'recharts';
import { ChartType } from './ChartTypeSelector';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

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

// Animation configuration for smooth transitions
const ANIMATION_DURATION = 800;
const ANIMATION_EASING = 'ease-out';

// Custom Tooltip Component for better styling control
const CustomTooltip = ({ active, payload, label, metric }: TooltipProps<ValueType, NameType> & { metric: 'revenue' | 'customers' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 border border-border/50 rounded-lg p-2 shadow-xl backdrop-blur-md text-xs">
        <p className="text-foreground font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground capitalize">
              {['revenue', 'target', 'customers'].includes(entry.name as string)
                ? (entry.name === 'revenue' ? 'Revenue' : entry.name === 'target' ? 'Target' : 'Customers')
                : (metric === 'revenue' ? 'Revenue' : 'Customers')}
            </span>
            <span className="text-foreground font-mono ml-auto pl-4">
              {metric === 'revenue' && typeof entry.value === 'number'
                ? `$${entry.value.toLocaleString()}`
                : entry.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueChart({ variant, title, className, data, isLoading, isFiltering = false, metric = 'revenue' }: ChartProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayData, setDisplayData] = useState<ChartDataPoint[]>(data);
  const prevDataRef = useRef<ChartDataPoint[]>(data);

  // Smooth transition when data changes
  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(prevDataRef.current)) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayData(data);
        setIsTransitioning(false);
      }, 150); // Small delay for smooth visual transition
      prevDataRef.current = data;
      return () => clearTimeout(timer);
    }
  }, [data]);

  // Loading skeleton with pulse animation
  if (isLoading) {
    return (
      <Card className={`border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent ${className}`}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            {title}
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="w-full space-y-4 animate-pulse">
              <div className="flex items-end justify-around h-[250px] gap-2">
                {[60, 80, 45, 90, 70, 85, 55].map((h, i) => (
                  <Skeleton
                    key={i}
                    className="w-full rounded-t-md"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 100}ms`
                    }}
                  />
                ))}
              </div>
              <Skeleton className="h-4 w-3/4 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
          <LineChart data={displayData}>
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
            <Tooltip content={<CustomTooltip metric={metric} />} />
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
                  animationBegin={0}
                  animationDuration={ANIMATION_DURATION}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="hsl(var(--warning))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2, r: 3 }}
                  name="Target"
                  animationBegin={100}
                  animationDuration={ANIMATION_DURATION}
                  animationEasing="ease-out"
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
                animationBegin={0}
                animationDuration={ANIMATION_DURATION}
                animationEasing="ease-out"
              />
            )}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={displayData}>
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
            <Tooltip content={<CustomTooltip metric={metric} />} />
            <Legend />
            <Bar
              dataKey={metric}
              fill={metric === 'revenue' ? "hsl(var(--revenue))" : "hsl(var(--primary))"}
              radius={[4, 4, 0, 0]}
              name={metric === 'revenue' ? "Revenue" : "Customers"}
              animationBegin={0}
              animationDuration={ANIMATION_DURATION}
              animationEasing="ease-out"
            />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart data={displayData}>
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
            <Tooltip content={<CustomTooltip metric={metric} />} />
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
                  animationBegin={0}
                  animationDuration={ANIMATION_DURATION}
                  animationEasing="ease-out"
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stackId="1"
                  stroke="hsl(var(--warning))"
                  fill="hsl(var(--warning))"
                  fillOpacity={0.4}
                  name="Target"
                  animationBegin={100}
                  animationDuration={ANIMATION_DURATION}
                  animationEasing="ease-out"
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
                animationBegin={0}
                animationDuration={ANIMATION_DURATION}
                animationEasing="ease-out"
              />
            )}
          </AreaChart>
        );

      case 'pie':
        const pieData = displayData.slice(0, 6).map((item, index) => ({
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
              animationBegin={0}
              animationDuration={ANIMATION_DURATION}
              animationEasing="ease-out"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip metric={metric} />} />
            <Legend />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent transition-all duration-300 ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
          {title}
          {(isTransitioning || isFiltering) && (
            <Loader2 className="h-4 w-4 animate-spin text-primary/60" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`transition-opacity duration-300 ${(isTransitioning || isFiltering) ? 'opacity-60' : 'opacity-100'}`}
        >
          <ResponsiveContainer width="100%" height={300}>
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}