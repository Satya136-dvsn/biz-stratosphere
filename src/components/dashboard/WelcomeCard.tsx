// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, Download } from 'lucide-react';

export function WelcomeCard() {
    const downloadSampleCSV = () => {
        const csvContent = `metric_name,metric_value,metric_type,date_recorded
revenue,50000,currency,2024-12-01
revenue,55000,currency,2024-11-01
revenue,48000,currency,2024-10-01
customers,150,number,2024-12-01
customers,145,number,2024-11-01
customers,140,number,2024-10-01
churn,5,percentage,2024-12-01
churn,6,percentage,2024-11-01
churn,4,percentage,2024-10-01`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample-data-template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Welcome to Your Dashboard! 🎉</CardTitle>
                    <Badge variant="outline" className="text-xs">
                        Getting Started
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <p className="text-muted-foreground">
                        Your dashboard is ready! Upload your business data to unlock powerful AI-driven insights and analytics.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-card/50 border border-border/40 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="rounded-full bg-primary/10 p-2">
                                <Download className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">Step 1</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Download our sample CSV template to see the expected format
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadSampleCSV}
                            className="w-full"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download Template
                        </Button>
                    </div>

                    <div className="p-4 rounded-lg bg-card/50 border border-border/40 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="rounded-full bg-accent/10 p-2">
                                <FileSpreadsheet className="h-4 w-4 text-accent" />
                            </div>
                            <span className="font-medium">Step 2</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Prepare your data in CSV or Excel format with metrics and dates
                        </p>
                    </div>

                    <div className="p-4 rounded-lg bg-card/50 border border-border/40 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="rounded-full bg-revenue/10 p-2">
                                <Upload className="h-4 w-4 text-revenue" />
                            </div>
                            <span className="font-medium">Step 3</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Upload your file using the Data Upload section below
                        </p>
                    </div>
                </div>

                <div className="p-4 rounded-lg bg-info/5 border border-info/20">
                    <p className="text-sm text-info">
                        <strong>💡 Pro Tip:</strong> Include metrics like revenue, customers, churn rate, and deal size for best results
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
