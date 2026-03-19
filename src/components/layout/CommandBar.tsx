// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState, useEffect, useRef } from "react";
import { Search, Bell, User, LogOut, Settings as SettingsIcon, FileUp, BarChart3, FileText, Building2, Command, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from "@/hooks/useSearch";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
    'BarChart3': BarChart3,
    'FileText': FileText,
    'Building2': Building2,
    'User': User,
    'Settings': SettingsIcon,
    'FileUp': FileUp,
};

const notificationIcons = {
    'info': Info,
    'success': CheckCircle,
    'warning': AlertTriangle,
    'error': AlertCircle,
    'sales_inquiry': Building2,
};

export function CommandBar() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const { results, isSearching, hasResults } = useSearch(searchQuery);

    const {
        notifications,
        unreadCount,
        markAllAsRead,
        markAsRead
    } = useNotifications();

    const getUserInitials = () => {
        if (!user?.email) return "??";
        const displayName = user.user_metadata?.display_name;
        if (displayName) {
            const parts = displayName.split(" ");
            if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
            return parts[0].substring(0, 2).toUpperCase();
        }
        return user.email.substring(0, 2).toUpperCase();
    };

    const handleSignOut = async () => {
        const { error } = await signOut();
        if (error) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } else {
            navigate("/auth");
        }
    };

    const handleResultClick = (result: any) => {
        if (result.path) {
            navigate(result.path);
            setShowResults(false);
            setSearchQuery("");
            setIsSearchExpanded(false);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);
        if (notification.action_url) {
            navigate(notification.action_url);
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    // Keyboard shortcut (Cmd+K / Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchExpanded(true);
                setTimeout(() => {
                    const input = searchRef.current?.querySelector('input');
                    input?.focus();
                }, 100);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Close results when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
                if (isSearchExpanded) setIsSearchExpanded(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSearchExpanded]);

    return (
        <header className="sticky top-0 z-40 w-full border-b border-primary/10 bg-background/60 backdrop-blur-xl transition-all duration-300">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                {/* Left - Branding */}
                <div className={cn("flex items-center gap-4 transition-all duration-300", isSearchExpanded && "hidden md:flex")}>
                    <div className="flex md:hidden items-center gap-2">
                        <img src="/logo-orbit.png" alt="Logo" className="h-7 w-7 object-contain" />
                        <span className="text-sm font-bold tracking-tight">Stratosphere</span>
                    </div>
                </div>

                {/* Center - Search */}
                <div 
                    className={cn(
                        "transition-all duration-300 ease-in-out",
                        isSearchExpanded ? "flex-1 absolute inset-x-0 mx-4 z-50 md:relative md:mx-8 md:max-w-xl" : "flex-0 md:flex-1 md:max-w-xl md:mx-8"
                    )} 
                    ref={searchRef}
                >
                    {/* Mobile Search Trigger */}
                    {!isSearchExpanded && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="md:hidden flex h-10 w-10 text-muted-foreground hover:text-primary"
                            onClick={() => setIsSearchExpanded(true)}
                        >
                            <Search className="h-5 w-5" />
                        </Button>
                    )}

                    {/* Search Input Container */}
                    <div className={cn(
                        "relative group w-full",
                        !isSearchExpanded && "hidden md:block"
                    )}>
                        <div className="absolute inset-0 bg-primary/5 rounded-lg blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                            placeholder="Search command or page..."
                            className="pl-9 pr-16 bg-muted/30 border-primary/10 transition-all focus-visible:ring-primary/30 h-10 text-[13px] rounded-lg w-full"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {/* Collapse button for mobile */}
                            <button 
                                onClick={() => setIsSearchExpanded(false)}
                                className="md:hidden p-1 text-muted-foreground/40 hover:text-primary transition-colors"
                            >
                                <Search className="h-3 w-3 rotate-90" />
                            </button>
                            {/* Keyboard hint for desktop */}
                            <div className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/50 bg-muted/30 text-[10px] text-muted-foreground/50 font-mono">
                                <span className="text-[9px]">⌘</span>
                                <span>K</span>
                            </div>
                        </div>
                    </div>

                    {/* Search Results Dropdown */}
                    {showResults && searchQuery.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[hsl(220_18%_8%)] border border-primary/10 rounded-xl shadow-2xl max-h-[70vh] overflow-y-auto z-50 backdrop-blur-xl">
                            {isSearching ? (
                                <div className="p-4 text-center">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                                </div>
                            ) : hasResults ? (
                                <div className="py-2">
                                    {results.map((result) => {
                                        const Icon = iconMap[result.icon || 'FileUp'] || FileUp;
                                        return (
                                            <button
                                                key={result.id}
                                                onClick={() => handleResultClick(result)}
                                                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-primary/5 transition-colors text-left group"
                                            >
                                                <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">{result.title}</p>
                                                    {result.description && (
                                                        <p className="text-[11px] text-muted-foreground/60 truncate">
                                                            {result.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge variant="outline" className="text-[10px] font-mono bg-muted/20 border-border/10">
                                                    {result.type}
                                                </Badge>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="px-4 py-10 text-center space-y-2">
                                    <Search className="h-8 w-8 mx-auto opacity-20" />
                                    <p className="text-sm text-muted-foreground">No results found for <span className="text-foreground font-medium italic">"{searchQuery}"</span></p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className={cn("flex items-center gap-1 sm:gap-2 transition-all duration-300", isSearchExpanded && "hidden md:flex")}>
                {/* Notifications */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground">
                                    {unreadCount}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <div className="flex items-center justify-between px-2 py-1.5">
                            <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAllAsRead()}
                                    className="h-auto py-1 px-2 text-xs"
                                >
                                    <CheckCheck className="h-3 w-3 mr-1" />
                                    Mark all read
                                </Button>
                            )}
                        </div>
                        <DropdownMenuSeparator />
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notification) => {
                                    const Icon = notificationIcons[notification.type];
                                    return (
                                        <button
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={cn(
                                                "w-full px-3 py-2 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 last:border-0",
                                                !notification.read && "bg-primary/5"
                                            )}
                                        >
                                            <Icon className={cn(
                                                "h-4 w-4 mt-0.5 flex-shrink-0",
                                                notification.type === 'success' && "text-green-500",
                                                notification.type === 'warning' && "text-yellow-500",
                                                notification.type === 'error' && "text-red-500",
                                                notification.type === 'info' && "text-blue-500",
                                                notification.type === 'sales_inquiry' && "text-primary"
                                            )} />
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-sm",
                                                    !notification.read && "font-semibold"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {getTimeAgo(notification.created_at)}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.user_metadata?.avatar_url} />
                                <AvatarFallback className="bg-gradient-primary text-white text-xs">
                                    {getUserInitials()}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium">
                                    {user?.user_metadata?.display_name || "User"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/profile')}>
                            <User className="mr-2 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/settings')}>
                            <SettingsIcon className="mr-2 h-4 w-4" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
