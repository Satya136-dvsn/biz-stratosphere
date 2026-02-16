// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useAdvancedML } from '@/hooks/useAdvancedML';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, TrendingUp, History, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ModelComparison() {
    const { metrics, isLoadingMetrics } = useAdvancedML();

    if (isLoadingMetrics) {
        return <div className="p-8 text-center">Loading comparison data...</div>;
    }

    if (metrics.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No model history found. Train some models to see comparisons.</p>
                </CardContent>
            </Card>
        );
    }

    // Prepare data for charts
    const chartData = metrics
        .slice()
        .reverse()
        .map(m => ({
            name: `v${m.version}`,
            accuracy: m.accuracy ? m.accuracy * 100 : null,
            r2: m.r2 ? m.r2 * 100 : null,
            type: m.model_name.includes('churn') ? 'Churn' : 'Revenue'
        }));

    const churnData = chartData.filter(d => d.type === 'Churn');
    const revenueData = chartData.filter(d => d.type === 'Revenue');

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Accuracy Trend - Churn */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            Churn Model Accuracy Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={churnData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Line type="monotone" dataKey="accuracy" stroke="#2563eb" name="Accuracy %" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* R2 Trend - Revenue */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            Revenue Model R² Score Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Line type="monotone" dataKey="r2" stroke="#10b981" name="R² %" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Comparison Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Model Leaderboard
                    </CardTitle>
                    <CardDescription>Compare metrics across different training iterations</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Model</TableHead>
                                <TableHead>Version</TableHead>
                                <TableHead>Metric</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Training Time</TableHead>
                                <TableHead>Trained At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {metrics.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell className="font-medium">
                                        {m.model_name === 'churn_model' ? (
                                            <Badge variant="secondary">Churn</Badge>
                                        ) : (
                                            <Badge variant="default">Revenue</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>v{m.version}</TableCell>
                                    <TableCell>
                                        {m.model_name === 'churn_model' ? 'Accuracy' : 'R² Score'}
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        {m.model_name === 'churn_model'
                                            ? `${((m.accuracy || 0) * 100).toFixed(1)}%`
                                            : `${((m.r2 || 0) * 100).toFixed(1)}%`
                                        }
                                    </TableCell>
                                    <TableCell>{(m.training_time_ms / 1000).toFixed(2)}s</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(m.created_at).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Performance metrics are calculated using a 20% hold-out validation split during training.
                </AlertDescription>
            </Alert>
        </div>
    );
}
