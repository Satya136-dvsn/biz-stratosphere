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
                <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                    <div className="w-24 h-24 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Create Your First Chart</h3>
                    <p className="text-muted-foreground max-w-md">
                        Select a dataset from the sidebar and choose your chart type to begin visualizing your data
                    </p>
                    <div className="mt-6 flex gap-2 text-sm text-muted-foreground">
                        <span className="px-3 py-1 bg-secondary rounded-full">📊 8 Chart Types</span>
                        <span className="px-3 py-1 bg-secondary rounded-full">🎨 Customizable</span>
                        <span className="px-3 py-1 bg-secondary rounded-full">💾 Save Configs</span>
                    </div>
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

            {/* Main Layout - Compact Design */}
            <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
                {/* Compact Sidebar */}
                <Card className="h-fit max-h-[calc(100vh-200px)] overflow-y-auto">
                    <CardContent className="p-4 space-y-6">
                        {/* Chart Type Section */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Chart Type</h3>
                            <ChartTypeSelector
                                selectedType={chartType}
                                onTypeChange={setChartType}
                            />
                        </div>

                        <div className="border-t" />

                        {/* Data Source Section */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data Source</h3>
                            <DataSourcePicker
                                selectedDatasetId={selectedDatasetId}
                                onDatasetChange={setSelectedDatasetId}
                                selectedXColumn={xColumn}
                                selectedYColumn={yColumn}
                                onXColumnChange={setXColumn}
                                onYColumnChange={setYColumn}
                                availableColumns={availableColumns}
                            />
                        </div>

                        <div className="border-t" />

                        {/* Filters Section */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filters</h3>
                            <ChartFilters
                                filters={filters}
                                onFiltersChange={setFilters}
                                numericColumns={numericColumns}
                            />
                        </div>

                        <div className="border-t" />

                        {/* Customization Section */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customization</h3>
                            <ChartCustomizer
                                customization={customization}
                                onCustomizationChange={setCustomization}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Chart Area - Flexible width */}
                <div className="space-y-6">
                    <Card className="shadow-lg border-2">
                        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
                            <CardTitle className="text-xl">{customization.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div ref={chartRef} className="min-h-[400px] flex items-center justify-center">
                                {renderChart()}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Saved Configurations */}
                    {configurations.length > 0 && (
                        <Card className="border-2">
                            <CardHeader className="bg-secondary/20">
                                <CardTitle className="flex items-center gap-2">
                                    <Save className="h-5 w-5" />
                                    Saved Configurations
                                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                                        {configurations.length} saved
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {configurations.slice(0, 6).map((config) => (
                                        <Button
                                            key={config.id}
                                            variant="outline"
                                            size="sm"
                                            className="h-auto py-3 flex flex-col items-start hover:bg-primary/5 hover:border-primary transition-all"
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
                                            <span className="font-semibold text-xs">{config.name}</span>
                                            <span className="text-xs text-muted-foreground capitalize">{config.chart_type}</span>
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
