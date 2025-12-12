import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, AlertCircle, CheckCircle2, Clock, TrendingUp, Zap, Users, Database } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';

interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    status: 'good' | 'warning' | 'error';
    threshold: number;
}

export function Monitoring() {
    const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
    const [errors, setErrors] = useState<any[]>([]);
    const { data: systemMetrics, isLoading: metricsLoading } = useSystemMetrics();

    // Monitor performance
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();

            entries.forEach((entry) => {
                if (entry.entryType === 'navigation') {
                    const navEntry = entry as PerformanceNavigationTiming;
                    setMetrics([
                        {
                            name: 'Page Load Time',
                            value: navEntry.loadEventEnd - navEntry.fetchStart,
                            unit: 'ms',
                            status: navEntry.loadEventEnd - navEntry.fetchStart < 3000 ? 'good' : 'warning',
                            threshold: 3000,
                        },
                        {
                            name: 'Time to First Byte',
                            value: navEntry.responseStart - navEntry.requestStart,
                            unit: 'ms',
                            status: navEntry.responseStart - navEntry.requestStart < 600 ? 'good' : 'warning',
                            threshold: 600,
                        },
                        {
                            name: 'DOM Content Loaded',
                            value: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
                            unit: 'ms',
                            status: navEntry.domContentLoadedEventEnd - navEntry.fetchStart < 1500 ? 'good' : 'warning',
                            threshold: 1500,
                        },
                    ]);
                }
            });
        });

        observer.observe({ entryTypes: ['navigation', 'resource'] });

        return () => observer.disconnect();
    }, []);

    // Monitor errors
    useEffect(() => {
        const errorHandler = (event: ErrorEvent) => {
            setErrors((prev) => [
                ...prev.slice(-9),
                {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    timestamp: new Date(),
                },
            ]);
        };

        window.addEventListener('error', errorHandler);
        return () => window.removeEventListener('error', errorHandler);
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'good':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'warning':
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Monitoring & Analytics</h2>
                <p className="text-muted-foreground">
                    Real-time performance and error tracking
                </p>
            </div>

            {/* Performance Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                {metrics.length > 0 ? (
                    metrics.map((metric) => (
                        <Card key={metric.name}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center justify-between">
                                    <span>{metric.name}</span>
                                    {getStatusIcon(metric.status)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {metric.value.toFixed(0)} {metric.unit}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Threshold: {metric.threshold} {metric.unit}
                                </p>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="col-span-3">
                        <CardContent className="flex items-center justify-center py-8">
                            <div className="text-center">
                                <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Performance metrics will appear here
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* System Health */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        System Health
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <div className="text-sm font-medium">API Status</div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Operational</span>
                            </div>
                            {systemMetrics && (
                                <div className="text-xs text-muted-foreground">
                                    {systemMetrics.apiResponseTime}ms avg
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium">Database</div>
                            <div className="flex items-center gap-2">
                                <Database className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Healthy</span>
                            </div>
                            {systemMetrics && (
                                <div className="text-xs text-muted-foreground">
                                    {systemMetrics.dataSetsCount} datasets
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium">Active Users</div>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-500" />
                                <span className="text-sm">{systemMetrics?.activeUsers || 0}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Online now
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium">Uptime</div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{systemMetrics?.uptime.toFixed(2)}%</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {systemMetrics?.totalRequests || 0} requests
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error Tracking */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Recent Errors
                        </CardTitle>
                        <Badge variant={errors.length === 0 ? 'default' : 'destructive'}>
                            {errors.length} errors
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {errors.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                            <p>No errors detected</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {errors.map((error, idx) => (
                                <div key={idx} className="p-3 bg-destructive/10 rounded-lg text-sm">
                                    <div className="font-medium text-destructive">{error.message}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {error.filename}:{error.lineno}:{error.colno} •{' '}
                                        {error.timestamp.toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Analytics Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Usage Analytics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        <p>✅ Performance monitoring active</p>
                        <p>✅ Error tracking enabled</p>
                        <p>✅ Real-time metrics collection</p>
                        <p className="mt-4">
                            For production deployment, integrate with services like:
                            <ul className="list-disc list-inside mt-2">
                                <li>Sentry (error tracking)</li>
                                <li>PostHog (user analytics)</li>
                                <li>Vercel Analytics (performance)</li>
                            </ul>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
