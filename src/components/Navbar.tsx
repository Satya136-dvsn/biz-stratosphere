import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  User,
  Settings,
  LogOut,
  Home,
  BarChart3,
  FileText
} from "lucide-react";
import { AlertsDropdown } from "./dashboard/AlertsDropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

export function Navbar() {
  const { user, signOut, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Signed out successfully",
      });
      navigate('/auth');
    }
  };

  const getUserInitials = () => {
    const name = user?.user_metadata?.display_name || user?.email || "User";
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 shadow-lg" style={{ backgroundColor: '#0f1729' }}>
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Branding */}
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow group-hover:shadow-glow-secondary transition-all duration-300 group-hover:scale-110">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Biz Stratosphere
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">AI Business Intelligence</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Button
              variant={isActivePath('/dashboard') ? "secondary" : "ghost"}
              size="sm"
              className={`transition-all duration-300 ${isActivePath('/dashboard')
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              onClick={() => navigate('/dashboard')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={isActivePath('/reports') ? "secondary" : "ghost"}
              size="sm"
              className={`transition-all duration-300 ${isActivePath('/reports')
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              onClick={() => navigate('/reports')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </Button>
            <Button
              variant={isActivePath('/settings') ? "secondary" : "ghost"}
              size="sm"
              className={`transition-all duration-300 ${isActivePath('/settings')
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>

          {/* Profile Section */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <AlertsDropdown />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/50 transition-all duration-300">
                  <Avatar className="h-10 w-10 ring-2 ring-border">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt="User avatar" />
                    <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 glass-effect border-border/50" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.user_metadata?.display_name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}