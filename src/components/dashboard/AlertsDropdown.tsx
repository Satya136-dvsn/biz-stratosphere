import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Check, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  Settings,
  CheckCheck
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAlerts, Alert } from "@/hooks/useAlerts";
import { formatDistanceToNow } from "date-fns";

const getAlertIcon = (type: string | null) => {
  switch (type) {
    case 'info':
      return <Info className="h-4 w-4 text-info" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'system':
      return <Settings className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getAlertColor = (type: string | null) => {
  switch (type) {
    case 'info':
      return 'border-l-info bg-info/5';
    case 'warning':
      return 'border-l-warning bg-warning/5';
    case 'error':
      return 'border-l-destructive bg-destructive/5';
    case 'system':
      return 'border-l-muted-foreground bg-muted/20';
    default:
      return 'border-l-muted-foreground bg-muted/20';
  }
};

export function AlertsDropdown() {
  const { alerts, loading, unreadCount, markAsSeen, markAllAsSeen } = useAlerts();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto bg-background border shadow-lg z-50" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsSeen}
              className="h-6 px-2 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Loading notifications...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No notifications
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {alerts.map((alert) => (
              <DropdownMenuItem
                key={alert.id}
                className={`p-3 border-l-2 ${getAlertColor(alert.alert_type)} ${
                  !alert.seen ? 'bg-accent/20' : ''
                }`}
                onClick={() => !alert.seen && markAsSeen(alert.id)}
              >
                <div className="flex items-start space-x-3 w-full">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.alert_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium truncate ${
                        !alert.seen ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {alert.title}
                      </p>
                      {!alert.seen && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-2 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsSeen(alert.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {alert.message || 'No message'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.created_at 
                        ? formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })
                        : 'Unknown time'
                      }
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}