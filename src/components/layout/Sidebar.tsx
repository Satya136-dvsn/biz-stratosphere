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
    ChevronDown,
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
    LayoutDashboard,
    Shield,
    ScanEye,
    DatabaseZap,
    LogOut,
    HelpCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WorkspaceSelector } from "./WorkspaceSelector";

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
}

interface NavGroup {
    label: string;
    items: NavItem[];
    defaultOpen?: boolean;
}

const navGroups: NavGroup[] = [
    {
        label: "Overview",
        defaultOpen: true,
        items: [
            { title: "Dashboard", href: "/dashboard", icon: BarChart3 },
            { title: "Reports", href: "/reports", icon: FileText },
            { title: "Advanced Charts", href: "/advanced-charts", icon: LineChart },
        ],
    },
    {
        label: "AI & Machine Learning",
        defaultOpen: true,
        items: [
            { title: "AI Chat", href: "/ai-chat", icon: Sparkles, badge: "AI" },
            { title: "AI Analytics", href: "/ai-analytics", icon: Activity },
            { title: "ML Predictions", href: "/ml-predictions", icon: Brain },
            { title: "Agent Playground", href: "/agent-playground", icon: Brain },
            { title: "Decision History", href: "/decision-history", icon: FileText },
        ],
    },
    {
        label: "Data & Automation",
        defaultOpen: false,
        items: [
            { title: "Upload History", href: "/upload-history", icon: FolderOpen },
            { title: "Streaming ETL", href: "/streaming-etl", icon: Zap },
            { title: "Automation Rules", href: "/automation-rules", icon: Workflow },
        ],
    },
    {
        label: "Platform",
        defaultOpen: false,
        items: [
            { title: "Enterprise", href: "/enterprise", icon: Building2 },
            { title: "Workspaces", href: "/workspaces", icon: Users },
            { title: "API Management", href: "/api-management", icon: Key },
            { title: "System Monitor", href: "/system-monitor", icon: Server },
        ],
    },
];

const adminItems: NavItem[] = [
    { title: "Admin Overview", href: "/admin", icon: LayoutDashboard },
    { title: "User Management", href: "/admin/users", icon: Users },
    { title: "Enterprise Leads", href: "/admin/inquiries", icon: Building2 },
    { title: "AI Control", href: "/admin/ai", icon: Brain },
    { title: "Security & Audit", href: "/admin/security", icon: Shield },
    { title: "AI Decision Audit", href: "/admin/ai-audit", icon: ScanEye },
    { title: "Decision Memory", href: "/admin/decision-memory", icon: DatabaseZap },
];

