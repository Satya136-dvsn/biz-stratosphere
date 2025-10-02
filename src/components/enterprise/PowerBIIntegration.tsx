import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompany } from '@/hooks/useCompany';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  RefreshCw, 
  Download, 
  Settings, 
  Key, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface PowerBISettings {
  workspace_id?: string;
  dataset_id?: string;
  access_token?: string;
  powerbi_api_key?: string;
  auto_refresh_enabled?: boolean;
  refresh_frequency?: string;
}

export function PowerBIIntegration() {
  const { company, updateCompany, hasPermission } = useCompany();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  
  const [settings, setSettings] = useState<PowerBISettings>({
    workspace_id: '',
    dataset_id: '',
    access_token: '',
    powerbi_api_key: '',
    auto_refresh_enabled: false,
    refresh_frequency: 'daily'
  });

  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (company?.settings) {
      setSettings({
        workspace_id: company.settings.powerbi_workspace_id || '',
        dataset_id: company.settings.powerbi_dataset_id || '',
        access_token: company.settings.powerbi_access_token || '',
        powerbi_api_key: company.settings.powerbi_api_key || '',
        auto_refresh_enabled: company.settings.auto_refresh_enabled || false,
        refresh_frequency: company.settings.refresh_frequency || 'daily'
      });
    }
  }, [company]);

  const canManageIntegration = hasPermission('company', 'admin');

  const handleSaveSettings = async () => {
    if (!canManageIntegration) return;

    setLoading(true);
    try {
      const updatedSettings = {
        ...company?.settings,
        powerbi_workspace_id: settings.workspace_id,
        powerbi_dataset_id: settings.dataset_id,
        powerbi_access_token: settings.access_token,
        powerbi_api_key: settings.powerbi_api_key || crypto.randomUUID(),
        auto_refresh_enabled: settings.auto_refresh_enabled,
        refresh_frequency: settings.refresh_frequency
      };

      const { error } = await updateCompany({ settings: updatedSettings });
      
      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Power BI settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving Power BI settings:', error);
      toast({
        title: "Error",
        description: "Failed to save Power BI settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshLoading(true);
    setRefreshStatus('running');
    
    try {
      const { error } = await supabase.functions.invoke('powerbi-scheduled-refresh', {
        body: {}
      });

      if (error) {
        throw error;
      }

      setRefreshStatus('success');
      setLastRefresh(new Date().toISOString());
      
      toast({
        title: "Success",
        description: "Power BI dataset refresh initiated successfully",
      });
    } catch (error) {
      console.error('Error refreshing Power BI dataset:', error);
      setRefreshStatus('error');
      
      toast({
        title: "Error",
        description: "Failed to refresh Power BI dataset",
        variant: "destructive",
      });
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleGenerateReport = async (reportType: string) => {
    setReportLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('powerbi-report-generator', {
        body: {
          report_type: reportType,
          date_range: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          },
          format: 'json'
        }
      });

      if (error) {
        throw error;
      }

      // Download the report
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `${reportType} report generated and downloaded successfully`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setReportLoading(false);
    }
  };

  const getRefreshStatusIcon = () => {
    switch (refreshStatus) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!company) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No company information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Power BI Integration</h1>
          <p className="text-muted-foreground">Connect and sync data with Microsoft Power BI</p>
        </div>
        <Badge variant={settings.workspace_id ? 'default' : 'secondary'}>
          {settings.workspace_id ? 'Connected' : 'Not Connected'}
        </Badge>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="refresh" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Data Refresh
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Power BI Configuration
              </CardTitle>
              <CardDescription>
                Configure your Power BI workspace and dataset connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="workspace-id">Workspace ID</Label>
                  <Input
                    id="workspace-id"
                    value={settings.workspace_id}
                    onChange={(e) => setSettings({ ...settings, workspace_id: e.target.value })}
                    placeholder="12345678-1234-1234-1234-123456789012"
                    disabled={!canManageIntegration}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataset-id">Dataset ID</Label>
                  <Input
                    id="dataset-id"
                    value={settings.dataset_id}
                    onChange={(e) => setSettings({ ...settings, dataset_id: e.target.value })}
                    placeholder="12345678-1234-1234-1234-123456789012"
                    disabled={!canManageIntegration}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="access-token">Access Token</Label>
                <Input
                  id="access-token"
                  type="password"
                  value={settings.access_token}
                  onChange={(e) => setSettings({ ...settings, access_token: e.target.value })}
                  placeholder="Enter your Power BI access token"
                  disabled={!canManageIntegration}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Automatic Refresh Settings</h4>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-refresh"
                    checked={settings.auto_refresh_enabled}
                    onChange={(e) => setSettings({ ...settings, auto_refresh_enabled: e.target.checked })}
                    disabled={!canManageIntegration}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="auto-refresh">Enable automatic data refresh</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refresh-frequency">Refresh Frequency</Label>
                  <select
                    id="refresh-frequency"
                    value={settings.refresh_frequency}
                    onChange={(e) => setSettings({ ...settings, refresh_frequency: e.target.value })}
                    disabled={!canManageIntegration || !settings.auto_refresh_enabled}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="hourly">Every Hour</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              {canManageIntegration && (
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Configuration
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refresh" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Data Refresh Control
              </CardTitle>
              <CardDescription>
                Manually trigger data refreshes or check refresh status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getRefreshStatusIcon()}
                  <div>
                    <p className="font-medium">Refresh Status</p>
                    <p className="text-sm text-muted-foreground">
                      {refreshStatus === 'idle' && 'Ready to refresh'}
                      {refreshStatus === 'running' && 'Refresh in progress...'}
                      {refreshStatus === 'success' && 'Last refresh successful'}
                      {refreshStatus === 'error' && 'Last refresh failed'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleManualRefresh}
                  disabled={refreshLoading || !settings.workspace_id}
                  variant="outline"
                >
                  {refreshLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  Refresh Now
                </Button>
              </div>

              {lastRefresh && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Last refresh: {new Date(lastRefresh).toLocaleString()}
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">Refresh Schedule</h4>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    {settings.auto_refresh_enabled 
                      ? `Automatic refresh enabled - ${settings.refresh_frequency}`
                      : 'Automatic refresh disabled - manual refresh only'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary Report</CardTitle>
                <CardDescription>
                  High-level overview of key metrics and KPIs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleGenerateReport('summary')}
                  disabled={reportLoading}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Summary
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detailed Report</CardTitle>
                <CardDescription>
                  Comprehensive data export with all records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleGenerateReport('detailed')}
                  disabled={reportLoading}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Detailed
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trend Analysis</CardTitle>
                <CardDescription>
                  Time-series analysis and trend identification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleGenerateReport('trend_analysis')}
                  disabled={reportLoading}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Trends
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Access Configuration
              </CardTitle>
              <CardDescription>
                API endpoints for Power BI data connectivity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.powerbi_api_key || 'Not configured'}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (settings.powerbi_api_key) {
                        navigator.clipboard.writeText(settings.powerbi_api_key);
                        toast({
                          title: "Copied",
                          description: "API key copied to clipboard",
                        });
                      }
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Data Endpoint</Label>
                <Input
                  value={`${window.location.origin}/functions/v1/powerbi-data-endpoint`}
                  readOnly
                  className="font-mono text-sm"
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Usage Instructions</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Use the API key in the 'x-api-key' header</li>
                  <li>Send POST requests to the data endpoint</li>
                  <li>Include table name and optional filters in request body</li>
                  <li>Response will contain paginated data in JSON format</li>
                </ol>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Example Request</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`curl -X POST '${window.location.origin}/functions/v1/powerbi-data-endpoint' \\
  -H 'x-api-key: ${settings.powerbi_api_key || 'YOUR_API_KEY'}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "table": "data_points",
    "date_from": "2024-01-01",
    "date_to": "2024-12-31",
    "filters": {
      "metric_name": "revenue"
    }
  }'`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}