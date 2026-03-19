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
        <div className="rounded-xl border border-[hsl(220_16%_14%)] bg-[hsl(220_18%_7.5%)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[hsl(220_16%_12%)]">
                <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
                </div>
                <p className="text-[11px] text-muted-foreground/50 mt-0.5">Common tasks and operations</p>
            </div>
            <div className="p-3">
                <div className="grid grid-cols-2 gap-2">
                    {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.id}
                                onClick={action.action}
                                className="group flex flex-col items-start gap-2 p-3 rounded-lg border border-transparent bg-[hsl(220_16%_9%)] hover:border-[hsl(220_16%_18%)] hover:bg-[hsl(220_16%_10%)] transition-all duration-150 text-left"
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <div className={cn("p-1.5 rounded-md bg-[hsl(220_16%_13%)] group-hover:bg-[hsl(220_16%_16%)] transition-colors", action.color)}>
                                        <Icon className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-xs font-semibold text-foreground/90 truncate">{action.title}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground/50 leading-snug">
                                    {action.description}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

