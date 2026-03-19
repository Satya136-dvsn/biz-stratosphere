// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
    children: ReactNode;
    className?: string;
    maxWidth?: "full" | "7xl" | "6xl" | "5xl" | "4xl" | "3xl" | "2xl";
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
        "4xl": "max-w-4xl",
        "3xl": "max-w-3xl",
        "2xl": "max-w-2xl",
    };

    return (
        <div
            className={cn(
                "w-full min-h-screen overflow-x-hidden animate-content-reveal",
                maxWidthClasses[maxWidth],
                "mx-auto px-4 sm:px-6 lg:px-8 py-8",
                "space-y-8",
                className
            )}
        >
            {children}
        </div>
    );
}
