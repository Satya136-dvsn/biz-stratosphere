import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function WorkspaceSelector() {
    const { workspaces, currentWorkspace, switchWorkspace, isLoading } = useWorkspaces();
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 animate-pulse" />
                <span>Loading...</span>
            </div>
        );
    }

    if (workspaces.length === 0) {
        return (
            <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/workspaces')}
            >
                <Plus className="h-4 w-4" />
                <span>Create Workspace</span>
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between gap-2 font-medium"
                >
                    <div className="flex items-center gap-2 truncate">
                        <Building2 className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">
                            {currentWorkspace?.name || 'Select Workspace'}
                        </span>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {workspaces.map((workspace) => (
                    <DropdownMenuItem
                        key={workspace.id}
                        className={cn(
                            'cursor-pointer justify-between',
                            currentWorkspace?.id === workspace.id && 'bg-accent'
                        )}
                        onClick={() => switchWorkspace(workspace.id)}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <Building2 className="h-4 w-4 shrink-0" />
                            <span className="truncate">{workspace.name}</span>
                        </div>
                        {currentWorkspace?.id === workspace.id && (
                            <Check className="h-4 w-4 shrink-0 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => navigate('/workspaces')}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Manage Workspaces</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
