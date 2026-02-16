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
import { TrendingUp, AlertTriangle, Layers } from 'lucide-react';
import type { AdvancedConfig } from '@/lib/automation';

interface AdvancedTriggerBuilderProps {
    value: AdvancedConfig;
    onChange: (value: AdvancedConfig) => void;
}

export function AdvancedTriggerBuilder({ value, onChange }: AdvancedTriggerBuilderProps) {
    const triggerType = value.type || 'simple';

    const handleTypeChange = (type: 'simple' | 'composite' | 'trend' | 'anomaly') => {
        onChange({
            type,
            // Reset config based on type
            ...(type === 'trend' ? { trend_direction: 'increasing', threshold_pct: 10, period_days: 7 } : {}),
            ...(type === 'anomaly' ? { std_dev_multiplier: 2.0 } : {}),
            ...(type === 'composite' ? { operator: 'AND', conditions: [] } : {}),
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Advanced Trigger Options
                </CardTitle>
                <CardDescription>
                    Configure advanced trigger conditions for complex scenarios
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Trigger Type Selection */}
                <div className="space-y-3">
                    <Label>Trigger Type</Label>
                    <RadioGroup value={triggerType} onValueChange={handleTypeChange}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="simple" id="simple" />
                            <Label htmlFor="simple" className="font-normal cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <span>Simple Threshold</span>
                                    <Badge variant="secondary">Basic</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">Single metric comparison</p>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="trend" id="trend" />
                            <Label htmlFor="trend" className="font-normal cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Trend Detection</span>
                                    <Badge>Advanced</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Detect increasing or decreasing patterns over time
                                </p>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="anomaly" id="anomaly" />
                            <Label htmlFor="anomaly" className="font-normal cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Anomaly Detection</span>
                                    <Badge>Advanced</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Detect unusual deviations from normal patterns
                                </p>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="composite" id="composite" />
                            <Label htmlFor="composite" className="font-normal cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4" />
                                    <span>Composite Conditions</span>
                                    <Badge>Pro</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Combine multiple conditions with AND/OR logic
                                </p>
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Trend Configuration */}
                {triggerType === 'trend' && (
                    <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                        <h4 className="font-semibold text-sm">Trend Configuration</h4>

                        <div className="space-y-2">
                            <Label>Trend Direction</Label>
                            <Select
                                value={value.trend_direction}
                                onValueChange={(direction: 'increasing' | 'decreasing') =>
                                    onChange({ ...value, trend_direction: direction })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="increasing">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                            <span>Increasing</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="decreasing">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                                            <span>Decreasing</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Change Threshold (%)</Label>
                            <Input
                                type="number"
                                value={value.threshold_pct || 10}
                                onChange={(e) =>
                                    onChange({ ...value, threshold_pct: parseFloat(e.target.value) })
                                }
                                min="1"
                                max="100"
                                placeholder="10"
                            />
                            <p className="text-xs text-muted-foreground">
                                Trigger when metric changes by this percentage
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Analysis Period (Days)</Label>
                            <Select
                                value={String(value.period_days || 7)}
                                onValueChange={(days) =>
                                    onChange({ ...value, period_days: parseInt(days) })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">7 days</SelectItem>
                                    <SelectItem value="14">14 days</SelectItem>
                                    <SelectItem value="30">30 days</SelectItem>
                                    <SelectItem value="60">60 days</SelectItem>
                                    <SelectItem value="90">90 days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                📊 <strong>Example:</strong> Trigger when revenue is{' '}
                                {value.trend_direction === 'increasing' ? 'increasing' : 'decreasing'} by{' '}
                                {value.threshold_pct || 10}% over the last {value.period_days || 7} days
                            </p>
                        </div>
                    </div>
                )}

                {/* Anomaly Configuration */}
                {triggerType === 'anomaly' && (
                    <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                        <h4 className="font-semibold text-sm">Anomaly Detection Settings</h4>

                        <div className="space-y-2">
                            <Label>Sensitivity (Standard Deviations)</Label>
                            <Select
                                value={String(value.std_dev_multiplier || 2.0)}
                                onValueChange={(multiplier) =>
                                    onChange({ ...value, std_dev_multiplier: parseFloat(multiplier) })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1.5">
                                        <div>
                                            <div className="font-medium">1.5σ - Very Sensitive</div>
                                            <div className="text-xs text-muted-foreground">
                                                ~13% chance of false positives
                                            </div>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="2.0">
                                        <div>
                                            <div className="font-medium">2.0σ - Balanced</div>
                                            <div className="text-xs text-muted-foreground">
                                                ~5% chance of false positives
                                            </div>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="3.0">
                                        <div>
                                            <div className="font-medium">3.0σ - Conservative</div>
                                            <div className="text-xs text-muted-foreground">
                                                ~0.3% chance of false positives
                                            </div>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                            <p className="text-sm text-orange-700 dark:text-orange-300">
                                ⚠️ <strong>How it works:</strong> Compares current value against the last 30 days'
                                average. Triggers when deviation exceeds {value.std_dev_multiplier || 2.0}×
                                standard deviation (unusually high or low values).
                            </p>
                        </div>
                    </div>
                )}

                {/* Composite Configuration */}
                {triggerType === 'composite' && (
                    <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                        <h4 className="font-semibold text-sm">Composite Conditions</h4>

                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <p className="text-sm text-purple-700 dark:text-purple-300">
                                🔧 <strong>Coming Soon:</strong> Composite conditions allow combining multiple
                                triggers with AND/OR logic. This advanced feature will be available in a future
                                update.
                            </p>
                        </div>
                    </div>
                )}

                {/* Simple mode message */}
                {triggerType === 'simple' && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            ℹ️ Using standard threshold-based triggering. Configure your condition in the
                            previous step.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
