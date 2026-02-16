// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Repeat } from 'lucide-react';
import type { ScheduleConfig } from '@/lib/automation';

interface ScheduleBuilderProps {
    value: {
        type: 'manual' | 'cron' | 'interval';
        config: ScheduleConfig;
    };
    onChange: (value: {
        type: 'manual' | 'cron' | 'interval';
        config: ScheduleConfig;
    }) => void;
}

const CRON_PRESETS = [
    { label: 'Every Hour', value: '0 * * * *', description: 'Runs at the start of every hour' },
    { label: 'Every Day at 9 AM', value: '0 9 * * *', description: 'Runs daily at 9:00 AM' },
    { label: 'Every Day at 6 PM', value: '0 18 * * *', description: 'Runs daily at 6:00 PM' },
    { label: 'Every Monday at 9 AM', value: '0 9 * * 1', description: 'Runs every Monday at 9:00 AM' },
    { label: 'Every Weekend at 10 AM', value: '0 10 * * 0,6', description: 'Runs Saturday & Sunday at 10:00 AM' },
    { label: 'Every Weekday at 8 AM', value: '0 8 * * 1-5', description: 'Runs Monday-Friday at 8:00 AM' },
];

const INTERVAL_PRESETS = [
    { label: 'Every 15 minutes', value: 15 },
    { label: 'Every 30 minutes', value: 30 },
    { label: 'Every hour', value: 60 },
    { label: 'Every 2 hours', value: 120 },
    { label: 'Every 6 hours', value: 360 },
    { label: 'Every 12 hours', value: 720 },
    { label: 'Every 24 hours', value: 1440 },
];

export function ScheduleBuilder({ value, onChange }: ScheduleBuilderProps) {
    const [customInterval, setCustomInterval] = useState<string>('');

    const handleTypeChange = (type: 'manual' | 'cron' | 'interval') => {
        onChange({
            type,
            config: type === 'interval' ? { interval_minutes: 60 } : type === 'cron' ? { cron: '0 9 * * *' } : {},
        });
    };

    const handleCronPresetChange = (cron: string) => {
        onChange({
            ...value,
            config: { cron },
        });
    };

    const handleIntervalChange = (minutes: number) => {
        onChange({
            ...value,
            config: { interval_minutes: minutes },
        });
    };

    const handleCustomCron = (cron: string) => {
        onChange({
            ...value,
            config: { cron },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Schedule Configuration
                </CardTitle>
                <CardDescription>
                    Configure when this automation rule should run
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Schedule Type Selection */}
                <div className="space-y-3">
                    <Label>Schedule Type</Label>
                    <RadioGroup value={value.type} onValueChange={handleTypeChange}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="manual" id="manual" />
                            <Label htmlFor="manual" className="font-normal cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <span>Manual Only</span>
                                    <Badge variant="secondary">Default</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">Run manually when you click "Run Now"</p>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="interval" id="interval" />
                            <Label htmlFor="interval" className="font-normal cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <Repeat className="h-4 w-4" />
                                    <span>Fixed Interval</span>
                                </div>
                                <p className="text-sm text-muted-foreground">Run every X minutes</p>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="cron" id="cron" />
                            <Label htmlFor="cron" className="font-normal cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Cron Schedule</span>
                                </div>
                                <p className="text-sm text-muted-foreground">Run on specific days and times</p>
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Interval Configuration */}
                {value.type === 'interval' && (
                    <div className="space-y-3">
                        <Label>Interval</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {INTERVAL_PRESETS.map((preset) => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => handleIntervalChange(preset.value)}
                                    className={`p-3 text-sm border rounded-lg transition-colors ${value.config.interval_minutes === preset.value
                                            ? 'border-primary bg-primary/5 font-medium'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                placeholder="Custom interval"
                                value={customInterval}
                                onChange={(e) => setCustomInterval(e.target.value)}
                                min="1"
                                className="flex-1"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const minutes = parseInt(customInterval);
                                    if (minutes > 0) {
                                        handleIntervalChange(minutes);
                                        setCustomInterval('');
                                    }
                                }}
                                className="px-4 py-2 text-sm border border-border rounded-lg hover:border-primary/50 transition-colors"
                            >
                                Set Custom
                            </button>
                        </div>

                        {value.config.interval_minutes && (
                            <p className="text-sm text-muted-foreground">
                                Rule will run every <strong>{value.config.interval_minutes}</strong> minute
                                {value.config.interval_minutes !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                )}

                {/* Cron Configuration */}
                {value.type === 'cron' && (
                    <div className="space-y-3">
                        <Label>Cron Schedule</Label>
                        <Select value={value.config.cron} onValueChange={handleCronPresetChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a preset schedule" />
                            </SelectTrigger>
                            <SelectContent>
                                {CRON_PRESETS.map((preset) => (
                                    <SelectItem key={preset.value} value={preset.value}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{preset.label}</span>
                                            <span className="text-xs text-muted-foreground">{preset.description}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="space-y-2">
                            <Label className="text-sm">Custom Cron Expression</Label>
                            <Input
                                value={value.config.cron || ''}
                                onChange={(e) => handleCustomCron(e.target.value)}
                                placeholder="0 9 * * *"
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Format: minute hour day month weekday
                            </p>
                        </div>
                    </div>
                )}

                {/* Schedule Summary */}
                {value.type !== 'manual' && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Schedule Summary</p>
                        <p className="text-sm text-muted-foreground">
                            {value.type === 'interval' && value.config.interval_minutes && (
                                `This rule will run automatically every ${value.config.interval_minutes} minute${value.config.interval_minutes !== 1 ? 's' : ''
                                }`
                            )}
                            {value.type === 'cron' && value.config.cron && (
                                `This rule will run on: ${CRON_PRESETS.find((p) => p.value === value.config.cron)?.label || 'Custom schedule'
                                }`
                            )}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
