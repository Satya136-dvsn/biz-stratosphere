import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    RadialBarChart,
    RadialBar,
    Legend,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { GlassTooltip } from '@/components/ui/GlassTooltip';

interface GaugeChartProps {
    value: number;
    maxValue?: number;
    title?: string;
    color?: string;
    showLegend?: boolean;
}

export function GaugeChart({
    value,
    maxValue = 100,
    title = 'Gauge Chart',
    color = 'hsl(221, 83%, 53%)',
    showLegend = false,
}: GaugeChartProps) {
    const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

    const data = [
        {
            name: 'Usage',
            value: percentage,
            fill: color,
        },
    ];

    return (
        <Card className="bg-[hsl(220_18%_7%)]/40 border-[hsl(220_16%_12%)] backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden group/card h-full">
            <CardHeader className="pb-0">
                <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/60 group-hover/card:text-primary transition-colors">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-0">
                <div className="relative w-full h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="60%"
                            innerRadius="70%"
                            outerRadius="100%"
                            barSize={16}
                            data={data}
                            startAngle={180}
                            endAngle={0}
                        >
                            <RadialBar
                                background={{ fill: 'rgba(255,255,255,0.05)', strokeWidth: 0 }}
                                dataKey="value"
                                cornerRadius={10}
                                animationDuration={1500}
                            />
                            {showLegend && <Legend verticalAlign="bottom" />}
                            <Tooltip content={<GlassTooltip />} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute top-[65%] left-1/2 -translate-x-1/2 text-center">
                        <p className="text-4xl font-black bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent transition-transform group-hover/card:scale-105 duration-500">
                            {value}{maxValue === 100 ? '%' : ''}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">
                            Current Target
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
