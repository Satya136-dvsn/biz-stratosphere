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

    // Export to PDF - Professional Version
    const exportToPDF = async ({ data, filename, title }: ExportData) => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let currentY = margin;

        // Helper function to add header
        const addHeader = () => {
            // Company Logo & Branding
            doc.setFillColor(139, 92, 246); // Purple
            doc.rect(0, 0, pageWidth, 15, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Biz Stratosphere', margin, 10);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text('AI-Powered Business Intelligence', margin, 14);
        };

        // Helper function to add footer
        const addFooter = (pageNum: number) => {
            doc.setTextColor(128, 128, 128);
            doc.setFontSize(8);
            const footerText = `Page ${pageNum} | Generated on ${new Date().toLocaleDateString()} | Biz Stratosphere Analytics`;
            doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });

            // Footer line
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        };

        // Add first page header
        addHeader();
        currentY = 25;

        // Report Title
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        if (title) {
            doc.text(title, margin, currentY);
            currentY += 10;
        }

        // Report Metadata Box
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 20, 2, 2, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(`Generated: ${new Date().toLocaleString()}`, margin + 5, currentY + 7);
        doc.text(`Total Records: ${data.length}`, margin + 5, currentY + 14);
        doc.text(`Format: PDF`, pageWidth - margin - 30, currentY + 7);
        currentY += 30;

        // Table Data
        if (data.length > 0) {
            const headers = Object.keys(data[0]);
            const rows = data.map(item => headers.map(header => {
                const value = item[header];
                if (value === null || value === undefined) return '';
                if (typeof value === 'number') return value.toLocaleString();
                return String(value);
            }));

            // Import jsPDF-AutoTable if available, otherwise use manual table
            try {
                // Using manual table with better formatting
                const colWidth = (pageWidth - 2 * margin) / headers.length;

                // Table headers
                doc.setFillColor(139, 92, 246);
                doc.rect(margin, currentY, pageWidth - 2 * margin, 10, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');

                headers.forEach((header, i) => {
                    doc.text(
                        header.length > 15 ? header.substring(0, 12) + '...' : header,
                        margin + (i * colWidth) + 2,
                        currentY + 7
                    );
                });

                currentY += 10;

                // Table rows
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                let pageNumber = 1;

                rows.forEach((row, rowIndex) => {
                    // Check if we need a new page
                    if (currentY > pageHeight - 40) {
                        addFooter(pageNumber);
                        doc.addPage();
                        addHeader();
                        pageNumber++;
                        currentY = 35;

                        // Re-add table headers
                        doc.setFillColor(139, 92, 246);
                        doc.rect(margin, currentY, pageWidth - 2 * margin, 10, 'F');
                        doc.setTextColor(255, 255, 255);
                        doc.setFont('helvetica', 'bold');
                        headers.forEach((header, i) => {
                            doc.text(
                                header.length > 15 ? header.substring(0, 12) + '...' : header,
                                margin + (i * colWidth) + 2,
                                currentY + 7
                            );
                        });
                        currentY += 10;
                        doc.setFont('helvetica', 'normal');
                    }

                    // Alternate row colors
                    if (rowIndex % 2 === 0) {
                        doc.setFillColor(250, 250, 250);
                        doc.rect(margin, currentY, pageWidth - 2 * margin, 8, 'F');
                    }

                    doc.setTextColor(0, 0, 0);
                    row.forEach((cell, i) => {
                        const cellText = cell.length > 20 ? cell.substring(0, 17) + '...' : cell;
                        doc.text(cellText, margin + (i * colWidth) + 2, currentY + 6);
                    });

                    currentY += 8;
                });

                // Add footer to last page
                addFooter(pageNumber);

            } catch (error) {
                console.error('Error creating table:', error);
                doc.text('Error generating table. Please try another format.', margin, currentY);
            }
        } else {
            doc.setTextColor(128, 128, 128);
            doc.text('No data available to export.', margin, currentY);
            addFooter(1);
        }

        // Add final touches - Summary box if space available
        if (currentY < pageHeight - 60) {
            currentY = pageHeight - 50;
            doc.setDrawColor(139, 92, 246);
            doc.setLineWidth(0.5);
            doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 25, 2, 2, 'S');

            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('📊 Analytics Report', margin + 5, currentY + 7);
            doc.text(`This report contains ${data.length} records with ${Object.keys(data[0] || {}).length} fields.`, margin + 5, currentY + 13);
            doc.text('For questions or support, contact: d.v.satyanarayana260@gmail.com', margin + 5, currentY + 19);
        }

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
