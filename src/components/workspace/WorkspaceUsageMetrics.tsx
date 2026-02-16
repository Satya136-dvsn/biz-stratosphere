// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Workspace Usage Metrics Component
 * 
 * Displays usage metrics for the current workspace:
 * - Uploads
 * - AI Queries
 * - Automation Triggers
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, MessageSquare, Zap, TrendingUp, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface UsageMetric {
    metric_type: 'upload' | 'ai_query' | 'automation_trigger';
    total_count: number;
    unique_users: number;
    date: string;
}

interface UsageSummary {
    uploads: number;
    aiQueries: number;
    automationTriggers: number;
    trend: {
        uploads: number;
        aiQueries: number;
        automationTriggers: number;
    };
}

export function WorkspaceUsageMetrics() {
    const { currentWorkspace } = useWorkspaces();

    // Fetch usage metrics for last 30 days
    const { data: metrics, isLoading, error } = useQuery({
        queryKey: ['workspace-usage', currentWorkspace?.id],
        queryFn: async () => {
            if (!currentWorkspace?.id) return [];

            const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

            const { data, error } = await supabase
                .from('workspace_usage')
                .select('metric_type, metric_count, date_bucket')
                .eq('workspace_id', currentWorkspace.id)
                .gte('date_bucket', thirtyDaysAgo);

            if (error) throw error;
            return data || [];
        },
        enabled: !!currentWorkspace?.id,
    });

    // Calculate summary
    const summary: UsageSummary = {
        uploads: 0,
        aiQueries: 0,
        automationTriggers: 0,
        trend: { uploads: 0, aiQueries: 0, automationTriggers: 0 },
    };

    if (metrics && metrics.length > 0) {
        const sevenDaysAgo = subDays(new Date(), 7);

        metrics.forEach((m: any) => {
            const count = m.metric_count || 0;
            const date = new Date(m.date_bucket);
            const isRecent = date >= sevenDaysAgo;

            switch (m.metric_type) {
                case 'upload':
                    summary.uploads += count;
                    if (isRecent) summary.trend.uploads += count;
                    break;
                case 'ai_query':
                    summary.aiQueries += count;
                    if (isRecent) summary.trend.aiQueries += count;
                    break;
                case 'automation_trigger':
                    summary.automationTriggers += count;
                    if (isRecent) summary.trend.automationTriggers += count;
                    break;
            }
        });
    }

    if (!currentWorkspace) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    Select a workspace to view usage metrics.
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Usage Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Usage Metrics
                </CardTitle>
                <CardDescription>
                    Workspace activity for the last 30 days
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Uploads */}
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="font-medium">Data Uploads</p>
                            <p className="text-xs text-muted-foreground">
                                {summary.trend.uploads} in last 7 days
                            </p>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {summary.uploads}
                    </p>
                </div>

                {/* AI Queries */}
                <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="font-medium">AI Queries</p>
                            <p className="text-xs text-muted-foreground">
                                {summary.trend.aiQueries} in last 7 days
                            </p>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {summary.aiQueries}
                    </p>
                </div>

                {/* Automation Triggers */}
                <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                            <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="font-medium">Automation Triggers</p>
                            <p className="text-xs text-muted-foreground">
                                {summary.trend.automationTriggers} in last 7 days
                            </p>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {summary.automationTriggers}
                    </p>
                </div>

                {/* Period indicator */}
                <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                        {format(subDays(new Date(), 30), 'MMM d')} - {format(new Date(), 'MMM d, yyyy')}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

export default WorkspaceUsageMetrics;
