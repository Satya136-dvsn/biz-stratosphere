// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DatasetSummary {
    totalDatasets: number;
    totalRecords: number;
    dataTypes: string[];
    dateRange: { min: Date; max: Date } | null;
    sampleData: any[];
}

export function useDataContext() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['data-context', user?.id],
        queryFn: async (): Promise<DatasetSummary> => {
            if (!user) {
                return {
                    totalDatasets: 0,
                    totalRecords: 0,
                    dataTypes: [],
                    dateRange: null,
                    sampleData: [],
                };
            }

            // Fetch user's datasets
            const { data: datasets } = await supabase
                .from('datasets')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (!datasets || datasets.length === 0) {
                return {
                    totalDatasets: 0,
                    totalRecords: 0,
                    dataTypes: [],
                    dateRange: null,
                    sampleData: [],
                };
            }

            // Fetch sample data from chart_data (aggregate view)
            const { data: chartData } = await supabase
                .from('chart_data')
                .select('*')
                .eq('user_id', user.id)
                .limit(100);

            // Extract unique data types/columns
            const dataTypes = chartData && chartData.length > 0
                ? Object.keys(chartData[0]).filter(key => !['id', 'user_id', 'created_at'].includes(key))
                : [];

            // Calculate date range from chart data
            let dateRange: { min: Date; max: Date } | null = null;
            if (chartData && chartData.length > 0) {
                const dates = chartData
                    .map(d => new Date(d.date || d.created_at))
                    .filter(d => !isNaN(d.getTime()));

                if (dates.length > 0) {
                    dateRange = {
                        min: new Date(Math.min(...dates.map(d => d.getTime()))),
                        max: new Date(Math.max(...dates.map(d => d.getTime()))),
                    };
                }
            }

            return {
                totalDatasets: datasets.length,
                totalRecords: chartData?.length || 0,
                dataTypes,
                dateRange,
                sampleData: chartData?.slice(0, 5) || [],
            };
        },
        enabled: !!user,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

// Build context string for AI prompts
export function buildAIContext(context: DatasetSummary): string {
    if (!context || context.totalDatasets === 0) {
        return "The user has not uploaded any data yet.";
    }

    const parts: string[] = [];

    parts.push(`You have access to ${context.totalDatasets} dataset(s) with ${context.totalRecords} total records.`);

    if (context.dataTypes.length > 0) {
        parts.push(`Available data columns: ${context.dataTypes.join(', ')}.`);
    }

    if (context.dateRange) {
        parts.push(
            `Data range: ${context.dateRange.min.toLocaleDateString()} to ${context.dateRange.max.toLocaleDateString()}.`
        );
    }

    if (context.sampleData.length > 0) {
        parts.push(
            `Sample data structure: ${JSON.stringify(context.sampleData[0], null, 2)}`
        );
    }

    return parts.join('\n\n');
}
