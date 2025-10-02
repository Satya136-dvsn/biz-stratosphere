import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, FileText, Table, Image } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF, formatDataForExport } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonsProps {
  kpiData?: any;
  chartData?: any[];
  dashboardElementId?: string;
}

export function ExportButtons({ kpiData, chartData, dashboardElementId }: ExportButtonsProps) {
  const { toast } = useToast();

  const handleExportKPI = async (format: 'csv' | 'excel') => {
    if (!kpiData) {
      toast({
        title: "No Data",
        description: "No KPI data available to export",
        variant: "destructive"
      });
      return;
    }

    try {
      const exportData = formatDataForExport([kpiData], 'kpi');
      const filename = `kpi-report-${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'csv') {
        exportToCSV(exportData, filename);
      } else {
        exportToExcel(exportData, filename);
      }
      
      toast({
        title: "Export Successful",
        description: `KPI data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export KPI data",
        variant: "destructive"
      });
    }
  };

  const handleExportChart = async (format: 'csv' | 'excel') => {
    if (!chartData || chartData.length === 0) {
      toast({
        title: "No Data",
        description: "No chart data available to export",
        variant: "destructive"
      });
      return;
    }

    try {
      const exportData = formatDataForExport(chartData, 'chart');
      const filename = `chart-data-${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'csv') {
        exportToCSV(exportData, filename);
      } else {
        exportToExcel(exportData, filename);
      }
      
      toast({
        title: "Export Successful",
        description: `Chart data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export chart data",
        variant: "destructive"
      });
    }
  };

  const handleExportDashboard = async () => {
    if (!dashboardElementId) {
      toast({
        title: "Export Not Available",
        description: "Dashboard export is not configured",
        variant: "destructive"
      });
      return;
    }

    try {
      const filename = `dashboard-${new Date().toISOString().split('T')[0]}`;
      await exportToPDF(dashboardElementId, filename);
      
      toast({
        title: "Export Successful",
        description: "Dashboard exported as PDF",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export dashboard as PDF",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Download className="mr-2 h-5 w-5" />
          Export Data
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {/* KPI Exports */}
          <Button
            variant="outline" 
            size="sm"
            onClick={() => handleExportKPI('csv')}
            className="flex items-center"
          >
            <FileText className="mr-2 h-4 w-4" />
            KPI CSV
          </Button>
          
          <Button
            variant="outline" 
            size="sm"
            onClick={() => handleExportKPI('excel')}
            className="flex items-center"
          >
            <Table className="mr-2 h-4 w-4" />
            KPI Excel
          </Button>
          
          {/* Chart Exports */}
          <Button
            variant="outline" 
            size="sm"
            onClick={() => handleExportChart('csv')}
            className="flex items-center"
          >
            <FileText className="mr-2 h-4 w-4" />
            Chart CSV
          </Button>
          
          <Button
            variant="outline" 
            size="sm"
            onClick={() => handleExportChart('excel')}
            className="flex items-center"
          >
            <Table className="mr-2 h-4 w-4" />
            Chart Excel
          </Button>
        </div>
        
        {/* Dashboard PDF Export */}
        <Button
          variant="default" 
          size="sm"
          onClick={handleExportDashboard}
          className="flex items-center bg-gradient-primary"
        >
          <Image className="mr-2 h-4 w-4" />
          Export Dashboard PDF
        </Button>
      </div>
    </Card>
  );
}