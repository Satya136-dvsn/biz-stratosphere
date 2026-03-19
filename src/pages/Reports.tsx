// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

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
import { SEO } from '@/components/SEO';
import { PageLayout } from '@/components/layout/PageLayout';

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

  const [activeTab, setActiveTab] = useState("builder");

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
      setActiveTab("preview"); // Auto-switch to preview
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
    <PageLayout>
      <SEO title="Reports | Biz Stratosphere" description="Generate enterprise-grade business reports" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(74,124,255,0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">Intelligence Center</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Generate and export comprehensive business performance deep-dives.
          </p>
        </div>
        <Button 
          onClick={() => setShowBuilder(!showBuilder)}
          className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[hsl(220_16%_9%)] border border-[hsl(220_16%_14%)] p-1">
          <TabsTrigger value="builder" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            Report Builder
          </TabsTrigger>
          <TabsTrigger value="saved" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            Saved Library <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none pointer-events-none">{savedReports.length}</Badge>
          </TabsTrigger>
          {generatedReport && (
            <TabsTrigger value="preview" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Preview
            </TabsTrigger>
          )}
        </TabsList>

        {/* Report Builder Tab */}
        <TabsContent value="builder" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="bg-[hsl(220_18%_7%)] border-[hsl(220_16%_14%)] overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-primary/50 to-transparent" />
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Save className="h-4 w-4 text-primary" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Template Selection */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Template</Label>
                    <Select
                      value={reportConfig.report_type}
                      onValueChange={(value: any) =>
                        setReportConfig({ ...reportConfig, report_type: value })
                      }
                    >
                      <SelectTrigger className="bg-[hsl(220_16%_9%)] border-[hsl(220_16%_14%)] text-sm h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[hsl(220_18%_7%)] border-[hsl(220_16%_14%)] text-foreground">
                        {REPORT_TEMPLATES.map(template => (
                          <SelectItem key={template.id} value={template.id} className="text-sm focus:bg-primary/10 focus:text-primary">
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Time Horizon</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={reportConfig.date_range_start || ''}
                        onChange={(e) =>
                          setReportConfig({ ...reportConfig, date_range_start: e.target.value })
                        }
                        className="bg-[hsl(220_16%_9%)] border-[hsl(220_16%_14%)] text-[12px] h-10"
                      />
                      <Input
                        type="date"
                        value={reportConfig.date_range_end || ''}
                        onChange={(e) =>
                          setReportConfig({ ...reportConfig, date_range_end: e.target.value })
                        }
                        className="bg-[hsl(220_16%_9%)] border-[hsl(220_16%_14%)] text-[12px] h-10"
                      />
                    </div>
                  </div>

                  {/* Dataset Selection */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Contextual Dataset</Label>
                    <Select
                      value={reportConfig.dataset_id || ''}
                      onValueChange={(value) =>
                        setReportConfig({ ...reportConfig, dataset_id: value === 'all' ? undefined : value })
                      }
                    >
                      <SelectTrigger className="bg-[hsl(220_16%_9%)] border-[hsl(220_16%_14%)] text-sm h-10">
                        <SelectValue placeholder="All datasets" />
                      </SelectTrigger>
                      <SelectContent className="bg-[hsl(220_18%_7%)] border-[hsl(220_16%_14%)] text-foreground">
                        <SelectItem value="all" className="text-sm focus:bg-primary/10 focus:text-primary">All datasets</SelectItem>
                        {datasets.map(dataset => (
                          <SelectItem key={dataset.id} value={dataset.id} className="text-sm focus:bg-primary/10 focus:text-primary">
                            {dataset.name || dataset.file_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Metrics Selection */}
                  {reportConfig.report_type === 'custom' && (
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Metric Selection</Label>
                      <div className="max-h-56 overflow-y-auto border border-[hsl(220_16%_14%)] bg-[hsl(220_16%_9%)] rounded-xl p-3 space-y-2 custom-scrollbar">
                        {availableMetrics.length > 0 ? availableMetrics.slice(0, 20).map(metric => (
                          <div key={metric} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                            <input
                              type="checkbox"
                              id={metric}
                              checked={reportConfig.selected_metrics.includes(metric)}
                              onChange={() => toggleMetric(metric)}
                              className="rounded border-[hsl(220_16%_20%)] bg-transparent text-primary focus:ring-primary/20 h-4 w-4"
                            />
                            <label htmlFor={metric} className="text-[13px] text-muted-foreground group-hover:text-foreground cursor-pointer transition-colors truncate">
                              {metric}
                            </label>
                          </div>
                        )) : (
                          <p className="text-[12px] text-muted-foreground/50 text-center py-4 italic">No metrics found in context</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleGenerateReport}
                      disabled={isGenerating}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-11 text-xs font-bold"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2 fill-current" />
                      )}
                      RUN ANALYSIS
                    </Button>
                    <Dialog open={showSaveDialog} onValueChange={setShowSaveDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-[hsl(220_16%_14%)] bg-[hsl(220_16%_9%)] hover:bg-white/5 h-11 px-4">
                          <Save className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[hsl(220_18%_7%)] border-[hsl(220_16%_14%)] text-foreground sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold">Persistence</DialogTitle>
                          <DialogDescription className="text-muted-foreground/60">
                            Save this exact configuration for rapid one-click execution later.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label className="text-[11px] font-bold uppercase tracking-wider">Report Name</Label>
                            <Input
                              value={saveName}
                              onChange={(e) => setSaveName(e.target.value)}
                              placeholder="e.g., Q1 Revenue Distribution"
                              className="bg-[hsl(220_16%_9%)] border-[hsl(220_16%_14%)] focus-visible:ring-primary/30"
                            />
                          </div>
                          <Button onClick={handleSave} disabled={isSaving} className="w-full bg-primary hover:bg-primary/90 h-11">
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Store Configuration
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Template Cards */}
            <div className="lg:col-span-8">
              <Card className="bg-[hsl(220_18%_7%)] border-[hsl(220_16%_14%)] h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Analytical Frameworks</CardTitle>
                  <CardDescription>Select a specialized template for your current business query</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {REPORT_TEMPLATES.map(template => (
                      <div
                        key={template.id}
                        className={cn(
                          "relative group cursor-pointer p-6 rounded-2xl border transition-all duration-300",
                          reportConfig.report_type === template.id
                            ? 'bg-primary/5 border-primary/50 shadow-[0_0_20px_rgba(74,124,255,0.1)]'
                            : 'bg-[hsl(220_16%_9%)] border-[hsl(220_16%_14%)] hover:border-primary/30 hover:bg-white/[0.02]'
                        )}
                        onClick={() =>
                          setReportConfig({ ...reportConfig, report_type: template.id as any })
                        }
                      >
                        <div className={cn(
                          "h-10 w-10 flex items-center justify-center rounded-xl mb-4 transition-colors",
                          reportConfig.report_type === template.id ? 'bg-primary text-white' : 'bg-[hsl(220_16%_14%)] text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'
                        )}>
                          {template.id === 'kpi_summary' ? <TrendingUp className="h-5 w-5" /> : 
                           template.id === 'sales_report' ? <FileText className="h-5 w-5" /> : 
                           <Copy className="h-5 w-5" />}
                        </div>
                        <h4 className="font-bold text-foreground mb-1.5">{template.name}</h4>
                        <p className="text-[12px] text-muted-foreground/60 leading-relaxed">{template.description}</p>
                        
                        {reportConfig.report_type === template.id && (
                          <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pro-tip section */}
                  <div className="mt-10 p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="text-[13px] font-bold text-foreground">AI Intelligence Tip</h5>
                      <p className="text-[12px] text-muted-foreground/70 mt-1 leading-relaxed">
                        The "Custom Report" template combined with automated PDF export is currently the preferred choice for monthly executive briefings.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Saved Reports Tab */}
        <TabsContent value="saved" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <Card className="bg-[hsl(220_18%_7%)] border-[hsl(220_16%_14%)] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Personal Library</CardTitle>
              <CardDescription>Your saved analytical configurations and periodic report skeletons</CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                  <p className="text-sm font-medium text-muted-foreground/50 tracking-widest">SYNCHRONIZING...</p>
                </div>
              ) : savedReports.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed border-[hsl(220_16%_14%)] rounded-3xl bg-[hsl(220_16%_9%)]">
                  <div className="h-16 w-16 bg-[hsl(220_16%_12%)] rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Archive Empty</h3>
                  <p className="text-sm text-muted-foreground/50 mt-1.5 max-w-[280px] mx-auto">
                    Generate and save your first analysis configuration to see it here.
                  </p>
                </div>
              ) : (
                <div className="border border-[hsl(220_16%_14%)] rounded-2xl overflow-hidden bg-[hsl(220_16%_9%)]">
                  <Table>
                    <TableHeader className="bg-[hsl(220_18%_7%)]">
                      <TableRow className="border-b border-[hsl(220_16%_14%)] hover:bg-transparent">
                        <TableHead className="text-[11px] font-bold uppercase py-4">Name</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase py-4">Archetype</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase py-4">Temporal Scope</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase py-4">Stored At</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase py-4 text-right pr-6">Management</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {savedReports.map(report => (
                        <TableRow key={report.id} className="border-b border-[hsl(220_16%_14%)] hover:bg-white/[0.02] transition-colors group">
                          <TableCell className="font-semibold text-foreground py-4">{report.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold py-0.5 tracking-wide">
                              {report.report_type.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[13px] text-muted-foreground/70">
                            {report.date_range_start ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{report.date_range_start}</span>
                                <ArrowRight className="h-3 w-3" />
                                <span className="font-mono">{report.date_range_end || 'NOW'}</span>
                              </div>
                            ) : (
                              <span className="italic opacity-40">Unrestricted Horizon</span>
                            )}
                          </TableCell>
                          <TableCell className="text-[13px] text-muted-foreground/50 font-mono">
                            {new Date(report.created_at!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                                onClick={() => handleLoadReport(report)}
                              >
                                <Play className="h-3.5 w-3.5 fill-current" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                onClick={() => report.id && deleteReport(report.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        {generatedReport && (
          <TabsContent value="preview" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <Card className="bg-[hsl(220_18%_7%)] border-[hsl(220_16%_14%)] overflow-hidden">
              <div className="h-1 w-full bg-emerald-500/40" />
              <CardHeader className="pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5 px-2 py-0 text-[10px] uppercase font-bold tracking-widest">Live Output</Badge>
                       <span className="text-xs text-muted-foreground/50 font-mono">UUID: {generatedReport.id?.substring(0, 8) || 'volat'}</span>
                    </div>
                    <CardTitle className="text-xl font-bold">Analysis Output</CardTitle>
                    <CardDescription className="flex items-center gap-2 text-muted-foreground/60">
                      <FileText className="h-3.5 w-3.5" />
                      {generatedReport.summary.total_records} indexed segments · Runtime: {new Date(generatedReport.summary.generated_at).toLocaleTimeString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-[hsl(220_16%_9%)] border-[hsl(220_16%_14%)] hover:bg-white/5 text-xs font-bold transition-all"
                      onClick={() =>
                        exportReportAsCSV(
                          generatedReport.data,
                          generatedReport.config.name || 'report'
                        )
                      }
                    >
                      <FileDown className="h-3.5 w-3.5 mr-2 opacity-60" />
                      EXPORT CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-[hsl(220_16%_9%)] border-[hsl(220_16%_14%)] hover:bg-white/5 text-xs font-bold transition-all"
                      onClick={() =>
                        exportReportAsJSON(
                          generatedReport,
                          generatedReport.config.name || 'report'
                        )
                      }
                    >
                      <Download className="h-3.5 w-3.5 mr-2 opacity-60" />
                      RAW JSON
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-[hsl(220_16%_14%)] overflow-hidden bg-[hsl(220_16%_9%)]">
                  <div className="max-h-[600px] overflow-auto custom-scrollbar">
                    <Table>
                      <TableHeader className="bg-[hsl(220_18%_7%)] sticky top-0 z-10 shadow-sm shadow-black/20">
                        <TableRow className="border-b border-[hsl(220_16%_14%)] hover:bg-transparent">
                          {(() => {
                            const processedData = generatedReport.data.reduce((acc: any[], item: any) => {
                              if (item.metric_name === 'raw_csv_row' && item.metadata?.row_data) {
                                acc.push(item.metadata.row_data);
                              }
                              return acc;
                            }, []);
                            const displayData = processedData.length > 0 ? processedData : generatedReport.data;
                            if (displayData.length === 0) return <TableHead className="text-[11px] font-bold uppercase py-4">No Output Segments Found</TableHead>;
                            
                            return Object.keys(displayData[0]).slice(0, 10).map(key => (
                              <TableHead key={key} className="text-[11px] font-bold uppercase py-4 text-muted-foreground whitespace-nowrap min-w-[120px]">
                                {key.replace(/_/g, ' ')}
                              </TableHead>
                            ));
                          })()}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const processedData = generatedReport.data.reduce((acc: any[], item: any) => {
                            if (item.metric_name === 'raw_csv_row' && item.metadata?.row_data) {
                              acc.push(item.metadata.row_data);
                            }
                            return acc;
                          }, []);
                          const displayData = processedData.length > 0 ? processedData : generatedReport.data;

                          return displayData.map((row: any, idx: number) => (
                            <TableRow key={idx} className="border-b border-[hsl(220_16%_14%)] hover:bg-white/[0.01] transition-colors group">
                              {Object.values(row)
                                .slice(0, 10)
                                .map((value: any, vidx: number) => (
                                  <TableCell key={vidx} className="py-3 text-[13px] font-mono text-muted-foreground/80 group-hover:text-foreground transition-colors">
                                    {typeof value === 'object' ? 
                                      <span className="text-[11px] opacity-40 italic">{'{Object}'}</span> : 
                                      String(value).length > 60 ? String(value).substring(0, 60) + '...' : String(value)
                                    }
                                  </TableCell>
                                ))}
                            </TableRow>
                          ));
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </PageLayout>
  );
}