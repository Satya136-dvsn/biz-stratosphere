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

        // Hide text only for very small boxes
        if (width < 40 || height < 25) {
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
                        strokeWidth={1}
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
            return str.length > 10 ? `${str.substring(0, 10)}..` : str;
        };

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
                    strokeWidth={1}
                />
                <text
                    x={x + width / 2}
                    y={y + height / 2 - 7}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={11}
                    fontWeight="500"
                    style={{ pointerEvents: 'none', textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}
                >
                    {formatName(name)}
                </text>
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 10}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={10}
                    style={{ pointerEvents: 'none', textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}
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
