import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    RadialBarChart,
    RadialBar,
    Legend,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

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
    color = '#8884d8',
    showLegend = false,
}: GaugeChartProps) {
    const percentage = (value / maxValue) * 100;

    const data = [
        {
            name: title,
            value: percentage,
            fill: color,
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="90%"
                        barSize={20}
                        data={data}
                        startAngle={180}
                        endAngle={0}
                    >
                        <RadialBar
                            minAngle={15}
                            background
                            clockWise
                            dataKey="value"
                        />
                        {showLegend && <Legend />}
                        <Tooltip />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="text-center mt-4">
                    <p className="text-3xl font-bold">{value}{maxValue === 100 ? '%' : ''}</p>
                    <p className="text-sm text-muted-foreground">
                        {value} / {maxValue}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
