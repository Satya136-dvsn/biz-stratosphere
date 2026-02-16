// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState, useEffect, useRef } from "react";
import { Search, Bell, User, LogOut, Settings as SettingsIcon, FileUp, BarChart3, FileText, Building2, Command, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
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
import { useNotifications } from "@/hooks/useNotifications";
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
};

export function CommandBar() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const { results, isSearching, hasResults } = useSearch(searchQuery);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    const handleSignOut = async () => {
        const { error } = await signOut();
        if (error) {
            toast({
                title: "Error",
                description: "Failed to sign out",
                variant: "destructive",
            });
        } else {
            navigate('/auth');
        }
    };

    const getUserInitials = () => {
        const name = user?.user_metadata?.display_name || user?.email || "User";
        return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleResultClick = (result: any) => {
        if (result.type === 'page' && result.path) {
            navigate(result.path);
        }
        setSearchQuery("");
        setShowResults(false);
    };

    const handleNotificationClick = (notification: any) => {
        markAsRead(notification.id);
        if (notification.action_url) {
            navigate(notification.action_url);
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    // Keyboard shortcut (Cmd+K / Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const input = searchRef.current?.querySelector('input');
                input?.focus();
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
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-border/50 bg-card/50 backdrop-blur-xl">
            {/* Search */}
            <div className="flex-1 max-w-md relative" ref={searchRef}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowResults(true);
                        }}
                        onFocus={() => setShowResults(true)}
                        placeholder="Search... (Cmd+K)"
                        className="pl-9 pr-16 bg-muted/50 border-border/50 focus-visible:ring-primary/50"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Command className="h-3 w-3" />
                        <span>K</span>
                    </div>
                </div>

                {/* Search Results Dropdown */}
                {showResults && isSearching && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                        {hasResults ? (
                            <div className="py-2">
                                {results.map((result) => {
                                    const Icon = iconMap[result.icon || 'FileUp'] || FileUp;
                                    return (
                                        <button
                                            key={result.id}
                                            onClick={() => handleResultClick(result)}
                                            className="w-full px-4 py-2 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                                        >
                                            <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{result.title}</p>
                                                {result.description && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {result.description}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {result.type}
                                            </Badge>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                No results found for "{searchQuery}"
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
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
                                                notification.type === 'info' && "text-blue-500"
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
    );
}
