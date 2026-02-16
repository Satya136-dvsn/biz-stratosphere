// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BarChart3, LineChart, PieChart, AreaChart, Radar, Network, Gauge, TrendingUp } from 'lucide-react';

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'scatter' | 'radar' | 'treemap' | 'gauge' | 'funnel';

interface ChartTypeSelectorProps {
  selectedType: ChartType;
  onTypeChange: (type: ChartType) => void;
  availableTypes?: ChartType[];
}

export function ChartTypeSelector({
  selectedType,
  onTypeChange,
  availableTypes = ['line', 'bar', 'area', 'pie', 'scatter', 'radar', 'treemap', 'gauge', 'funnel']
}: ChartTypeSelectorProps) {
  const chartTypes = [
    { type: 'line' as ChartType, icon: LineChart, label: 'Line Chart' },
    { type: 'bar' as ChartType, icon: BarChart3, label: 'Bar Chart' },
    { type: 'area' as ChartType, icon: AreaChart, label: 'Area Chart' },
    { type: 'pie' as ChartType, icon: PieChart, label: 'Pie Chart' },
    { type: 'scatter' as ChartType, icon: TrendingUp, label: 'Scatter Plot' },
    { type: 'radar' as ChartType, icon: Radar, label: 'Radar Chart' },
    { type: 'treemap' as ChartType, icon: Network, label: 'Treemap' },
    { type: 'gauge' as ChartType, icon: Gauge, label: 'Gauge' },
    { type: 'funnel' as ChartType, icon: BarChart3, label: 'Funnel' },
  ].filter(chart => availableTypes.includes(chart.type));

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {chartTypes.map(({ type, icon: Icon, label }) => (
        <Button
          key={type}
          variant={selectedType === type ? "default" : "outline"}
          size="sm"
          onClick={() => onTypeChange(type)}
          className="h-8 w-full flex flex-col items-center justify-center p-1 text-xs"
          title={label}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}