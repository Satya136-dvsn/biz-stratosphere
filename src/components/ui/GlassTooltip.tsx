
import React from 'react';
import { cn } from '@/lib/utils';
import { TooltipProps } from 'recharts';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface GlassTooltipProps extends TooltipProps<ValueType, NameType> {
    active?: boolean;
    payload?: any[];
    label?: string;
    indicator?: 'dot' | 'line';
    formatter?: (value: number, name: string) => string;
}

export function GlassTooltip({
    active,
    payload,
    label,
    indicator = 'dot',
    formatter
}: GlassTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card/95 border border-border/50 rounded-lg p-3 shadow-xl backdrop-blur-md text-sm animate-in fade-in zoom-in-95 duration-200">
                <p className="text-foreground font-semibold mb-2">{label}</p>
                <div className="space-y-1.5">
                    {payload.map((entry, index) => {
                        const name = entry.name;
                        const value = entry.value;
                        const color = entry.color || entry.fill || entry.stroke;

                        const formattedValue = formatter
                            ? formatter(value as number, name as string)
                            : ((typeof value === 'number')
                                ? value.toLocaleString()
                                : value);

                        return (
                            <div key={index} className="flex items-center gap-3">
                                {indicator === 'dot' && (
                                    <div
                                        className="w-2 h-2 rounded-full shadow-sm ring-1 ring-white/10"
                                        style={{ backgroundColor: color }}
                                    />
                                )}
                                {indicator === 'line' && (
                                    <div
                                        className="w-1 h-3 rounded-full"
                                        style={{ backgroundColor: color }}
                                    />
                                )}
                                <span className="text-muted-foreground capitalize text-xs font-medium">
                                    {name}
                                </span>
                                <span className="text-foreground font-mono ml-auto pl-4 font-semibold">
                                    {formattedValue}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    return null;
}
