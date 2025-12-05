import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface DateRangeFilterProps {
    startDate?: Date;
    endDate?: Date;
    onStartDateChange: (date: Date | undefined) => void;
    onEndDateChange: (date: Date | undefined) => void;
    onPresetChange?: (preset: string) => void;
}

const presets = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 3 months', value: '3m' },
    { label: 'Last 6 months', value: '6m' },
    { label: 'Last year', value: '1y' },
    { label: 'All time', value: 'all' },
    { label: 'Custom', value: 'custom' },
];

export function DateRangeFilter({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    onPresetChange,
}: DateRangeFilterProps) {
    const [selectedPreset, setSelectedPreset] = useState('30d');

    const handlePresetChange = (value: string) => {
        setSelectedPreset(value);

        if (value === 'custom') {
            onPresetChange?.(value);
            return;
        }

        const now = new Date();
        let start: Date | undefined;

        switch (value) {
            case '7d':
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '3m':
                start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
            case '6m':
                start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                break;
            case '1y':
                start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            case 'all':
                start = undefined;
                break;
        }

        onStartDateChange(start);
        onEndDateChange(value === 'all' ? undefined : now);
        onPresetChange?.(value);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-2">
            {/* Preset Selector */}
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                    {presets.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Custom Date Range */}
            {selectedPreset === 'custom' && (
                <div className="flex gap-2">
                    {/* Start Date */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'w-full sm:w-[180px] justify-start text-left font-normal',
                                    !startDate && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, 'PPP') : <span>Start date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={onStartDateChange}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    {/* End Date */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'w-full sm:w-[180px] justify-start text-left font-normal',
                                    !endDate && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, 'PPP') : <span>End date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={onEndDateChange}
                                initialFocus
                                disabled={(date) =>
                                    startDate ? date < startDate : false
                                }
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            )}
        </div>
    );
}
