// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
    const actions: QuickAction[] = [
        {
            id: '1',
            title: 'Upload Data',
            description: 'Import new CSV data',
            icon: Upload,
            color: 'text-primary',
            action: () => console.log('Upload data')
        },
        {
            id: '2',
            title: 'Export Report',
            description: 'Download analytics',
            icon: Download,
            color: 'text-success',
            action: () => console.log('Export report')
        },
        {
            id: '3',
            title: 'Generate Insights',
            description: 'AI-powered analysis',
            icon: Brain,
            color: 'text-secondary',
            action: () => console.log('Generate insights')
        },
        {
            id: '4',
            title: 'View Trends',
            description: 'Analyze patterns',
            icon: TrendingUp,
            color: 'text-info',
            action: () => console.log('View trends')
        },
        {
            id: '5',
            title: 'Quick Analysis',
            description: 'Instant metrics',
            icon: Zap,
            color: 'text-warning',
            action: () => console.log('Quick analysis')
        },
        {
            id: '6',
            title: 'Data Template',
            description: 'Download sample',
            icon: FileSpreadsheet,
            color: 'text-accent',
            action: () => console.log('Download template')
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
