
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
            <div className="bg-popover/80 border border-border rounded-xl p-2.5 shadow-xl backdrop-blur-xl text-xs animate-in fade-in zoom-in-95 duration-200 ring-1 ring-border/5 min-w-[140px]">
                <p className="text-foreground/90 font-bold mb-2 uppercase tracking-[0.15em] text-[9px] border-b border-border/10 pb-1.5">{label}</p>
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
                            <div key={index} className="flex items-center gap-3 group/item">
                                {indicator === 'dot' && (
                                    <div
                                        className="w-2 h-2 rounded-full shadow-sm ring-1 ring-border/10 transition-transform group-hover/item:scale-110"
                                        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
                                    />
                                )}
                                {indicator === 'line' && (
                                    <div
                                        className="w-1 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)]"
                                        style={{ backgroundColor: color }}
                                    />
                                )}
                                <span className="text-muted-foreground/90 capitalize text-[10px] font-medium tracking-tight">
                                    {name}
                                </span>
                                <span className="text-foreground font-mono ml-auto pl-4 font-black text-[11px]">
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
