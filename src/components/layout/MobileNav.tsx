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
} from "lucide-react";
import { FeatureBadge } from "@/components/ui/FeatureBadge";

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
    badgeComponent?: React.ReactNode;
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
        badge: "NEW",
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
        badgeComponent: <FeatureBadge variant="prototype" size="sm" />,
    },
    {
        title: "ML Predictions",
        href: "/ml-predictions",
        icon: Brain,
        badgeComponent: <FeatureBadge variant="prototype" size="sm" />,
    },
    {
        title: "Automation Rules",
        href: "/automation-rules",
        icon: Workflow,
        badgeComponent: <FeatureBadge variant="prototype" size="sm" />,
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
                    <Button variant="ghost" size="icon" className="lg:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                    <SheetHeader className="border-b border-border/50 p-4">
                        <div className="flex items-center gap-3">
                            <img
                                src="/logo-orbit.png"
                                alt="Biz Stratosphere"
                                className="h-8 w-8 rounded-full bg-transparent object-contain"
                            />
                            <SheetTitle className="text-left">
                                <span className="text-sm font-bold">Biz Stratosphere</span>
                                <p className="text-xs text-muted-foreground font-normal">Analytics</p>
                            </SheetTitle>
                        </div>
                    </SheetHeader>

                    <nav className="flex flex-col gap-1 p-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                        isActive
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    <span className="flex-1">{item.title}</span>
                                    {item.badge && (
                                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary">
                                            {item.badge}
                                        </span>
                                    )}
                                    {item.badgeComponent && (
                                        <span className="ml-auto">
                                            {item.badgeComponent}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </SheetContent>
            </Sheet>
        </div>
    );
}
