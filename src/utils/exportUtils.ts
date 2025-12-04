import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export interface ExportData {
  [key: string]: any;
}

export const exportToCSV = (data: ExportData[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const csvOutput = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
};

export const exportToExcel = (data: ExportData[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = async (elementId: string, filename: string) => {
  // Dynamic import to reduce bundle size
  const html2canvas = await import('html2canvas');
  const jsPDF = await import('jspdf');
  
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const canvas = await html2canvas.default(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  });
  
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF.jsPDF('l', 'mm', 'a4');
  
  const imgWidth = 290;
  const pageHeight = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  
  let position = 10;
  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight + 10;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  
  pdf.save(`${filename}.pdf`);
};

export const formatDataForExport = (data: any[], type: 'kpi' | 'chart') => {
  if (type === 'kpi') {
    return data.map(item => ({
      Date: new Date().toLocaleDateString(),
      'Total Revenue': item.totalRevenue || 0,
      'Active Customers': item.activeCustomers || 0,
      'Churn Rate': `${item.churnRate || 0}%`,
      'Average Deal Size': item.averageDealSize || 0,
      'Revenue Change': `${item.revenueChange || 0}%`,
      'Customer Change': `${item.customersChange || 0}%`
    }));
  }
  
  if (type === 'chart') {
    return data.map(item => ({
      Date: item.month || item.date,
      Revenue: item.revenue || 0,
      Target: item.target || 0,
      Customers: item.customers || 0
    }));
  }
  
  return data;
};