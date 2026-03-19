import React from 'react';
import {
    Treemap,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { GlassTooltip } from '@/components/ui/GlassTooltip';

interface TreemapChartProps {
    data: any[];
    title?: string;
    showTooltip?: boolean;
}

const COLORS = [
    'hsl(221, 83%, 53%)', // Strategic Blue
    'hsl(262, 83%, 58%)', // Strategic Purple
    'hsl(142, 71%, 45%)', // Strategic Emerald
    'hsl(38, 92%, 50%)',  // Strategic Amber
    'hsl(199, 89%, 48%)', // Sky Blue
    'hsl(215, 25%, 27%)', // Slate
    'hsl(221, 83%, 43%)'  // Dark Blue
];

export function TreemapChart({
    data,
    title = 'Treemap Chart',
    showTooltip = true,
}: TreemapChartProps) {
    const CustomContent = (props: any) => {
        const { x, y, width, height, name, value, fill, fillOpacity = 1 } = props;

        // Hide text only for very small boxes
        if (width < 30 || height < 20) {
            return (
                <g>
                    <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={fill}
                        fillOpacity={fillOpacity}
                        stroke="rgba(0,0,0,0.2)"
                        strokeWidth={1}
                        rx={4}
                    />
                </g>
            );
        }

        const formatName = (str: string) => {
            if (!str) return '';
            // Check if it looks like a date (YYYY-MM-DD)
            if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
                try {
                    const date = new Date(str);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }); // "Aug 20, 23"
                } catch (e) {
                    return str;
                }
            }
            return str.length > 12 ? `${str.substring(0, 10)}..` : str;
        };

        return (
            <g className="transition-all hover:opacity-90">
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={fill}
                    fillOpacity={fillOpacity}
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth={1}
                    rx={4}
                />
                {width > 60 && height > 40 && (
                    <>
                        <text
                            x={x + 8}
                            y={y + 18}
                            fill="#fff"
                            fontSize={10}
                            fontWeight="800"
                            className="uppercase tracking-tighter"
                            style={{ pointerEvents: 'none', opacity: 0.9 }}
                        >
                            {formatName(name)}
                        </text>
                        <text
                            x={x + 8}
                            y={y + 32}
                            fill="#fff"
                            fontSize={12}
                            fontWeight="900"
                            fontFamily="JetBrains Mono, monospace"
                            style={{ pointerEvents: 'none', opacity: 1 }}
                        >
                            {value.toLocaleString()}
                        </text>
                    </>
                )}
            </g>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={400}>
            <Treemap
                data={data}
                dataKey="value"
                nameKey="name"
                stroke="rgba(0,0,0,0.1)"
                fill="hsl(221, 83%, 53%)"
                content={<CustomContent />}
                animationDuration={1500}
            >
                {showTooltip && <Tooltip content={<GlassTooltip />} />}
            </Treemap>
        </ResponsiveContainer>
    );
}
