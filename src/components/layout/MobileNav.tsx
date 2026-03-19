// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
    BarChart3,
    FileText,
    TrendingUp,
    Building2,
    Users,
    Key,
    LineChart,
    Sparkles,
    Brain,
    Workflow,
    User,
    Settings,
    FolderOpen,
    Activity,
} from "lucide-react";
import { FeatureBadge } from "@/components/ui/FeatureBadge";

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: BarChart3,
    },
    {
        title: "Reports",
        href: "/reports",
        icon: FileText,
    },
    {
        title: "Enterprise",
        href: "/enterprise",
        icon: Building2,
    },
    {
        title: "Advanced Charts",
        href: "/advanced-charts",
        icon: LineChart,
    },
    {
        title: "Upload History",
        href: "/upload-history",
        icon: FolderOpen,
    },
    {
        title: "Workspaces",
        href: "/workspaces",
        icon: Users,
    },
    {
        title: "API Management",
        href: "/api-management",
        icon: Key,
    },
    {
        title: "AI Chat",
        href: "/ai-chat",
        icon: Sparkles,
    },
    {
        title: "AI Analytics",
        href: "/ai-analytics",
        icon: Activity,
    },
    {
        title: "ML Predictions",
        href: "/ml-predictions",
        icon: Brain,
    },
    {
        title: "Automation Rules",
        href: "/automation-rules",
        icon: Workflow,
    },
    {
        title: "Profile",
        href: "/profile",
        icon: User,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

/**
 * MobileNav - Mobile navigation drawer
 * Visible only on mobile/tablet (<1024px)
 * Hidden on desktop where Sidebar is visible
 */
export function MobileNav() {
    const [open, setOpen] = useState(false);
    const location = useLocation();

    return (
        <div className="lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-primary/5">
                        <Menu className="h-5 w-5 text-muted-foreground" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 bg-[hsl(220_20%_5%)]/95 backdrop-blur-2xl border-r border-primary/10">
                    <SheetHeader className="p-6 border-b border-primary/10">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm animate-subtle-pulse" />
                                <img
                                    src="/logo-orbit.png"
                                    alt="Biz Stratosphere"
                                    className="relative h-8 w-8 rounded-lg object-contain"
                                />
                            </div>
                            <div className="text-left">
                                <SheetTitle className="text-sm font-bold tracking-tight text-foreground">
                                    Stratosphere
                                </SheetTitle>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Core Node</p>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto py-6 px-4 no-scrollbar">
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "group relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300",
                                            isActive
                                                ? "bg-primary/15 text-primary shadow-[inset_0_0_20px_rgba(74,124,255,0.05)]"
                                                : "text-muted-foreground/70 hover:bg-white/5 hover:text-foreground"
                                        )}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 w-1 h-5 bg-primary rounded-full" />
                                        )}
                                        <Icon className={cn(
                                            "h-5 w-5 transition-transform group-hover:scale-110",
                                            isActive ? "text-primary" : "text-muted-foreground/40"
                                        )} />
                                        <span className={cn(
                                            "text-[13px] font-medium tracking-tight",
                                            isActive ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {item.title}
                                        </span>
                                        {isActive && (
                                            <Sparkles className="ml-auto h-3 w-3 text-primary/40" />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="p-4 border-t border-primary/10 bg-primary/5 mt-auto">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-primary/20">
                                BS
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-foreground truncate">Enterprise v2.5</p>
                                <p className="text-[10px] text-muted-foreground truncate">Connected: Global Node</p>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
