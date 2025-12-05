import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, TrendingDown, DollarSign, Users, Package, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecentActivity } from "@/hooks/useRecentActivity";

interface ActivityItem {
    id: string;
    type: 'revenue' | 'customer' | 'sale' | 'alert' | 'upload';
    title: string;
    description: string;
    timestamp: string;
    trend?: 'up' | 'down';
    amount?: number;
}

const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
        case 'revenue':
            return DollarSign;
        case 'customer':
            return Users;
        case 'sale':
            return Package;
        case 'upload':
            return Upload;
        case 'alert':
            return Activity;
    }
};

const getIconColor = (type: ActivityItem['type']) => {
    switch (type) {
        case 'revenue':
            return 'text-success bg-success/10';
        case 'customer':
            return 'text-info bg-info/10';
        case 'sale':
            return 'text-primary bg-primary/10';
        case 'upload':
            return 'text-secondary bg-secondary/10';
        case 'alert':
            return 'text-warning bg-warning/10';
    }
};

export function RecentActivity() {
    const { data: activities = [], isLoading } = useRecentActivity();

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Recent Activity
                </CardTitle>
                <CardDescription>Latest updates and events</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-start gap-4 p-3 rounded-lg animate-pulse">
                                <div className="w-10 h-10 bg-muted rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-muted rounded w-3/4" />
                                    <div className="h-3 bg-muted rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No recent activity</p>
                        <p className="text-xs mt-1">Upload data to see activity here</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity) => {
                            const Icon = getIcon(activity.type);
                            return (
                                <div
                                    key={activity.id}
                                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className={cn("p-2 rounded-lg", getIconColor(activity.type))}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">{activity.title}</p>
                                            {activity.trend && (
                                                <div className={cn(
                                                    "flex items-center gap-1 text-xs",
                                                    activity.trend === 'up' ? 'text-success' : 'text-destructive'
                                                )}>
                                                    {activity.trend === 'up' ? (
                                                        <TrendingUp className="h-3 w-3" />
                                                    ) : (
                                                        <TrendingDown className="h-3 w-3" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                                            {activity.amount && (
                                                <p className="text-xs font-semibold text-success">
                                                    +${activity.amount.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
