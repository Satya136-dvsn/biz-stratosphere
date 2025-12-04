import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, TrendingDown, DollarSign, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
    id: string;
    type: 'revenue' | 'customer' | 'sale' | 'alert';
    title: string;
    description: string;
    timestamp: string;
    trend?: 'up' | 'down';
    amount?: number;
}

const mockActivities: ActivityItem[] = [
    {
        id: '1',
        type: 'revenue',
        title: 'Revenue Milestone',
        description: 'Monthly revenue target achieved',
        timestamp: '2 hours ago',
        trend: 'up',
        amount: 50000
    },
    {
        id: '2',
        type: 'customer',
        title: 'New Customer Signup',
        description: '5 new enterprise customers joined',
        timestamp: '4 hours ago',
        trend: 'up'
    },
    {
        id: '3',
        type: 'sale',
        title: 'Large Transaction',
        description: 'Enterprise deal closed successfully',
        timestamp: '6 hours ago',
        amount: 25000
    },
    {
        id: '4',
        type: 'alert',
        title: 'Churn Risk',
        description: '2 customers at risk of churning',
        timestamp: '8 hours ago',
        trend: 'down'
    }
];

const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
        case 'revenue':
            return DollarSign;
        case 'customer':
            return Users;
        case 'sale':
            return Package;
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
        case 'alert':
            return 'text-warning bg-warning/10';
    }
};

export function RecentActivity() {
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
                <div className="space-y-4">
                    {mockActivities.map((activity) => {
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
            </CardContent>
        </Card>
    );
}
