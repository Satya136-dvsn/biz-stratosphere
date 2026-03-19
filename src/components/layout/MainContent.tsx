// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MainContentProps {
    children: ReactNode;
    className?: string;
}

/**
 * MainContent wrapper component for consistent page layout
 * - Max-width container (max-w-7xl)
 * - Responsive padding (px-4 sm:px-6 lg:px-8)
 * - Prevents horizontal overflow
 * - Proper vertical spacing
 */
export function MainContent({ children, className }: MainContentProps) {
    return (
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
            <div
                className={cn(
                    "container mx-auto max-w-7xl animate-fade-in",
                    className
                )}
            >
                {children}
            </div>
        </div>
    );
}
