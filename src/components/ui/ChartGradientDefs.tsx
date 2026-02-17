
import React from 'react';

export function ChartGradientDefs() {
    return (
        <defs>
            {/* Revenue Gradient (Purple/Primary) */}
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--revenue))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--revenue))" stopOpacity={0.05} />
            </linearGradient>

            {/* Customers Gradient (Blue/Info) */}
            <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
            </linearGradient>

            {/* Success Gradient (Green) */}
            <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.05} />
            </linearGradient>

            {/* Warning/Target Gradient (Amber) */}
            <linearGradient id="colorWarning" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0.05} />
            </linearGradient>

            {/* Destructive/Churn Gradient (Red) */}
            <linearGradient id="colorDestructive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.05} />
            </linearGradient>
        </defs>
    );
}
