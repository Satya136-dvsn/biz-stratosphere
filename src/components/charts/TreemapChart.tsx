import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Treemap,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

interface TreemapChartProps {
    data: any[];
    title?: string;
    showTooltip?: boolean;
}

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

export function TreemapChart({
    data,
    title = 'Treemap Chart',
    showTooltip = true,
}: TreemapChartProps) {
    const CustomContent = (props: any) => {
        const { x, y, width, height, name, value, fill, fillOpacity = 1 } = props;

        if (width < 30 || height < 30) return null;

        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={fill}
                    fillOpacity={fillOpacity}
                    stroke="#fff"
                    strokeWidth={2}
                />
                <text
                    x={x + width / 2}
                    y={y + height / 2 - 7}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={Math.min(14, width / 5)} // Auto-scale font
                    fontWeight="bold"
                >
                    {name}
                </text>
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 10}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={Math.min(12, width / 6)}
                >
                    {value}
                </text>
            </g>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={400}>
            <Treemap
                data={data}
                dataKey="value"
                nameKey="name"
                stroke="#fff"
                fill="#8884d8"
                content={<CustomContent />}
            >
                {showTooltip && <Tooltip />}
            </Treemap>
        </ResponsiveContainer>
    );
}
