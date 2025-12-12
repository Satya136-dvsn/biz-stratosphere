import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Palette } from 'lucide-react';

export interface ChartCustomization {
    title: string;
    showLegend: boolean;
    showGrid: boolean;
    showTooltip: boolean;
    primaryColor: string;
    secondaryColor: string;
    width: number;
    height: number;
}

interface ChartCustomizerProps {
    customization: ChartCustomization;
    onCustomizationChange: (customization: ChartCustomization) => void;
}

export function ChartCustomizer({ customization, onCustomizationChange }: ChartCustomizerProps) {
    const update = (key: keyof ChartCustomization, value: any) => {
        onCustomizationChange({
            ...customization,
            [key]: value,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Palette className="h-5 w-5" />
                    Customization
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                    <Label>Chart Title</Label>
                    <Input
                        value={customization.title}
                        onChange={(e) => update('title', e.target.value)}
                        placeholder="Enter chart title"
                    />
                </div>

                {/* Toggle Options */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Show Legend</Label>
                        <Switch
                            checked={customization.showLegend}
                            onCheckedChange={(checked) => update('showLegend', checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Show Grid</Label>
                        <Switch
                            checked={customization.showGrid}
                            onCheckedChange={(checked) => update('showGrid', checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Show Tooltip</Label>
                        <Switch
                            checked={customization.showTooltip}
                            onCheckedChange={(checked) => update('showTooltip', checked)}
                        />
                    </div>
                </div>

                {/* Colors */}
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Primary Color</Label>
                        <div className="flex gap-2">
                            <Input
                                type="color"
                                value={customization.primaryColor}
                                onChange={(e) => update('primaryColor', e.target.value)}
                                className="w-16 h-10"
                            />
                            <Input
                                value={customization.primaryColor}
                                onChange={(e) => update('primaryColor', e.target.value)}
                                placeholder="#8884d8"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Secondary Color</Label>
                        <div className="flex gap-2">
                            <Input
                                type="color"
                                value={customization.secondaryColor}
                                onChange={(e) => update('secondaryColor', e.target.value)}
                                className="w-16 h-10"
                            />
                            <Input
                                value={customization.secondaryColor}
                                onChange={(e) => update('secondaryColor', e.target.value)}
                                placeholder="#82ca9d"
                            />
                        </div>
                    </div>
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Width</Label>
                        <Input
                            type="number"
                            value={customization.width}
                            onChange={(e) => update('width', parseInt(e.target.value) || 600)}
                            min={300}
                            max={1200}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Height</Label>
                        <Input
                            type="number"
                            value={customization.height}
                            onChange={(e) => update('height', parseInt(e.target.value) || 400)}
                            min={200}
                            max={800}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
