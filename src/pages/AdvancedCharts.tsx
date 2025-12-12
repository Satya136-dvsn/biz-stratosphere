import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie,
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Cell, FunnelChart, Funnel, LabelList,
} from 'recharts';
import { ChartTypeSelector, ChartType } from '@/components/dashboard/ChartTypeSelector';
import { DataSourcePicker } from '@/components/charts/DataSourcePicker';
import { ChartFilters, ChartFiltersState } from '@/components/charts/ChartFilters';
import { ChartCustomizer, ChartCustomization } from '@/components/charts/ChartCustomizer';
import { RadarChartComponent } from '@/components/charts/RadarChartComponent';
import { TreemapChart } from '@/components/charts/TreemapChart';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { useChartConfigurations, exportChartAsImage, exportDataAsCSV } from '@/hooks/useChartConfigurations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Save, Download, FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

export default function AdvancedCharts() {
    const { user } = useAuth();
    const { toast } = useToast();
    const chartRef = useRef<HTMLDivElement>(null);

    // State
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [selectedDatasetId, setSelectedDatasetId] = useState<string>();
    const [xColumn, setXColumn] = useState<string>();
    const [yColumn, setYColumn] = useState<string>();
    const [filters, setFilters] = useState<ChartFiltersState>({ numericRanges: {} });
    const [customization, setCustomization] = useState<ChartCustomization>({
        title: 'My Chart',
        showLegend: true,
        showGrid: true,
        showTooltip: true,
        primaryColor: '#8884d8',
        secondaryColor: '#82ca9d',
        width: 600,
        height: 400,
    });
    const [saveName, setSaveName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    const { configurations, saveConfiguration, isSaving } = useChartConfigurations();

    // Fetch data points for selected dataset
    const { data: chartData = [], isLoading: dataLoading } = useQuery({
        queryKey: ['chart-data-points', selectedDatasetId, filters],
        queryFn: async () => {
            if (!selectedDatasetId || !user) return [];

            let query = supabase
                .from('data_points')
                .select('*')
                .eq('dataset_id', selectedDatasetId)
                .limit(500);

            // Apply date filter if set
            if (filters.dateRange?.start) {
                query = query.gte('date_recorded', filters.dateRange.start);
            }
            if (filters.dateRange?.end) {
                query = query.lte('date_recorded', filters.dateRange.end);
            }

            const { data, error } = await query;
            if (error) throw error;

            let filteredData = data || [];

            // Apply numeric range filters
            if (filters.numericRanges && Object.keys(filters.numericRanges).length > 0) {
                Object.entries(filters.numericRanges).forEach(([column, range]) => {
                    if (range.min !== undefined || range.max !== undefined) {
                        filteredData = filteredData.filter(point => {
                            const value = parseFloat(point.metric_value);
                            if (isNaN(value)) return false;
                            if (range.min !== undefined && value < range.min) return false;
                            if (range.max !== undefined && value > range.max) return false;
                            return true;
                        });
                    }
                });
            }

            // Apply search filter
            if (filters.searchText) {
                const searchLower = filters.searchText.toLowerCase();
                filteredData = filteredData.filter(point =>
                    point.metric_name?.toLowerCase().includes(searchLower)
                );
            }

            return filteredData;
        },
        enabled: !!selectedDatasetId && !!user,
    });

    // Get available columns from data
    const availableColumns = chartData.length > 0 ? Object.keys(chartData[0]).filter(key =>
        !['id', 'user_id', 'dataset_id', 'created_at'].includes(key)
    ) : [];

    // Get numeric columns for filters
    const numericColumns = availableColumns.filter(col => {
        if (chartData.length === 0) return false;
        const value = chartData[0][col];
        return !isNaN(parseFloat(String(value)));
    });

    // Transform data for charts
    const transformedData = chartData.map(point => ({
        name: point.metric_name || 'Unknown',
        value: parseFloat(point.metric_value) || 0,
        [xColumn || 'x']: point[xColumn || 'metric_name'],
        [yColumn || 'y']: parseFloat(point[yColumn || 'metric_value']) || 0,
    }));

    // Handle save configuration
    const handleSave = () => {
        if (!saveName.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a name for this configuration',
                variant: 'destructive',
            });
            return;
        }

        saveConfiguration({
            name: saveName,
            chart_type: chartType,
            dataset_id: selectedDatasetId,
            x_column: xColumn,
            y_column: yColumn,
            filters,
            customization,
        });

        setShowSaveDialog(false);
        setSaveName('');
    };

    // Handle export as image
    const handleExportImage = async () => {
        if (!chartRef.current) return;

        try {
            await exportChartAsImage(chartRef.current, customization.title || 'chart');
            toast({
                title: 'Success',
                description: 'Chart exported as PNG',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to export chart',
                variant: 'destructive',
            });
        }
    };

    // Handle export data as CSV
    const handleExportCSV = () => {
        if (transformedData.length === 0) {
            toast({
                title: 'Error',
                description: 'No data to export',
                variant: 'destructive',
            });
            return;
        }

        exportDataAsCSV(transformedData, customization.title || 'chart-data');
        toast({
            title: 'Success',
            description: 'Data exported as CSV',
        });
    };

    // Render the appropriate chart
    const renderChart = () => {
        if (dataLoading) {
            return (
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            );
        }

        if (transformedData.length === 0) {
            return (
                <div className="flex items-center justify-center h-96 text-muted-foreground">
                    Select a dataset and configure your chart to begin
                </div>
            );
        }

        const commonProps = {
            width: customization.width,
            height: customization.height,
        };

        switch (chartType) {
            case 'line':
                return (
                    <ResponsiveContainer {...commonProps}>
                        <LineChart data={transformedData}>
                            {customization.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                            <XAxis dataKey="name" />
                            <YAxis />
                            {customization.showTooltip && <Tooltip />}
                            {customization.showLegend && <Legend />}
                            <Line type="monotone" dataKey="value" stroke={customization.primaryColor} />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'bar':
                return (
                    <ResponsiveContainer {...commonProps}>
                        <BarChart data={transformedData}>
                            {customization.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                            <XAxis dataKey="name" />
                            <YAxis />
                            {customization.showTooltip && <Tooltip />}
                            {customization.showLegend && <Legend />}
                            <Bar dataKey="value" fill={customization.primaryColor} />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer {...commonProps}>
                        <AreaChart data={transformedData}>
                            {customization.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                            <XAxis dataKey="name" />
                            <YAxis />
                            {customization.showTooltip && <Tooltip />}
                            {customization.showLegend && <Legend />}
                            <Area type="monotone" dataKey="value" fill={customization.primaryColor} stroke={customization.secondaryColor} />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer {...commonProps}>
                        <PieChart>
                            <Pie data={transformedData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {transformedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            {customization.showTooltip && <Tooltip />}
                            {customization.showLegend && <Legend />}
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'scatter':
                return (
                    <ResponsiveContainer {...commonProps}>
                        <ScatterChart>
                            {customization.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                            <XAxis dataKey={xColumn || 'x'} name={xColumn || 'X'} />
                            <YAxis dataKey={yColumn || 'y'} name={yColumn || 'Y'} />
                            {customization.showTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} />}
                            {customization.showLegend && <Legend />}
                            <Scatter name="Data" data={transformedData} fill={customization.primaryColor} />
                        </ScatterChart>
                    </ResponsiveContainer>
                );

            case 'radar':
                return (
                    <RadarChartComponent
                        data={transformedData.slice(0, 8)}
                        dataKey="value"
                        nameKey="name"
                        title={customization.title}
                        color={customization.primaryColor}
                        showLegend={customization.showLegend}
                        showTooltip={customization.showTooltip}
                    />
                );

            case 'treemap':
                return (
                    <TreemapChart
                        data={transformedData}
                        title={customization.title}
                        showTooltip={customization.showTooltip}
                    />
                );

            case 'gauge':
                const gaugeValue = transformedData.length > 0 ? transformedData[0].value : 0;
                return (
                    <GaugeChart
                        value={gaugeValue}
                        maxValue={100}
                        title={customization.title}
                        color={customization.primaryColor}
                        showLegend={customization.showLegend}
                    />
                );

            case 'funnel':
                return (
                    <ResponsiveContainer {...commonProps}>
                        <FunnelChart>
                            {customization.showTooltip && <Tooltip />}
                            <Funnel
                                dataKey="value"
                                data={transformedData.map((item, idx) => ({
                                    ...item,
                                    fill: COLORS[idx % COLORS.length],
                                }))}
                                isAnimationActive
                            >
                                <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                );

            default:
                return <div>Unsupported chart type</div>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Advanced Charts</h2>
                    <p className="text-muted-foreground">
                        Create custom visualizations with your data
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleExportCSV} variant="outline">
                        <FileDown className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button onClick={handleExportImage} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export PNG
                    </Button>
                    <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Save className="h-4 w-4 mr-2" />
                                Save Configuration
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Save Chart Configuration</DialogTitle>
                                <DialogDescription>
                                    Save this chart configuration for later use
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Configuration Name</Label>
                                    <Input
                                        value={saveName}
                                        onChange={(e) => setSaveName(e.target.value)}
                                        placeholder="My Chart Configuration"
                                    />
                                </div>
                                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Save
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="space-y-4">
                    <ChartTypeSelector
                        selectedType={chartType}
                        onTypeChange={setChartType}
                    />

                    <DataSourcePicker
                        selectedDatasetId={selectedDatasetId}
                        onDatasetChange={setSelectedDatasetId}
                        selectedXColumn={xColumn}
                        selectedYColumn={yColumn}
                        onXColumnChange={setXColumn}
                        onYColumnChange={setYColumn}
                        availableColumns={availableColumns}
                    />

                    <ChartFilters
                        filters={filters}
                        onFiltersChange={setFilters}
                        numericColumns={numericColumns}
                    />

                    <ChartCustomizer
                        customization={customization}
                        onCustomizationChange={setCustomization}
                    />
                </div>

                {/* Chart Area */}
                <div className="lg:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>{customization.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div ref={chartRef}>
                                {renderChart()}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Saved Configurations */}
                    {configurations.length > 0 && (
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Saved Configurations ({configurations.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-2">
                                    {configurations.slice(0, 6).map((config) => (
                                        <Button
                                            key={config.id}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setChartType(config.chart_type);
                                                setSelectedDatasetId(config.dataset_id);
                                                setXColumn(config.x_column);
                                                setYColumn(config.y_column);
                                                setFilters(config.filters);
                                                setCustomization(config.customization);
                                                toast({
                                                    title: 'Configuration Loaded',
                                                    description: config.name,
                                                });
                                            }}
                                        >
                                            {config.name}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
