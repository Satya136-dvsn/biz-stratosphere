import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';

export interface ChartFiltersState {
    dateRange?: { start: string; end: string };
    searchText?: string;
    numericRanges: Record<string, { min: number; max: number }>;
}

interface ChartFiltersProps {
    filters: ChartFiltersState;
    onFiltersChange: (filters: ChartFiltersState) => void;
    numericColumns: string[];
}

export function ChartFilters({ filters, onFiltersChange, numericColumns }: ChartFiltersProps) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleApply = () => {
        onFiltersChange(localFilters);
    };

    const handleClear = () => {
        const cleared: ChartFiltersState = {
            numericRanges: {},
        };
        setLocalFilters(cleared);
        onFiltersChange(cleared);
    };

    const updateNumericRange = (column: string, type: 'min' | 'max', value: string) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;

        setLocalFilters(prev => ({
            ...prev,
            numericRanges: {
                ...prev.numericRanges,
                [column]: {
                    ...(prev.numericRanges[column] || { min: 0, max: 100 }),
                    [type]: numValue,
                },
            },
        }));
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleClear}>
                        <X className="h-4 w-4 mr-1" />
                        Clear All
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Date Range */}
                <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="date"
                            value={localFilters.dateRange?.start || ''}
                            onChange={(e) =>
                                setLocalFilters(prev => ({
                                    ...prev,
                                    dateRange: {
                                        start: e.target.value,
                                        end: prev.dateRange?.end || '',
                                    },
                                }))
                            }
                            placeholder="Start date"
                        />
                        <Input
                            type="date"
                            value={localFilters.dateRange?.end || ''}
                            onChange={(e) =>
                                setLocalFilters(prev => ({
                                    ...prev,
                                    dateRange: {
                                        start: prev.dateRange?.start || '',
                                        end: e.target.value,
                                    },
                                }))
                            }
                            placeholder="End date"
                        />
                    </div>
                </div>

                {/* Search */}
                <div className="space-y-2">
                    <Label>Search</Label>
                    <Input
                        type="text"
                        value={localFilters.searchText || ''}
                        onChange={(e) =>
                            setLocalFilters(prev => ({
                                ...prev,
                                searchText: e.target.value,
                            }))
                        }
                        placeholder="Search in data..."
                    />
                </div>

                {/* Numeric Ranges */}
                {numericColumns.length > 0 && (
                    <div className="space-y-3">
                        <Label>Numeric Ranges</Label>
                        {numericColumns.slice(0, 3).map(column => (
                            <div key={column} className="space-y-2">
                                <Label className="text-sm text-muted-foreground">{column}</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Min"
                                        value={localFilters.numericRanges[column]?.min || ''}
                                        onChange={(e) => updateNumericRange(column, 'min', e.target.value)}
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={localFilters.numericRanges[column]?.max || ''}
                                        onChange={(e) => updateNumericRange(column, 'max', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Button onClick={handleApply} className="w-full">
                    Apply Filters
                </Button>
            </CardContent>
        </Card>
    );
}
