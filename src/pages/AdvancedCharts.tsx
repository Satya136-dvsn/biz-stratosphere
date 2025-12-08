import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend,
} from 'recharts';
import {
    FunnelChart,
    Funnel,
    LabelList,
} from 'recharts';

// Scatter Plot Component
export function ScatterPlot({ data, xKey, yKey, title }: {
    data: any[];
    xKey: string;
    yKey: string;
    title: string;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={xKey} name={xKey} />
                        <YAxis dataKey={yKey} name={yKey} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Legend />
                        <Scatter name={title} data={data} fill="#8884d8">
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`hsl(${index * 30}, 70%, 50%)`} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

// Heatmap Component (simplified using colored grid)
export function Heatmap({ data, title }: {
    data: { x: string; y: string; value: number }[];
    title: string;
}) {
    const maxValue = Math.max(...data.map(d => d.value));

    const getColor = (value: number) => {
        const intensity = (value / maxValue) * 100;
        return `hsl(220, 70%, ${100 - intensity / 2}%)`;
    };

    // Group data by y-axis
    const grouped = data.reduce((acc, item) => {
        if (!acc[item.y]) acc[item.y] = [];
        acc[item.y].push(item);
        return acc;
    }, {} as Record<string, typeof data>);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {Object.entries(grouped).map(([yLabel, items]) => (
                        <div key={yLabel} className="flex items-center gap-2">
                            <div className="w-24 text-sm font-medium">{yLabel}</div>
                            <div className="flex-1 flex gap-1">
                                {items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex-1 h-12 rounded flex items-center justify-center text-xs font-semibold"
                                        style={{ backgroundColor: getColor(item.value) }}
                                        title={`${item.x}: ${item.value}`}
                                    >
                                        {item.value}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// Funnel Chart Component
export function FunnelChartComponent({ data, title }: {
    data: { name: string; value: number; fill: string }[];
    title: string;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <FunnelChart>
                        <Tooltip />
                        <Funnel
                            dataKey="value"
                            data={data}
                            isAnimationActive
                        >
                            <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                        </Funnel>
                    </FunnelChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

// Advanced Charts Page
export default function AdvancedCharts() {
    // Sample data
    const scatterData = [
        { revenue: 4000, customers: 24 },
        { revenue: 3000, customers: 13 },
        { revenue: 2000, customers: 98 },
        { revenue: 2780, customers: 39 },
        { revenue: 1890, customers: 48 },
        { revenue: 2390, customers: 38 },
        { revenue: 3490, customers: 43 },
    ];

    const heatmapData = [
        { x: 'Mon', y: 'Morning', value: 89 },
        { x: 'Mon', y: 'Afternoon', value: 95 },
        { x: 'Mon', y: 'Evening', value: 72 },
        { x: 'Tue', y: 'Morning', value: 92 },
        { x: 'Tue', y: 'Afternoon', value: 88 },
        { x: 'Tue', y: 'Evening', value: 76 },
        { x: 'Wed', y: 'Morning', value: 94 },
        { x: 'Wed', y: 'Afternoon', value: 91 },
        { x: 'Wed', y: 'Evening', value: 78 },
    ];

    const funnelData = [
        { name: 'Visitors', value: 10000, fill: '#8884d8' },
        { name: 'Leads', value: 5000, fill: '#83a6ed' },
        { name: 'Opportunities', value: 2000, fill: '#8dd1e1' },
        { name: 'Customers', value: 800, fill: '#82ca9d' },
        { name: 'Retained', value: 600, fill: '#a4de6c' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Advanced Charts</h2>
                <p className="text-muted-foreground">
                    Visualize your data with advanced chart types
                </p>
            </div>

            <div className="grid gap-6">
                <ScatterPlot
                    data={scatterData}
                    xKey="revenue"
                    yKey="customers"
                    title="Revenue vs Customers Correlation"
                />

                <Heatmap
                    data={heatmapData}
                    title="Activity Heatmap"
                />

                <FunnelChartComponent
                    data={funnelData}
                    title="Sales Funnel"
                />
            </div>
        </div>
    );
}
