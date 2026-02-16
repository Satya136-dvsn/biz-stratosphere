// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * AI Decision Audit Dashboard - Admin Only
 * 
 * Displays AI response audit logs for admin review.
 * Highlights low-confidence responses and provides filtering.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Shield,
    AlertTriangle,
    CheckCircle,
    AlertCircle,
    Search,
    RefreshCw,
    Calendar,
    Filter,
    BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditEntry {
    id: string;
    user_id: string;
    workspace_id: string | null;
    conversation_id: string | null;
    query: string;
    response_preview: string | null;
    confidence_score: number;
    confidence_level: 'high' | 'medium' | 'low';
    confidence_reasons: string[] | null;
    grounding_score: number | null;
    is_grounded: boolean;
    source_count: number;
    dataset_id: string | null;
    dataset_name: string | null;
    average_similarity: number | null;
    created_at: string;
}

export function AIDecisionAudit() {
    const { isAdmin, loading: authLoading } = useAuth();
    const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<string>('7d');

    // Calculate date range based on filter
    const getDateRange = () => {
        const now = new Date();
        switch (dateFilter) {
            case '24h':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case '7d':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case '30d':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
    };

    // Fetch audit logs
    const { data: audits = [], isLoading, refetch, error } = useQuery({
        queryKey: ['ai-audits', confidenceFilter, dateFilter, searchQuery],
        queryFn: async () => {
            let query = supabase
                .from('ai_response_audits')
                .select('*')
                .gte('created_at', getDateRange().toISOString())
                .order('created_at', { ascending: false })
                .limit(100);

            if (confidenceFilter !== 'all') {
                query = query.eq('confidence_level', confidenceFilter);
            }

            if (searchQuery) {
                query = query.ilike('query', `%${searchQuery}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as AuditEntry[];
        },
        enabled: isAdmin(),
    });

    // Calculate summary stats
    const stats = {
        total: audits.length,
        high: audits.filter(a => a.confidence_level === 'high').length,
        medium: audits.filter(a => a.confidence_level === 'medium').length,
        low: audits.filter(a => a.confidence_level === 'low').length,
        avgConfidence: audits.length > 0
            ? (audits.reduce((sum, a) => sum + a.confidence_score, 0) / audits.length * 100).toFixed(1)
            : 0,
    };

    // Block non-admin access
    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!isAdmin()) {
        return (
            <div className="container mx-auto py-8">
                <Alert variant="destructive">
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        You do not have permission to view this page. Admin access required.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const getConfidenceBadge = (level: string, score: number) => {
        const colors = {
            high: 'bg-green-100 text-green-800 border-green-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-red-100 text-red-800 border-red-200',
        };

        const icons = {
            high: <CheckCircle className="h-3 w-3" />,
            medium: <AlertCircle className="h-3 w-3" />,
            low: <AlertTriangle className="h-3 w-3" />,
        };

        return (
            <Badge className={`${colors[level as keyof typeof colors]} flex items-center gap-1`}>
                {icons[level as keyof typeof icons]}
                {level} ({(score * 100).toFixed(0)}%)
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        AI Decision Audit
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor AI response confidence and grounding for quality assurance.
                    </p>
                </div>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Total Queries</span>
                        </div>
                        <p className="text-2xl font-bold mt-1">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-muted-foreground">High Confidence</span>
                        </div>
                        <p className="text-2xl font-bold mt-1 text-green-600">{stats.high}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-muted-foreground">Medium</span>
                        </div>
                        <p className="text-2xl font-bold mt-1 text-yellow-600">{stats.medium}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-muted-foreground">Low Confidence</span>
                        </div>
                        <p className="text-2xl font-bold mt-1 text-red-600">{stats.low}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            <span className="text-sm text-muted-foreground">Avg Confidence</span>
                        </div>
                        <p className="text-2xl font-bold mt-1">{stats.avgConfidence}%</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search queries..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Confidence Level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                <SelectItem value="high">High Only</SelectItem>
                                <SelectItem value="medium">Medium Only</SelectItem>
                                <SelectItem value="low">Low Only</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="w-[150px]">
                                <Calendar className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Date Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="24h">Last 24 Hours</SelectItem>
                                <SelectItem value="7d">Last 7 Days</SelectItem>
                                <SelectItem value="30d">Last 30 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Audit Log</CardTitle>
                    <CardDescription>
                        Showing {audits.length} AI response audits
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error Loading Audits</AlertTitle>
                            <AlertDescription>{(error as Error).message}</AlertDescription>
                        </Alert>
                    ) : isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : audits.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No audit logs found for the selected filters.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[180px]">Timestamp</TableHead>
                                        <TableHead>Query</TableHead>
                                        <TableHead className="w-[130px]">Confidence</TableHead>
                                        <TableHead className="w-[80px]">Sources</TableHead>
                                        <TableHead className="w-[100px]">Grounded</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {audits.map((audit) => (
                                        <TableRow
                                            key={audit.id}
                                            className={audit.confidence_level === 'low' ? 'bg-red-50/50 dark:bg-red-950/20' : ''}
                                        >
                                            <TableCell className="text-xs text-muted-foreground">
                                                {format(new Date(audit.created_at), 'MMM d, h:mm a')}
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm truncate max-w-[300px]" title={audit.query}>
                                                    {audit.query}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                {getConfidenceBadge(audit.confidence_level, audit.confidence_score)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={audit.source_count === 0 ? 'text-red-500' : ''}>
                                                    {audit.source_count}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {audit.is_grounded ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                                        Yes
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-red-50 text-red-700">
                                                        No
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default AIDecisionAudit;
