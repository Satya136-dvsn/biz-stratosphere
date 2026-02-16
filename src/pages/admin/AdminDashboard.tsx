// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Users, Activity, Database, AlertCircle, Building } from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export const AdminDashboard = () => {
  const { stats, signups, loading, error } = useAdminStats();

  if (error) {
    return (
      <PageLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      </PageLayout>
    );
  }

  // Helper for loading state cards
  const StatCard = ({ title, value, icon: Icon, desc, onClick, className }: any) => (
    <Card onClick={onClick} className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{value}</div>}
        <p className="text-xs text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Control Plane</h1>
          <p className="text-muted-foreground">System Overview & Live Metrics (Real-time)</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Users"
            value={stats?.total_users}
            icon={Users}
            desc={stats ? `${stats.active_users_1h} active in last 1h` : "..."}
            onClick={() => window.location.href = '/admin/users'}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
          />
          <StatCard
            title="Workspaces"
            value={stats?.total_workspaces}
            icon={Building}
            desc="Active Teams"
          />
          <StatCard
            title="API Requests (24h)"
            value={stats?.api_requests_24h}
            icon={Activity}
            desc="Across all endpoints"
          />
          <StatCard
            title="ML Predictions (24h)"
            value={stats?.predictions_24h}
            icon={Database}
            desc="Inferenced models"
            onClick={() => window.location.href = '/admin/ai'}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>User Growth (30 Days)</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              {loading ? (
                <div className="h-[200px] flex items-center justify-center"><Skeleton className="h-[180px] w-full" /></div>
              ) : (
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={signups}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#8884d8" fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Security (RLS)</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Enforced</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">API Latency</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Normal</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className={`h - 4 w - 4 ${stats?.recent_errors_24h ?? 0 > 0 ? "text-yellow-500" : "text-green-500"} `} />
                    <span className="text-sm font-medium">Error Rate</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{stats?.recent_errors_24h || 0} recent</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

