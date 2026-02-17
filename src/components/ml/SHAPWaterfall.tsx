
// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import { ChartGradientDefs } from '@/components/ui/ChartGradientDefs';

export interface FeatureContribution {
    feature: string;
    value: number;
    importance: number;
    impact: 'positive' | 'negative';
}

interface SHAPWaterfallProps {
    features: FeatureContribution[];
    predictedValue?: string;
    confidence?: number;
    interpretation?: string;
    modelVersion?: string;
}

/**
 * Visual SHAP-style Waterfall chart that shows how each feature
 * pushed the prediction higher or lower relative to the base value.
 */
export function SHAPWaterfall({
    features,
    predictedValue,
    confidence,
    interpretation,
    modelVersion,
}: SHAPWaterfallProps) {
    if (!features || features.length === 0) {
        return null;
    }

    // Prepare chart data — sort by absolute importance descending
    const chartData = [...features]
        .sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance))
        .slice(0, 8)
        .map((f) => ({
            name: formatFeatureName(f.feature),
            value: f.impact === 'negative' ? -f.importance : f.importance,
            rawValue: f.value,
            importance: f.importance,
            impact: f.impact,
        }));

    const maxAbsValue = Math.max(...chartData.map((d) => Math.abs(d.value)));

    return (
        <Card className="border border-primary/20">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        🧠 Why This Prediction?
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {modelVersion && (
                            <Badge variant="outline" className="text-xs">
                                {modelVersion}
                            </Badge>
                        )}
                        {confidence !== undefined && (
                            <Badge
                                className={cn(
                                    'text-xs',
                                    confidence > 0.8
                                        ? 'bg-green-500/15 text-green-600 border-green-500/30'
                                        : confidence > 0.5
                                            ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                                            : 'bg-red-500/15 text-red-600 border-red-500/30'
                                )}
                            >
                                {(confidence * 100).toFixed(0)}% confident
                            </Badge>
                        )}
                    </div>
                </div>
                {predictedValue && (
                    <p className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        {predictedValue}
                    </p>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Waterfall Chart */}
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                        >
                            <ChartGradientDefs />
                            <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false}
                                stroke="hsl(var(--border))"
                                opacity={0.2}
                            />
                            <XAxis
                                type="number"
                                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                domain={[-maxAbsValue * 1.1, maxAbsValue * 1.1]}
                                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={120}
                                tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                content={<SHAPTooltip />}
                                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                            />
                            <ReferenceLine
                                x={0}
                                stroke="hsl(var(--border))"
                                strokeWidth={2}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22} animationDuration={1500}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            entry.impact === 'positive'
                                                ? 'url(#colorSuccess)'
                                                : 'url(#colorDestructive)'
                                        }
                                        opacity={1}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Interpretation */}
                {interpretation && (
                    <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            <span className="font-medium text-foreground">AI Interpretation: </span>
                            {interpretation}
                        </p>
                    </div>
                )}

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(142, 71%, 45%)' }} />
                        <span>Pushes prediction higher</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(0, 84%, 60%)' }} />
                        <span>Pushes prediction lower</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/** Custom tooltip for the SHAP chart */
function SHAPTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;

    return (
        <div className="bg-card/95 border border-border/50 rounded-lg p-3 shadow-xl backdrop-blur-md text-sm animate-in fade-in zoom-in-95 duration-200">
            <p className="font-semibold mb-2 text-foreground">{data.name}</p>
            <div className="space-y-1.5 text-muted-foreground">
                <div className="flex justify-between gap-4">
                    <span>Input Value:</span>
                    <span className="text-foreground font-mono">{data.rawValue?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span>Impact:</span>
                    <span
                        className={cn(
                            'font-mono font-medium',
                            data.impact === 'positive' ? 'text-green-500' : 'text-red-500'
                        )}
                    >
                        {data.impact === 'positive' ? '+' : '-'}
                        {(data.importance * 100).toFixed(1)}%
                    </span>
                </div>
            </div>
        </div>
    );
}

/** Convert snake_case or camelCase to Title Case */
function formatFeatureName(name: string): string {
    return name
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
}
