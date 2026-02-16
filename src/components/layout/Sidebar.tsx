// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    BarChart3,
    FileText,
    Settings,
    User,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Building2,
    Users,
    Key,
    LineChart,
    Sparkles,
    Brain,
    Workflow,
    Activity,
    FolderOpen,
    Zap,
    Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FeatureBadge } from "@/components/ui/FeatureBadge";
import { WorkspaceSelector } from "./WorkspaceSelector";

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
}

// Navigation items for desktop sidebar
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
        title: "Streaming ETL",
        href: "/streaming-etl",
        icon: Zap,
    },
    {
        title: "System Monitor",
        href: "/system-monitor",
        icon: Server,
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

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const { user } = useAuth();

    const getUserInitials = () => {
        const name = user?.user_metadata?.display_name || user?.email || "User";
        return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div
            className={cn(
                "hidden lg:flex relative flex-col h-screen border-r border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300 z-30",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo Section */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
                {collapsed ? (
                    <div className="flex items-center justify-center w-full">
                        <img
                            src="/logo-orbit.png"
                            alt="Biz Stratosphere"
                            className="h-8 w-8 rounded-full bg-transparent object-contain"
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo-orbit.png"
                            alt="Biz Stratosphere"
                            className="h-8 w-8 rounded-full bg-transparent object-contain"
                        />
                        <div>
                            <h2 className="text-sm font-bold text-foreground">Biz Stratosphere</h2>
                            <p className="text-xs text-muted-foreground">Analytics</p>
                        </div>
                    </div>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="h-8 w-8 hover:bg-muted/50"
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Workspace Selector */}
            {!collapsed && (
                <div className="px-3 py-2 border-b border-border/50">
                    <WorkspaceSelector />
                </div>
            )}

            {/* Navigation Items */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/20">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;

                    return (
                        <Link key={item.href} to={item.href}>
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start transition-all duration-200",
                                    collapsed ? "px-2" : "px-3",
                                    isActive && "bg-gradient-primary text-white shadow-glow hover:bg-gradient-primary/90"
                                )}
                            >
                                <Icon className={cn("h-5 w-5 flex-shrink-0", !collapsed && "mr-3")} />
                                {!collapsed && (
                                    <>
                                        <span className="text-sm font-medium truncate flex-1">{item.title}</span>
                                    </>
                                )}
                            </Button>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile Section */}
            <div className="p-4 border-t border-border/50">
                <div
                    className={cn(
                        "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
                        collapsed && "justify-center"
                    )}
                >
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-gradient-primary text-white text-xs">
                            {getUserInitials()}
                        </AvatarFallback>
                    </Avatar>

                    {!collapsed && (
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-foreground truncate">
                                {user?.user_metadata?.display_name || "User"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {user?.email}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
