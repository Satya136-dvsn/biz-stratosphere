import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportData {
    data: any[];
    filename: string;
    title?: string;
}

export function useDataExport() {
    // Export to Excel
    const exportToExcel = ({ data, filename }: ExportData) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    // Export to CSV
    const exportToCSV = ({ data, filename }: ExportData) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Export to PDF
    const exportToPDF = async ({ data, filename, title }: ExportData) => {
        const doc = new jsPDF();

        // Add title
        if (title) {
            doc.setFontSize(16);
            doc.text(title, 14, 15);
        }

        // Add data as table
        const headers = Object.keys(data[0] || {});
        const rows = data.map(item => headers.map(header => String(item[header] || '')));

        let y = title ? 25 : 15;

        // Headers
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        headers.forEach((header, i) => {
            doc.text(header, 14 + (i * 40), y);
        });

        // Rows
        doc.setFont('helvetica', 'normal');
        y += 10;
        rows.forEach((row) => {
            if (y > 280) {
                doc.addPage();
                y = 15;
            }
            row.forEach((cell, i) => {
                doc.text(String(cell).substring(0, 20), 14 + (i * 40), y);
            });
            y += 10;
        });

        doc.save(`${filename}.pdf`);
    };

    // Export chart as image
    const exportChartAsImage = async (elementId: string, filename: string) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        const canvas = await html2canvas(element);
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.png`;
        a.click();
    };

    return {
        exportToExcel,
        exportToCSV,
        exportToPDF,
        exportChartAsImage,
    };
}

// Export Button Component
export function ExportButton({ data, filename, title }: ExportData) {
    const { exportToExcel, exportToCSV, exportToPDF } = useDataExport();
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="relative">
            <Button onClick={() => setShowMenu(!showMenu)}>
                <Download className="mr-2 h-4 w-4" />
                Export
            </Button>
            {showMenu && (
                <Card className="absolute right-0 top-12 w-48 z-50 shadow-lg">
                    <CardContent className="p-2">
                        <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                                exportToExcel({ data, filename });
                                setShowMenu(false);
                            }}
                        >
                            Export as Excel
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                                exportToCSV({ data, filename });
                                setShowMenu(false);
                            }}
                        >
                            Export as CSV
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                                exportToPDF({ data, filename, title });
                                setShowMenu(false);
                            }}
                        >
                            Export as PDF
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
