// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useCompany } from '@/hooks/useCompany';
import { supabase } from '@/integrations/supabase/client';
import { Activity, TrendingUp, Clock, AlertTriangle, BarChart3 } from 'lucide-react';

interface ApiUsage {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  created_at: string;
  user_id: string;
}

interface RateLimit {
  id: string;
  endpoint_pattern: string;
  max_requests: number;
  time_window_minutes: number;
  subscription_tier: string;
}

interface UsageStats {
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
}

export function ApiUsageDashboard() {
  const { company, hasPermission } = useCompany();
  const [apiUsage, setApiUsage] = useState<ApiUsage[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [stats, setStats] = useState<UsageStats>({
    totalRequests: 0,
    avgResponseTime: 0,
    errorRate: 0,
    topEndpoints: [],
  });
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company && hasPermission('analytics', 'read')) {
      fetchApiUsage();
      fetchRateLimits();
    }
  }, [company, timeRange]);

  const fetchApiUsage = async () => {
    try {
      const now = new Date();
      const timeRanges = {
        '1h': 1,
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30,
      };
      const hoursBack = timeRanges[timeRange as keyof typeof timeRanges];
      const since = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('api_usage')
        .select('*')
        .eq('company_id', company?.id)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      setApiUsage(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching API usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRateLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('company_id', company?.id);

      if (error) throw error;
      setRateLimits(data || []);
    } catch (error) {
      console.error('Error fetching rate limits:', error);
    }
  };

  const calculateStats = (usage: ApiUsage[]) => {
    const totalRequests = usage.length;
    const errorRequests = usage.filter(u => u.status_code >= 400).length;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    
    const avgResponseTime = usage.length > 0 
      ? usage.reduce((sum, u) => sum + (u.response_time_ms || 0), 0) / usage.length 
      : 0;

    const endpointCounts = usage.reduce((acc, u) => {
      acc[u.endpoint] = (acc[u.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setStats({
      totalRequests,
      avgResponseTime,
      errorRate,
      topEndpoints,
    });
  };

  const getChartData = () => {
    const hourlyData = apiUsage.reduce((acc, usage) => {
      const hour = new Date(usage.created_at).getHours();
      const key = `${hour}:00`;
      if (!acc[key]) {
        acc[key] = { time: key, requests: 0, avgResponseTime: 0, totalResponseTime: 0, count: 0 };
      }
      acc[key].requests += 1;
      acc[key].totalResponseTime += usage.response_time_ms || 0;
      acc[key].count += 1;
      acc[key].avgResponseTime = acc[key].totalResponseTime / acc[key].count;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(hourlyData).sort((a, b) => 
      parseInt(a.time.split(':')[0]) - parseInt(b.time.split(':')[0])
    );
  };

  const canViewAnalytics = hasPermission('analytics', 'read');

  if (!canViewAnalytics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">You don't have permission to view analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <p>Loading API usage data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Usage & Monitoring</h1>
          <p className="text-muted-foreground">Monitor API usage, performance, and rate limits</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7d</SelectItem>
            <SelectItem value="30d">Last 30d</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              In the selected time range
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.avgResponseTime)}ms</div>
            <p className="text-xs text-muted-foreground">
              Average across all requests
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errorRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              4xx and 5xx responses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limits</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rateLimits.length}</div>
            <p className="text-xs text-muted-foreground">
              Configured endpoints
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Times</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgResponseTime" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Endpoints</CardTitle>
            <CardDescription>Most frequently used API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topEndpoints.map((endpoint, index) => (
                <div key={endpoint.endpoint} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="font-mono text-sm">{endpoint.endpoint}</span>
                  </div>
                  <Badge>{endpoint.count} requests</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rate Limit Configuration</CardTitle>
            <CardDescription>Current rate limits for API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead>Window</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rateLimits.map((limit) => (
                  <TableRow key={limit.id}>
                    <TableCell className="font-mono text-sm">
                      {limit.endpoint_pattern}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {limit.max_requests} req
                      </Badge>
                    </TableCell>
                    <TableCell>{limit.time_window_minutes}min</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent API Calls</CardTitle>
          <CardDescription>Latest API usage activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiUsage.slice(0, 10).map((usage) => (
                <TableRow key={usage.id}>
                  <TableCell>
                    {new Date(usage.created_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {usage.endpoint}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{usage.method}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={usage.status_code >= 400 ? "destructive" : "default"}
                    >
                      {usage.status_code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {usage.response_time_ms ? `${usage.response_time_ms}ms` : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}