import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIAnalytics } from '@/hooks/useAIAnalytics';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, MessageSquare, Zap, RefreshCw, Activity } from 'lucide-react';
import { format } from 'date-fns';

export function AIAnalytics() {
    const [days, setDays] = useState<number>(30);
    const {
        cacheMetrics,
        usageMetrics,
        conversationMetrics,
        messageMetrics,
        totals,
        isLoading,
        refreshAll
    } = useAIAnalytics(days);

    const handleRefresh = async () => {
        await refreshAll();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Activity className="h-8 w-8 text-primary" />
                        AI Chat Analytics
                    </h2>
                    <div className="flex items-center gap-2">
                        <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 90 days</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
                <p className="text-muted-foreground">
                    Production ops monitoring for AI Chat performance and usage
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totals.avgCacheHitRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {totals.totalCacheHits} hits from {totals.totalCacheEntries} entries
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.totalConversations.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {totals.totalMessages.toLocaleString()} total messages
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            Using AI Chat features
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Messages/Day</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {conversationMetrics?.length
                                ? (totals.totalMessages / conversationMetrics.length).toFixed(1)
                                : '0'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Per active day
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Cache Hit Rate Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cache Performance</CardTitle>
                        <CardDescription>Embedding cache hit rate over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {cacheMetrics && cacheMetrics.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={cacheMetrics}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                                    />
                                    <YAxis yAxisId="left" label={{ value: 'Hit Rate %', angle: -90, position: 'insideLeft' }} />
                                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Entries', angle: 90, position: 'insideRight' }} />
                                    <Tooltip
                                        labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                                    />
                                    <Legend />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="cache_hit_rate_percent"
                                        stroke="#8884d8"
                                        name="Hit Rate %"
                                        strokeWidth={2}
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="cache_entries"
                                        stroke="#82ca9d"
                                        name="Total Entries"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No cache data available for selected period
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Conversation Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle>Conversation Trends</CardTitle>
                        <CardDescription>Conversations and messages over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {conversationMetrics && conversationMetrics.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={conversationMetrics}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                                    />
                                    <Legend />
                                    <Bar dataKey="total_conversations" fill="#8884d8" name="Conversations" />
                                    <Bar dataKey="total_messages" fill="#82ca9d" name="Messages" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No conversation data available for selected period
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Usage Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle>Usage by Tier</CardTitle>
                    <CardDescription>Rate limit usage across user tiers</CardDescription>
                </CardHeader>
                <CardContent>
                    {usageMetrics && usageMetrics.length > 0 ? (
                        <div className="space-y-4">
                            {usageMetrics.map((tier) => (
                                <div key={tier.tier} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold capitalize">{tier.tier} Tier</h4>
                                        <span className="text-sm text-muted-foreground">{tier.user_count} users</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <div className="text-muted-foreground">Avg Daily</div>
                                            <div className="font-medium">{tier.avg_daily_messages.toFixed(1)}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Avg Monthly</div>
                                            <div className="font-medium">{tier.avg_monthly_messages.toFixed(1)}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">At Daily Limit</div>
                                            <div className="font-medium">{tier.users_at_daily_limit}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">At Monthly Limit</div>
                                            <div className="font-medium">{tier.users_at_monthly_limit}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            No usage data available
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* AI Settings Analytics */}
            {conversationMetrics && conversationMetrics.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>AI Configuration Trends</CardTitle>
                        <CardDescription>Average AI settings over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={conversationMetrics}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                                />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip
                                    labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                                />
                                <Legend />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="avg_context_window"
                                    stroke="#8884d8"
                                    name="Avg Context Window"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="avg_temperature"
                                    stroke="#82ca9d"
                                    name="Avg Temperature"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
