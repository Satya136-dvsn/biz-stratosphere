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
    try {
      const jsPDF = (await import('jspdf')).jsPDF;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let currentY = margin;

      // Professional Header with Branding
      doc.setFillColor(139, 92, 246); // Purple
      doc.rect(0, 0, pageWidth, 25, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Biz Stratosphere', margin, 12);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Business Intelligence Dashboard Report', margin, 19);

      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin - 60, 19);

      currentY = 35;

      // Report Title
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary Dashboard', margin, currentY);
      currentY += 15;

      // KPI Section
      if (kpiData) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 92, 246);
        doc.text('📊 Key Performance Indicators', margin, currentY);
        currentY += 10;

        // KPI Cards with styling
        const kpis = [
          { label: 'Total Revenue', value: `$${(kpiData.totalRevenue || 0).toLocaleString()}`, change: kpiData.revenueChange || 0 },
          { label: 'Active Customers', value: (kpiData.activeCustomers || 0).toLocaleString(), change: kpiData.customersChange || 0 },
          { label: 'Churn Rate', value: `${(kpiData.churnRate || 0).toFixed(1)}%`, change: -kpiData.churnRate || 0 },
          { label: 'Avg Deal Size', value: `$${(kpiData.averageDealSize || 0).toLocaleString()}`, change: kpiData.dealChange || 0 },
        ];

        kpis.forEach((kpi, index) => {
          const x = margin + (index % 2) * 90;
          const y = currentY + Math.floor(index / 2) * 25;

          // KPI Box
          doc.setFillColor(250, 250, 250);
          doc.roundedRect(x, y, 80, 20, 2, 2, 'F');
          doc.setDrawColor(139, 92, 246);
          doc.setLineWidth(0.3);
          doc.roundedRect(x, y, 80, 20, 2, 2, 'S');

          // KPI Label
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(kpi.label, x + 5, y + 7);

          // KPI Value
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(kpi.value, x + 5, y + 15);

          // Change indicator
          doc.setFontSize(7);
          const changeColor = kpi.change >= 0 ? [34, 197, 94] : [239, 68, 68];
          doc.setTextColor(changeColor[0], changeColor[1], changeColor[2]);
          const arrow = kpi.change >= 0 ? '↑' : '↓';
          doc.text(`${arrow} ${Math.abs(kpi.change).toFixed(1)}%`, x + 60, y + 15);
        });

        currentY += 60;
      }

      // Chart Data Section
      if (chartData && chartData.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 92, 246);
        doc.text('📈 Data Overview', margin, currentY);
        currentY += 10;

        // Summary metrics
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(`Total Data Points: ${chartData.length}`, margin, currentY);

        if (chartData.length > 0 && chartData[0].revenue !== undefined) {
          const totalRevenue = chartData.reduce((sum, item) => sum + (item.revenue || 0), 0);
          const avgRevenue = totalRevenue / chartData.length;
          doc.text(`Total Revenue: $${totalRevenue.toLocaleString()}`, margin + 60, currentY);
          doc.text(`Average: $${avgRevenue.toLocaleString()}`, margin + 120, currentY);
        }

        currentY += 10;

        // Mini table of recent data
        if (chartData.length > 0) {
          const headers = Object.keys(chartData[0]).slice(0, 4);
          const colWidth = (pageWidth - 2 * margin) / headers.length;

          // Table header
          doc.setFillColor(139, 92, 246);
          doc.rect(margin, currentY, pageWidth - 2 * margin, 8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');

          headers.forEach((header, i) => {
            doc.text(header, margin + i * colWidth + 2, currentY + 6);
          });

          currentY += 8;

          // Table rows (up to 10)
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          chartData.slice(0, 10).forEach((row, rowIndex) => {
            if (currentY > pageHeight - 40) return; // Stop if near page end

            if (rowIndex % 2 === 0) {
              doc.setFillColor(250, 250, 250);
              doc.rect(margin, currentY, pageWidth - 2 * margin, 6, 'F');
            }

            doc.setTextColor(0, 0, 0);
            headers.forEach((header, i) => {
              const value = row[header];
              const displayValue = typeof value === 'number' ? value.toLocaleString() : String(value || '');
              doc.text(displayValue.substring(0, 15), margin + i * colWidth + 2, currentY + 4);
            });

            currentY += 6;
          });

          if (chartData.length > 10) {
            currentY += 5;
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`... and ${chartData.length - 10} more records`, margin, currentY);
          }
        }
      }

      // Footer with page info
      currentY = pageHeight - 30;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, currentY, pageWidth - margin, currentY);

      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Biz Stratosphere Analytics Platform', margin, currentY + 8);
      doc.text('© 2025 All Rights Reserved', pageWidth / 2, currentY + 8, { align: 'center' });
      doc.text(`Page 1`, pageWidth - margin - 10, currentY + 8);

      // Summary box
      doc.setDrawColor(139, 92, 246);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, currentY + 12, pageWidth - 2 * margin, 12, 2, 2, 'S');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text('📧 For support or questions, contact: d.v.satyanarayana260@gmail.com', margin + 3, currentY + 18);

      const filename = `dashboard-report-${new Date().toISOString().split('T')[0]}`;
      doc.save(`${filename}.pdf`);

      toast({
        title: "Export Successful",
        description: "Professional dashboard report exported as PDF",
      });
    } catch (error) {
      console.error('PDF export error:', error);
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