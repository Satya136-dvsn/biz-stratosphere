// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import React from 'react';
import {
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts';
import { GlassTooltip } from '@/components/ui/GlassTooltip';

interface RadarChartComponentProps {
    data: any[];
    dataKey: string;
    nameKey: string;
    title?: string;
    color?: string;
    showLegend?: boolean;
    showTooltip?: boolean;
}

export function RadarChartComponent({
    data,
    dataKey,
    nameKey,
    title = 'Radar Chart',
    color = 'hsl(221, 83%, 53%)',
    showLegend = true,
    showTooltip = true,
}: RadarChartComponentProps) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-muted-foreground text-xs uppercase tracking-widest font-bold">No Radar Data</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={data} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis 
                    dataKey={nameKey} 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                />
                <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 'auto']} 
                    tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8 }}
                    axisLine={false}
                    tickLine={false}
                />
                {showTooltip && <Tooltip content={<GlassTooltip />} />}
                {showLegend && <Legend verticalAlign="bottom" height={36} iconType="circle" />}
                <Radar
                    name={dataKey.replace(/_/g, ' ').toUpperCase()}
                    dataKey={dataKey}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.2}
                    strokeWidth={3}
                    animationDuration={1500}
                />
            </RadarChart>
        </ResponsiveContainer>
    );
}
