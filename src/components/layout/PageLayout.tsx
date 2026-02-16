// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
    children: ReactNode;
    className?: string;
    maxWidth?: "full" | "7xl" | "6xl" | "5xl";
}

/**
 * Standard page layout wrapper that ensures consistent spacing,
 * max-width, and overflow handling across all pages
 */
export function PageLayout({ children, className, maxWidth = "7xl" }: PageLayoutProps) {
    const maxWidthClasses = {
        full: "max-w-full",
        "7xl": "max-w-7xl",
        "6xl": "max-w-6xl",
        "5xl": "max-w-5xl",
    };

    return (
        <div
            className={cn(
                "w-full min-h-screen overflow-x-hidden",
                maxWidthClasses[maxWidth],
                "mx-auto px-4 sm:px-6 lg:px-8 py-6",
                "space-y-6",
                className
            )}
        >
            {children}
        </div>
    );
}
