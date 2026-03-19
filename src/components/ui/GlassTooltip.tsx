
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
            <div className="bg-[hsl(220_18%_7%)]/80 border border-[hsl(220_16%_14%)] rounded-xl p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl text-sm animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
                <p className="text-foreground/90 font-bold mb-3 uppercase tracking-widest text-[10px] sm:text-[11px] border-b border-border/10 pb-2">{label}</p>
                <div className="space-y-2.5">
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
                            <div key={index} className="flex items-center gap-4 group/item">
                                {indicator === 'dot' && (
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ring-2 ring-white/10 transition-transform group-hover/item:scale-110"
                                        style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}40` }}
                                    />
                                )}
                                {indicator === 'line' && (
                                    <div
                                        className="w-1.5 h-4 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)]"
                                        style={{ backgroundColor: color }}
                                    />
                                )}
                                <span className="text-muted-foreground/80 capitalize text-[11px] font-semibold tracking-wide">
                                    {name}
                                </span>
                                <span className="text-foreground font-mono ml-auto pl-6 font-bold text-xs">
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
