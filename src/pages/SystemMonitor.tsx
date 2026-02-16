// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Server, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { PageLayout } from "@/components/layout/PageLayout";

// Simulated mock data generators for the monitor
const generateTimeData = (count: number) => {
    return Array.from({ length: count }).map((_, i) => ({
        time: new Date(Date.now() - (count - i) * 1000 * 60).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latency: Math.floor(Math.random() * 150) + 50, // 50-200ms
        requests: Math.floor(Math.random() * 100) + 20,
        errors: Math.random() > 0.9 ? Math.floor(Math.random() * 5) : 0
    }));
};

export default function SystemMonitor() {
    const [metrics, setMetrics] = useState(generateTimeData(20));
    const [status, setStatus] = useState<'healthy' | 'degraded' | 'critical'>('healthy');

    // Simulate real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics(prev => {
                const newPoint = {
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    latency: Math.floor(Math.random() * 150) + 50,
                    requests: Math.floor(Math.random() * 100) + 20,
                    errors: Math.random() > 0.95 ? Math.floor(Math.random() * 3) : 0
                };
                const newData = [...prev.slice(1), newPoint];

                // Update status based on latest metrics
                if (newPoint.errors > 2 || newPoint.latency > 300) setStatus('critical');
                else if (newPoint.errors > 0 || newPoint.latency > 150) setStatus('degraded');
                else setStatus('healthy');

                return newData;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'healthy': return 'text-green-500';
            case 'degraded': return 'text-yellow-500';
            case 'critical': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    return (
        <PageLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">System Monitor (Advanced)</h2>
                    <p className="text-muted-foreground">Real-time infrastructure and application performance metrics</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${status === 'healthy' ? 'bg-green-500/10 border-green-500/20' : status === 'degraded' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <Activity className={`h-5 w-5 ${getStatusColor(status)}`} />
                    <span className={`font-medium ${getStatusColor(status)} capitalize`}>{status} System</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">API Latency</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics[metrics.length - 1].latency}ms</div>
                        <p className="text-xs text-muted-foreground">Average response time</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Throughput</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics[metrics.length - 1].requests} req/s</div>
                        <p className="text-xs text-muted-foreground">Current traffic load</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics[metrics.length - 1].errors}%</div>
                        <p className="text-xs text-muted-foreground">Requests resulting in 5xx</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="performance" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="performance">Performance Trends</TabsTrigger>
                    <TabsTrigger value="logs">Error Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="performance" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>API Response Time</CardTitle>
                                <CardDescription>Latency (ms) over the last minute</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={metrics}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="time" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="latency" stroke="#8884d8" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>System Load</CardTitle>
                                <CardDescription>Request throughput vs Errors</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={metrics}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="time" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="requests" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                                        <Area type="monotone" dataKey="errors" stackId="2" stroke="#ff8042" fill="#ff8042" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="logs">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent System Events</CardTitle>
                            <CardDescription>Audit log of system health events</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {metrics.filter(m => m.errors > 0 || m.latency > 150).length === 0 && (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle className="h-5 w-5" />
                                        <span>No recent issues detected.</span>
                                    </div>
                                )}
                                {metrics.map((m, i) => {
                                    if (m.errors > 0 || m.latency > 150) {
                                        return (
                                            <div key={i} className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border">
                                                <div className="flex items-center gap-3">
                                                    <AlertCircle className={`h-5 w-5 ${m.errors > 0 ? 'text-red-500' : 'text-yellow-500'}`} />
                                                    <div>
                                                        <p className="font-medium">{m.errors > 0 ? 'High Error Rate Detected' : 'Latency Spike Detected'}</p>
                                                        <p className="text-sm text-muted-foreground">{m.time} - Latency: {m.latency}ms, Errors: {m.errors}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">WARN</span>
                                            </div>
                                        );
                                    }
                                    return null;
                                }).reverse().filter(Boolean)}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </PageLayout>
    );
}
