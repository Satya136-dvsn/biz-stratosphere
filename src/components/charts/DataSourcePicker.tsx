import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DataSourcePickerProps {
    selectedDatasetId?: string;
    onDatasetChange: (datasetId: string) => void;
    selectedXColumn?: string;
    selectedYColumn?: string;
    onXColumnChange: (column: string) => void;
    onYColumnChange: (column: string) => void;
    availableColumns: string[];
}

export function DataSourcePicker({
    selectedDatasetId,
    onDatasetChange,
    selectedXColumn,
    selectedYColumn,
    onXColumnChange,
    onYColumnChange,
    availableColumns,
}: DataSourcePickerProps) {
    const { user } = useAuth();

    const { data: datasets = [], isLoading } = useQuery({
        queryKey: ['datasets', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('datasets')
                .select('id, name, file_name, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Database className="h-5 w-5" />
                    Data Source
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Dataset</Label>
                    <Select
                        value={selectedDatasetId || ''}
                        onValueChange={onDatasetChange}
                        disabled={isLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={isLoading ? "Loading..." : "Select a dataset"} />
                        </SelectTrigger>
                        <SelectContent>
                            {datasets.map((dataset) => (
                                <SelectItem key={dataset.id} value={dataset.id}>
                                    {dataset.name || dataset.file_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {selectedDatasetId && availableColumns.length > 0 && (
                    <>
                        <div className="space-y-2">
                            <Label>X-Axis Column</Label>
                            <Select value={selectedXColumn || ''} onValueChange={onXColumnChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select X column" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableColumns.map((col) => (
                                        <SelectItem key={col} value={col}>
                                            {col}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Y-Axis Column</Label>
                            <Select value={selectedYColumn || ''} onValueChange={onYColumnChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Y column" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableColumns.map((col) => (
                                        <SelectItem key={col} value={col}>
                                            {col}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}

                {selectedDatasetId && availableColumns.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Loading columns...
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
