// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { cn } from "@/lib/utils";

import { CheckCircle2, FlaskConical, Construction } from 'lucide-react';

export type FeatureBadgeVariant = "production" | "prototype" | "prototype-disabled" | "planned";

interface FeatureBadgeProps {
    variant: FeatureBadgeVariant;
    className?: string;
    size?: "sm" | "md" | "lg";
}

const variantConfig = {
    production: {
        icon: CheckCircle2,
        label: "Production-Ready",
        className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    },
    prototype: {
        icon: FlaskConical,
        label: "Prototype",
        className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    },
    "prototype-disabled": {
        icon: FlaskConical,
        label: "Prototype – Execution Not Enabled",
        className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
    },
    planned: {
        icon: Construction,
        label: "Planned",
        className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
    },
};

const sizeConfig = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
};

export function FeatureBadge({ variant, className, size = "md" }: FeatureBadgeProps) {
    const Icon = config.icon;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 font-semibold border rounded-full",
                config.className,
                sizeConfig[size],
                className
            )}
        >
            <Icon className="h-3.5 w-3.5" />
            <span>{config.label}</span>
        </span>
    );
}
