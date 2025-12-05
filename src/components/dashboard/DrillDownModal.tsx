import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface DrillDownModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: any[];
    chartType?: string;
}

export function DrillDownModal({
    isOpen,
    onClose,
    title,
    data,
    chartType = 'table',
}: DrillDownModalProps) {
    const handleExport = () => {
        // Convert data to CSV
        if (data.length === 0) return;

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-data.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (!data || data.length === 0) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>
                            No data available for this view.
                        </DialogDescription>
                    </DialogHeader>
                    <Button onClick={onClose} variant="outline">Close</Button>
                </DialogContent>
            </Dialog>
        );
    }

    const columns = Object.keys(data[0]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle>{title}</DialogTitle>
                            <DialogDescription>
                                Showing {data.length} records
                            </DialogDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </DialogHeader>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableHead key={column} className="font-semibold">
                                        {column.charAt(0).toUpperCase() + column.slice(1)}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row, idx) => (
                                <TableRow key={idx}>
                                    {columns.map((column) => (
                                        <TableCell key={column}>
                                            {typeof row[column] === 'number'
                                                ? row[column].toLocaleString()
                                                : row[column]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end">
                    <Button onClick={onClose} variant="outline">
                        <X className="mr-2 h-4 w-4" />
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
