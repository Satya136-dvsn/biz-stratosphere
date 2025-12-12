import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReports, ReportConfig, exportReportAsCSV, exportReportAsJSON } from '@/hooks/useReports';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Download, Loader2, Play, Save, FileDown, Trash2, Copy } from 'lucide-react';

const REPORT_TEMPLATES = [
  { id: 'kpi_summary', name: 'KPI Summary', description: 'Overview of key performance indicators' },
  { id: 'sales_report', name: 'Sales Report', description: 'Revenue, growth, and customer metrics' },
  { id: 'custom', name: 'Custom Report', description: 'Build your own report with selected metrics' },
];

export function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    savedReports,
    isLoading: reportsLoading,
    generateReport,
    saveReport,
    deleteReport,
    isSaving,
  } = useReports();

  // State
  const [showBuilder, setShowBuilder] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');

  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    report_type: 'kpi_summary',
    date_range_start: '',
    date_range_end: '',
    selected_metrics: [],
    selected_dimensions: [],
    filters: {},
  });

  // Fetch datasets for selection
  const { data: datasets = [] } = useQuery({
    queryKey: ['datasets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('datasets')
        .select('id, name, file_name')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch available metrics
  const { data: availableMetrics = [] } = useQuery({
    queryKey: ['available-metrics', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('data_points')
        .select('metric_name')
        .eq('user_id', user.id)
        .limit(100);
      if (error) throw error;
      const uniqueMetrics = [...new Set(data.map(d => d.metric_name))];
      return uniqueMetrics.filter(Boolean);
    },
    enabled: !!user,
  });

  // Handle generate report
  const handleGenerateReport = async () => {
    if (!reportConfig.report_type) {
      toast({
        title: 'Error',
        description: 'Please select a report template',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const report = await generateReport(reportConfig);
      setGeneratedReport(report);
      toast({
        title: 'Success',
        description: `Report generated with ${report.data.length} records`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle save configuration
  const handleSave = () => {
    if (!saveName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name',
        variant: 'destructive',
      });
      return;
    }

    saveReport({
      ...reportConfig,
      name: saveName,
    });

    setShowSaveDialog(false);
    setSaveName('');
  };

  // Handle load saved report
  const handleLoadReport = (config: ReportConfig) => {
    setReportConfig(config);
    setShowBuilder(true);
    toast({
      title: 'Loaded',
      description: config.name,
    });
  };

  //Toggle metric selection
  const toggleMetric = (metric: string) => {
    setReportConfig(prev => ({
      ...prev,
      selected_metrics: prev.selected_metrics.includes(metric)
        ? prev.selected_metrics.filter(m => m !== metric)
        : [...prev.selected_metrics, metric],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">
            Generate comprehensive business reports and analytics
          </p>
        </div>
        <Button onClick={() => setShowBuilder(!showBuilder)}>
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      <Tabs defaultValue="builder" className="space-y-6">
        <TabsList>
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports ({savedReports.length})</TabsTrigger>
          {generatedReport && <TabsTrigger value="preview">Preview</TabsTrigger>}
        </TabsList>

        {/* Report Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Report Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Template Selection */}
                  <div className="space-y-2">
                    <Label>Report Template</Label>
                    <Select
                      value={reportConfig.report_type}
                      onValueChange={(value: any) =>
                        setReportConfig({ ...reportConfig, report_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REPORT_TEMPLATES.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {REPORT_TEMPLATES.find(t => t.id === reportConfig.report_type)?.description}
                    </p>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={reportConfig.date_range_start || ''}
                        onChange={(e) =>
                          setReportConfig({ ...reportConfig, date_range_start: e.target.value })
                        }
                      />
                      <Input
                        type="date"
                        value={reportConfig.date_range_end || ''}
                        onChange={(e) =>
                          setReportConfig({ ...reportConfig, date_range_end: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Dataset Selection */}
                  <div className="space-y-2">
                    <Label>Data Source (Optional)</Label>
                    <Select
                      value={reportConfig.dataset_id || ''}
                      onValueChange={(value) =>
                        setReportConfig({ ...reportConfig, dataset_id: value || undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All datasets" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All datasets</SelectItem>
                        {datasets.map(dataset => (
                          <SelectItem key={dataset.id} value={dataset.id}>
                            {dataset.name || dataset.file_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Metrics Selection */}
                  {reportConfig.report_type === 'custom' && (
                    <div className="space-y-2">
                      <Label>Select Metrics</Label>
                      <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                        {availableMetrics.slice(0, 10).map(metric => (
                          <div key={metric} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={metric}
                              checked={reportConfig.selected_metrics.includes(metric)}
                              onChange={() => toggleMetric(metric)}
                              className="rounded"
                            />
                            <label htmlFor={metric} className="text-sm cursor-pointer">
                              {metric}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateReport}
                      disabled={isGenerating}
                      className="flex-1"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Generate
                    </Button>
                    <Dialog open={showSaveDialog} onValueChange={setShowSaveDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Save className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Save Report Configuration</DialogTitle>
                          <DialogDescription>
                            Save this configuration for later use
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                              value={saveName}
                              onChange={(e) => setSaveName(e.target.value)}
                              placeholder="My Report"
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
                </CardContent>
              </Card>
            </div>

            {/* Template Cards */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Report Templates</CardTitle>
                  <CardDescription>Choose a template to get started</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {REPORT_TEMPLATES.map(template => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-colors ${reportConfig.report_type === template.id
                          ? 'border-primary'
                          : 'hover:border-primary/50'
                          }`}
                        onClick={() =>
                          setReportConfig({ ...reportConfig, report_type: template.id as any })
                        }
                      >
                        <CardContent className="p-4">
                          <FileText className="h-8 w-8 mb-2 text-primary" />
                          <h4 className="font-semibold mb-1">{template.name}</h4>
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Saved Reports Tab */}
        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>Saved Report Configurations</CardTitle>
              <CardDescription>Load or manage your saved report configurations</CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : savedReports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No saved reports yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date Range</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedReports.map(report => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {report.report_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {report.date_range_start || 'All'} → {report.date_range_end || 'Now'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(report.created_at!).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLoadReport(report)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => report.id && deleteReport(report.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        {generatedReport && (
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Report Preview</CardTitle>
                    <CardDescription>
                      {generatedReport.summary.total_records} records · Generated{' '}
                      {new Date(generatedReport.summary.generated_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        exportReportAsCSV(
                          generatedReport.data,
                          generatedReport.config.name || 'report'
                        )
                      }
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        exportReportAsJSON(
                          generatedReport,
                          generatedReport.config.name || 'report'
                        )
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      JSON
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {generatedReport.data.length > 0 &&
                          Object.keys(generatedReport.data[0]).slice(0, 6).map(key => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generatedReport.data.slice(0, 10).map((row: any, idx: number) => (
                        <TableRow key={idx}>
                          {Object.values(row)
                            .slice(0, 6)
                            .map((value: any, vidx: number) => (
                              <TableCell key={vidx} className="text-sm">
                                {String(value).substring(0, 50)}
                              </TableCell>
                            ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {generatedReport.data.length > 10 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      ... and {generatedReport.data.length - 10} more rows
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}