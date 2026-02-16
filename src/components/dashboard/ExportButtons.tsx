// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, FileText, Table, Image, Loader2 } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF, formatDataForExport } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonsProps {
  kpiData?: any;
  chartData?: any[];
  dashboardElementId?: string;
}

export function ExportButtons({ kpiData, chartData, dashboardElementId }: ExportButtonsProps) {
  const { toast } = useToast();
  const [pdfLoading, setPdfLoading] = useState(false);

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

  /**
   * Captures a DOM element as a canvas image for PDF embedding.
   * Returns null if the element is not found or capture fails.
   */
  async function captureElement(selector: string): Promise<HTMLCanvasElement | null> {
    try {
      const element = document.querySelector(selector) as HTMLElement;
      if (!element) return null;
      const html2canvas = (await import('html2canvas')).default;
      return await html2canvas(element, {
        backgroundColor: '#1a1a2e',
        scale: 2,
        useCORS: true,
        logging: false,
      });
    } catch {
      return null;
    }
  }

  const handleExportDashboard = async () => {
    setPdfLoading(true);
    try {
      const jsPDF = (await import('jspdf')).jsPDF;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let currentY = margin;

      // ──────────── PAGE 1: Executive Summary ────────────

      // Branded Header Bar
      doc.setFillColor(99, 58, 212); // vibrant purple
      doc.rect(0, 0, pageWidth, 28, 'F');
      doc.setFillColor(56, 189, 248); // accent teal bar
      doc.rect(0, 28, pageWidth, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Biz Stratosphere', margin, 14);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Business Intelligence Report', margin, 22);
      doc.text(
        new Date().toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }),
        pageWidth - margin,
        22,
        { align: 'right' }
      );

      currentY = 40;

      // Report Title
      doc.setTextColor(30, 30, 50);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Dashboard Summary', margin, currentY);
      currentY += 12;

      // Divider
      doc.setDrawColor(99, 58, 212);
      doc.setLineWidth(0.8);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;

      // ─── KPI Section ───
      if (kpiData) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(99, 58, 212);
        doc.text('Key Performance Indicators', margin, currentY);
        currentY += 8;

        const kpis = [
          { label: 'Total Revenue', value: `$${(kpiData.totalRevenue || 0).toLocaleString()}`, change: kpiData.revenueChange || 0 },
          { label: 'Active Customers', value: (kpiData.activeCustomers || 0).toLocaleString(), change: kpiData.customersChange || 0 },
          { label: 'Churn Rate', value: `${(kpiData.churnRate || 0).toFixed(1)}%`, change: -(kpiData.churnChange || 0) },
          { label: 'Avg Deal Size', value: `$${(kpiData.averageDealSize || 0).toLocaleString()}`, change: kpiData.dealSizeChange || 0 },
          { label: 'Conversion Rate', value: `${(kpiData.conversionRate || 0).toFixed(1)}%`, change: kpiData.conversionChange || 0 },
          { label: 'Growth Rate', value: `${(kpiData.growthRate || 0).toFixed(1)}%`, change: kpiData.growthChange || 0 },
        ];

        const cardW = (pageWidth - 2 * margin - 10) / 3;
        const cardH = 24;
        kpis.forEach((kpi, index) => {
          const col = index % 3;
          const row = Math.floor(index / 3);
          const x = margin + col * (cardW + 5);
          const y = currentY + row * (cardH + 5);

          // Card background
          doc.setFillColor(245, 243, 255);
          doc.roundedRect(x, y, cardW, cardH, 3, 3, 'F');
          doc.setDrawColor(99, 58, 212);
          doc.setLineWidth(0.3);
          doc.roundedRect(x, y, cardW, cardH, 3, 3, 'S');

          // Label
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 120, 140);
          doc.text(kpi.label.toUpperCase(), x + 4, y + 7);

          // Value
          doc.setFontSize(15);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 30, 50);
          doc.text(kpi.value, x + 4, y + 17);

          // Change indicator
          doc.setFontSize(7);
          const arrow = kpi.change >= 0 ? '▲' : '▼';
          doc.setTextColor(
            ...(kpi.change >= 0 ? [34, 197, 94] : [239, 68, 68]) as [number, number, number]
          );
          doc.text(`${arrow} ${Math.abs(kpi.change).toFixed(1)}%`, x + cardW - 18, y + 17);
        });

        currentY += Math.ceil(kpis.length / 3) * (cardH + 5) + 10;
      }

      // ─── Chart Snapshots ───
      // Try to capture the revenue chart from the DOM
      const chartCanvas = await captureElement('.recharts-wrapper');
      if (chartCanvas) {
        // Check if we need a new page
        if (currentY + 80 > pageHeight - 30) {
          doc.addPage();
          currentY = margin;
        }

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(99, 58, 212);
        doc.text('Revenue Trend', margin, currentY);
        currentY += 6;

        const imgData = chartCanvas.toDataURL('image/png');
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (chartCanvas.height / chartCanvas.width) * imgWidth;
        const clampedHeight = Math.min(imgHeight, 70);

        doc.addImage(imgData, 'PNG', margin, currentY, imgWidth, clampedHeight);
        currentY += clampedHeight + 10;
      }

      // ─── Data Table ───
      if (chartData && chartData.length > 0) {
        if (currentY + 50 > pageHeight - 30) {
          doc.addPage();
          currentY = margin;
        }

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(99, 58, 212);
        doc.text('Data Overview', margin, currentY);
        currentY += 8;

        const headers = Object.keys(chartData[0]).slice(0, 5);
        const colWidth = (pageWidth - 2 * margin) / headers.length;

        // Table header
        doc.setFillColor(99, 58, 212);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        headers.forEach((header, i) => {
          doc.text(header.charAt(0).toUpperCase() + header.slice(1), margin + i * colWidth + 3, currentY + 5);
        });
        currentY += 7;

        // Table rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        const maxRows = Math.min(chartData.length, 12);
        chartData.slice(0, maxRows).forEach((row, rowIndex) => {
          if (currentY > pageHeight - 30) return;

          if (rowIndex % 2 === 0) {
            doc.setFillColor(248, 248, 255);
            doc.rect(margin, currentY, pageWidth - 2 * margin, 6, 'F');
          }

          doc.setTextColor(50, 50, 60);
          headers.forEach((header, i) => {
            const value = row[header];
            const display = typeof value === 'number'
              ? value.toLocaleString()
              : String(value || '').substring(0, 18);
            doc.text(display, margin + i * colWidth + 3, currentY + 4.5);
          });
          currentY += 6;
        });

        if (chartData.length > maxRows) {
          currentY += 3;
          doc.setFontSize(7);
          doc.setTextColor(140, 140, 160);
          doc.text(`... and ${chartData.length - maxRows} more records`, margin, currentY);
        }
      }

      // ──────────── Footer ────────────
      const footerY = pageHeight - 15;
      doc.setDrawColor(200, 200, 210);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

      doc.setFontSize(7);
      doc.setTextColor(140, 140, 160);
      doc.text('Biz Stratosphere Analytics Platform', margin, footerY);
      doc.text('Confidential', pageWidth / 2, footerY, { align: 'center' });
      doc.text('Page 1', pageWidth - margin, footerY, { align: 'right' });

      const filename = `dashboard-report-${new Date().toISOString().split('T')[0]}`;
      doc.save(`${filename}.pdf`);

      toast({
        title: "PDF Exported",
        description: "Professional dashboard report saved successfully",
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export dashboard as PDF",
        variant: "destructive"
      });
    } finally {
      setPdfLoading(false);
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
          disabled={pdfLoading}
          className="flex items-center bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-md hover:shadow-lg transition-all"
        >
          {pdfLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Image className="mr-2 h-4 w-4" />
          )}
          Export Dashboard PDF
        </Button>
      </div>
    </Card>
  );
}