function NavGroupSection({
    group,
    collapsed,
    pathname,
}: {
    group: NavGroup;
    collapsed: boolean;
    pathname: string;
}) {
    const hasActiveChild = group.items.some((item) => pathname === item.href);
    const [open, setOpen] = useState(group.defaultOpen || hasActiveChild);

    return (
        <div className="mb-1">
            {/* Group header */}
            {!collapsed && (
                <button
                    onClick={() => setOpen(!open)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors"
                >
                    <span>{group.label}</span>
                    <ChevronDown
                        className={cn(
                            "h-3 w-3 transition-transform duration-200",
                            !open && "-rotate-90"
                        )}
                    />
                </button>
            )}

            {/* Group items */}
            {(open || collapsed) && (
                <div className="space-y-0.5">
                    {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link key={item.href} to={item.href}>
                                <div
                                    className={cn(
                                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                                        collapsed && "justify-center px-2",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                    )}
                                >
                                    {/* Active indicator bar */}
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary transition-all duration-200" />
                                    )}

                                    <Icon
                                        className={cn(
                                            "h-[18px] w-[18px] flex-shrink-0 transition-colors duration-150",
                                            isActive
                                                ? "text-primary"
                                                : "text-muted-foreground/70 group-hover:text-foreground/80"
                                        )}
                                    />

                                    {!collapsed && (
                                        <span className="truncate flex-1">{item.title}</span>
                                    )}

                                    {!collapsed && item.badge && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const { user, isAdmin, signOut } = useAuth();

    const getUserInitials = () => {
        const name = user?.user_metadata?.display_name || user?.email || "User";
        return name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div
            className={cn(
                "hidden lg:flex relative flex-col h-screen border-r transition-all duration-300 ease-in-out z-30",
                "bg-[hsl(220_20%_5.5%)] border-[hsl(220_16%_12%)]",
                collapsed ? "w-[60px]" : "w-[248px]"
            )}
        >
            {/* ─── Logo ─── */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-[hsl(220_16%_12%)]">
                {collapsed ? (
                    <div className="flex items-center justify-center w-full">
                        <img
                            src="/logo-orbit.png"
                            alt="Biz Stratosphere"
                            className="h-7 w-7 rounded-lg object-contain"
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-2.5">
                        <img
                            src="/logo-orbit.png"
                            alt="Biz Stratosphere"
                            className="h-7 w-7 rounded-lg object-contain"
                        />
                        <div>
                            <h2 className="text-[13px] font-bold text-foreground tracking-tight">
                                Biz Stratosphere
                            </h2>
                            <p className="text-[10px] text-muted-foreground/60 font-medium tracking-wide uppercase">
                                Analytics
                            </p>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        "h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors",
                        collapsed && "mx-auto"
                    )}
                >
                    {collapsed ? (
                        <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                        <ChevronLeft className="h-3.5 w-3.5" />
                    )}
                </button>
            </div>

            {/* ─── Workspace Selector ─── */}
            {!collapsed && (
                <div className="px-3 py-2.5 border-b border-[hsl(220_16%_12%)]">
                    <WorkspaceSelector />
                </div>
            )}

            {/* ─── Navigation ─── */}
            <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden no-scrollbar">
                {navGroups.map((group) => (
                    <NavGroupSection
                        key={group.label}
                        group={group}
                        collapsed={collapsed}
                        pathname={location.pathname}
                    />
                ))}

                {/* ─── Admin Section ─── */}
                {isAdmin() && (
                    <div className="mt-3 pt-3 border-t border-[hsl(220_16%_12%)]">
                        {!collapsed && (
                            <div className="px-3 py-1.5">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                                    Admin
                                </p>
                            </div>
                        )}
                        <div className="space-y-0.5">
                            {adminItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.href;
                                return (
                                    <Link key={item.href} to={item.href}>
                                        <div
                                            className={cn(
                                                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                                                collapsed && "justify-center px-2",
                                                isActive
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                            )}
                                        >
                                            {isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary" />
                                            )}
                                            <Icon
                                                className={cn(
                                                    "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                                                    isActive
                                                        ? "text-primary"
                                                        : "text-muted-foreground/70 group-hover:text-foreground/80"
                                                )}
                                            />
                                            {!collapsed && (
                                                <span className="truncate flex-1">{item.title}</span>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </nav>

            {/* ─── Bottom Actions ─── */}
            <div className="border-t border-[hsl(220_16%_12%)]">
                {/* Quick links */}
                <div className="px-2 py-2 space-y-0.5">
                    <Link to="/profile">
                        <div
                            className={cn(
                                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all",
                                collapsed && "justify-center px-2",
                                location.pathname === "/profile" && "bg-primary/10 text-primary"
                            )}
                        >
                            <User className="h-[18px] w-[18px] flex-shrink-0" />
                            {!collapsed && <span className="truncate">Profile</span>}
                        </div>
                    </Link>
                    <Link to="/settings">
                        <div
                            className={cn(
                                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all",
                                collapsed && "justify-center px-2",
                                location.pathname === "/settings" && "bg-primary/10 text-primary"
                            )}
                        >
                            <Settings className="h-[18px] w-[18px] flex-shrink-0" />
                            {!collapsed && <span className="truncate">Settings</span>}
                        </div>
                    </Link>
                    <Link to="/help">
                        <div
                            className={cn(
                                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all",
                                collapsed && "justify-center px-2",
                                location.pathname === "/help" && "bg-primary/10 text-primary"
                            )}
                        >
                            <HelpCircle className="h-[18px] w-[18px] flex-shrink-0" />
                            {!collapsed && <span className="truncate">Help</span>}
                        </div>
                    </Link>
                </div>

                {/* User card */}
                <div className="px-2 py-3 border-t border-[hsl(220_16%_12%)]">
                    <div
                        className={cn(
                            "flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer",
                            collapsed && "justify-center"
                        )}
                    >
                        <div className="relative">
                            <Avatar className="h-8 w-8 ring-1 ring-border">
                                <AvatarImage src={user?.user_metadata?.avatar_url} />
                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                    {getUserInitials()}
                                </AvatarFallback>
                            </Avatar>
                            {/* Online indicator */}
                            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[hsl(220_20%_5.5%)]" />
                        </div>

                        {!collapsed && (
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
                                    {user?.user_metadata?.display_name || "User"}
                                </p>
                                <p className="text-[11px] text-muted-foreground/60 truncate">
                                    {user?.email}
                                </p>
                            </div>
                        )}

                        {!collapsed && (
                            <button
                                onClick={() => signOut()}
                                className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Sign out"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
