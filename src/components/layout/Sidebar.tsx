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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
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
                "relative flex flex-col h-screen border-r border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo Section */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                            <TrendingUp className="h-4 w-4 text-white" />
                        </div>
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

            {/* Navigation Items */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
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
                                <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                                {!collapsed && (
                                    <span className="text-sm font-medium">{item.title}</span>
                                )}
                                {!collapsed && item.badge && (
                                    <span className="ml-auto text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                                        {item.badge}
                                    </span>
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
