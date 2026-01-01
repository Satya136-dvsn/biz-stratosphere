import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    color = '#8884d8',
    showLegend = true,
    showTooltip = true,
}: RadarChartComponentProps) {
    return (
        <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={data}>
                <PolarGrid />
                <PolarAngleAxis dataKey={nameKey} />
                <PolarRadiusAxis />
                {showTooltip && <Tooltip />}
                {showLegend && <Legend />}
                <Radar
                    name={dataKey}
                    dataKey={dataKey}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.6}
                />
            </RadarChart>
        </ResponsiveContainer>
    );
}
