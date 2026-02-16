// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveGridProps {
    children: ReactNode;
    /** Grid layout variant - determines columns at different breakpoints */
    variant?: "default" | "cards" | "kpi" | "two-col" | "four-col";
    /** Additional className for custom styling */
    className?: string;
    /** Gap between grid items (default: gap-6) */
    gap?: "none" | "sm" | "md" | "lg";
}

/**
 * ResponsiveGrid - Standardized responsive grid layouts
 * 
 * Variants:
 * - default (3-col): 1 col mobile, 2 col tablet, 3 col desktop
 * - cards (3-col): Same as default, optimized for card layouts
 * - kpi (3-col): 1 col mobile, 2 col tablet, 3 col desktop - for KPI cards
 * - two-col: 1 col mobile, 2 col desktop - for larger content
 * - four-col: 1 col mobile, 2 col tablet, 4 col desktop - for compact items
 */
export function ResponsiveGrid({
    children,
    variant = "default",
    className,
    gap = "md"
}: ResponsiveGridProps) {

    const variantClasses = {
        default: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        cards: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        kpi: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        "two-col": "grid-cols-1 lg:grid-cols-2",
        "four-col": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    };

    const gapClasses = {
        none: "gap-0",
        sm: "gap-4",
        md: "gap-6",
        lg: "gap-8",
    };

    return (
        <div
            className={cn(
                "grid",
                variantClasses[variant],
                gapClasses[gap],
                className
            )}
        >
            {children}
        </div>
    );
}
