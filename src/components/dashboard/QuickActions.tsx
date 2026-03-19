// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
    Upload,
    Download,
    FileSpreadsheet,
    Brain,
    TrendingUp,
    Zap
} from "lucide-react";

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: typeof Upload;
    color: string;
    action: () => void;
}

export function QuickActions() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const downloadSampleCSV = () => {
        const csvContent = `# NOTE: This is only an example template. It is NOT mandatory to follow this format.
# Biz Stratosphere works with ANY CSV data - your own columns and structure are fully supported.
# The system auto-detects column types (numeric, date, text) and adapts accordingly.
metric_name,metric_value,metric_type,date_recorded
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

        toast({
            title: "Template Downloaded",
            description: "Sample CSV template has been downloaded. Fill it with your data and use Upload Data to import.",
        });
    };

    const openDataUpload = () => {
        // Click the "Manage Data" sheet trigger button in the dashboard header
        const manageDataBtn = document.querySelector<HTMLButtonElement>(
            'button:has(.lucide-upload)'
        );
        if (manageDataBtn) {
            manageDataBtn.click();
        } else {
            // Fallback: scroll to Upload section or show toast
            toast({
                title: "Upload Data",
                description: "Use the 'Manage Data' button at the top of the dashboard to upload CSV files.",
            });
        }
    };

    const actions: QuickAction[] = [
        {
            id: '1',
            title: 'Upload Data',
            description: 'Import new CSV data',
            icon: Upload,
            color: 'text-primary',
            action: openDataUpload
        },
        {
            id: '2',
            title: 'Export Report',
            description: 'Download analytics',
            icon: Download,
            color: 'text-success',
            action: () => navigate('/reports')
        },
        {
            id: '3',
            title: 'Generate Insights',
            description: 'AI-powered analysis',
            icon: Brain,
            color: 'text-secondary',
            action: () => navigate('/ai-analytics')
        },
        {
            id: '4',
            title: 'View Trends',
            description: 'Analyze patterns',
            icon: TrendingUp,
            color: 'text-info',
            action: () => navigate('/advanced-charts')
        },
        {
            id: '5',
            title: 'Quick Analysis',
            description: 'Instant metrics',
            icon: Zap,
            color: 'text-warning',
            action: () => navigate('/ml-predictions')
        },
        {
            id: '6',
            title: 'Data Template',
            description: 'Download sample',
            icon: FileSpreadsheet,
            color: 'text-accent',
            action: downloadSampleCSV
        }
    ];

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-warning" />
                    Quick Actions
                </CardTitle>
                <CardDescription>Common tasks and operations</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Button
                                key={action.id}
                                variant="outline"
                                className="h-auto flex flex-col items-start gap-2 p-3 hover:bg-muted/50 hover-lift bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300"
                                onClick={action.action}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <div className={cn("p-1.5 rounded-md bg-foreground/5", action.color)}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-semibold text-left line-clamp-1">{action.title}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground text-left leading-tight line-clamp-2">
                                    {action.description}
                                </p>
                            </Button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
