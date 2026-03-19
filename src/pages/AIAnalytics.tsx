// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIAnalytics } from '@/hooks/useAIAnalytics';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, MessageSquare, Zap, RefreshCw, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-1.5 shadow-[0_0_15px_rgba(74,124,255,0.1)]">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">System Monitoring</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary/80" />
            AI Intelligence Analytics
          </h1>
          <p className="text-sm text-muted-foreground/60 mt-2 max-w-2xl leading-relaxed">
            Real-time operational monitoring of enterprise AI performance, message distribution, and vector retrieval efficiency across all tiers.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
            <SelectTrigger className="w-40 bg-[hsl(220_16%_9%)] border-[hsl(220_16%_14%)] text-[12px] h-10 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[hsl(220_18%_7%)] border-[hsl(220_16%_14%)] text-foreground">
              <SelectItem value="7" className="focus:bg-primary/10 focus:text-primary">Operational: 7D</SelectItem>
              <SelectItem value="30" className="focus:bg-primary/10 focus:text-primary">Performance: 30D</SelectItem>
              <SelectItem value="90" className="focus:bg-primary/10 focus:text-primary">Strategic: 90D</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm" 
            disabled={isLoading}
            className="h-10 px-4 border-[hsl(220_16%_14%)] bg-[hsl(220_16%_9%)] hover:bg-white/5 font-bold text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-2 opacity-60", isLoading && "animate-spin")} />
            REFRESH NODES
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Cache Hit Rate", value: `${totals.avgCacheHitRate.toFixed(1)}%`, sub: `${totals.totalCacheHits} hits / ${totals.totalCacheEntries} total`, icon: Zap, color: "text-amber-400" },
          { title: "Network Volume", value: totals.totalConversations.toLocaleString(), sub: `${totals.totalMessages.toLocaleString()} total signals`, icon: MessageSquare, color: "text-primary" },
          { title: "Active Entities", value: totals.totalUsers, sub: "Unique session identifiers", icon: Users, color: "text-emerald-400" },
          { title: "Signals / Velocity", value: conversationMetrics?.length ? (totals.totalMessages / conversationMetrics.length).toFixed(1) : '0', sub: "Avg signals per active cycle", icon: TrendingUp, color: "text-purple-400" }
        ].map((stat, i) => (
          <Card key={i} className="bg-[hsl(220_18%_7%)] border-[hsl(220_16%_14%)] group hover:border-primary/20 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">{stat.title}</CardTitle>
              <stat.icon className={cn("h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground font-mono">{stat.value}</div>
              <p className="text-[11px] text-muted-foreground/40 mt-1 font-medium">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cache Performance */}
        <Card className="bg-[hsl(220_18%_7%)] border-[hsl(220_16%_14%)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Optimization Efficiency</CardTitle>
              <CardDescription className="text-xs">Embedding cache hit distribution over time</CardDescription>
            </div>
            <Zap className="h-4 w-4 text-amber-500/40" />
          </CardHeader>
          <CardContent className="pt-2">
            {cacheMetrics && cacheMetrics.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cacheMetrics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground) / 0.5)', fontSize: 10 }}
                    />
                    <YAxis 
                      yAxisId="left" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground) / 0.5)', fontSize: 10 }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground) / 0.5)', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(220 18% 7%)', borderColor: 'hsl(220 16% 14%)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                      labelStyle={{ color: 'hsl(var(--primary))', marginBottom: '4px' }}
                      itemStyle={{ padding: '0px' }}
                      labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="cache_hit_rate_percent"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ r: 0 }}
                      activeDot={{ r: 4, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                      name="Hit Rate %"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cache_entries"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 0 }}
                      name="Vector Entries"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground/30 gap-3 border border-dashed border-[hsl(220_16%_14%)] rounded-xl bg-white/[0.01]">
                <Activity className="h-8 w-8 opacity-20" />
                <p className="text-xs font-bold tracking-widest uppercase">No operational data detected</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation Trends */}
        <Card className="bg-[hsl(220_18%_7%)] border-[hsl(220_16%_14%)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Signal Propagation</CardTitle>
              <CardDescription className="text-xs">Inbound queries and active session volume</CardDescription>
            </div>
            <TrendingUp className="h-4 w-4 text-primary/40" />
          </CardHeader>
          <CardContent className="pt-2">
            {conversationMetrics && conversationMetrics.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversationMetrics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground) / 0.5)', fontSize: 10 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground) / 0.5)', fontSize: 10 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'white', opacity: 0.05 }}
                      contentStyle={{ backgroundColor: 'hsl(220 18% 7%)', borderColor: 'hsl(220 16% 14%)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                      labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                    />
                    <Bar dataKey="total_conversations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Sessions" />
                    <Bar dataKey="total_messages" fill="#3b82f6" opacity={0.4} radius={[4, 4, 0, 0]} name="Signals" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground/30 gap-3 border border-dashed border-[hsl(220_16%_14%)] rounded-xl bg-white/[0.01]">
                <MessageSquare className="h-8 w-8 opacity-20" />
                <p className="text-xs font-bold tracking-widest uppercase">No session activity found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics */}
      <Card className="bg-[hsl(220_18%_7%)] border-[hsl(220_16%_14%)]">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
             <div className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">Scalability Metrics</span>
          </div>
          <CardTitle className="text-lg font-bold">Node Tier Distribution</CardTitle>
          <CardDescription>Enterprise resource allocation across standardized user tiers</CardDescription>
        </CardHeader>
        <CardContent>
          {usageMetrics && usageMetrics.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {usageMetrics.map((tier) => (
                <div key={tier.tier} className="bg-[hsl(220_16%_9%)] border border-[hsl(220_16%_14%)] rounded-2xl p-6 hover:border-primary/20 transition-all group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Zap className="h-4 w-4" />
                       </div>
                       <h4 className="font-bold capitalize group-hover:text-primary transition-colors">{tier.tier} Tier</h4>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-tighter">
                      {tier.user_count} ACTIVE NODES
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Daily Signal Avg</p>
                      <p className="text-xl font-mono font-bold text-foreground">{tier.avg_daily_messages.toFixed(1)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Monthly Signal Avg</p>
                      <p className="text-xl font-mono font-bold text-foreground">{tier.avg_monthly_messages.toFixed(1)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Limit Cap (D)</p>
                      <p className="text-xl font-mono font-bold text-emerald-500/80">{tier.users_at_daily_limit}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Limit Cap (M)</p>
                      <p className="text-xl font-mono font-bold text-emerald-500/80">{tier.users_at_monthly_limit}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground/30 py-16 border-2 border-dashed border-[hsl(220_16%_14%)] rounded-3xl">
              <p className="text-xs font-bold tracking-widest uppercase">Awaiting tier synchronization...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Configuration Trends */}
      {conversationMetrics && conversationMetrics.length > 0 && (
        <Card className="bg-[hsl(220_18%_7%)] border-[hsl(220_16%_14%)]">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Heuristic Calibration</CardTitle>
            <CardDescription>Historical average of LLM temperature and context window allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversationMetrics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground) / 0.5)', fontSize: 10 }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground) / 0.5)', fontSize: 10 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground) / 0.5)', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(220 18% 7%)', borderColor: 'hsl(220 16% 14%)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                    labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                  />
                  <Line
                    yAxisId="left"
                    type="stepAfter"
                    dataKey="avg_context_window"
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={{ r: 0 }}
                    name="Context Window"
                  />
                  <Line
                    yAxisId="right"
                    type="stepAfter"
                    dataKey="avg_temperature"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 0 }}
                    name="Avg Temperature"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
