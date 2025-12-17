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
        <div className="flex-1 overflow-y-auto">
            <div
                className={cn(
                    "container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6",
                    className
                )}
            >
                {children}
            </div>
        </div>
    );
}
