// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Users, 
  Settings, 
  Trash2, 
  Crown, 
  LayoutGrid, 
  Sparkles, 
  Command, 
  ChevronRight,
  Loader2,
  Building2,
  Lock,
  Boxes
} from 'lucide-react';
import { useState } from 'react';
import { useWorkspaces, useWorkspaceMembers } from '@/hooks/useWorkspaces';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageLayout } from '@/components/layout/PageLayout';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function Workspaces() {
    const { workspaces, isLoading, createWorkspace, deleteWorkspace } = useWorkspaces();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
    const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });

    const handleCreate = () => {
        createWorkspace.mutate(newWorkspace, {
            onSuccess: () => {
                setShowCreateModal(false);
                setNewWorkspace({ name: '', description: '' });
            },
        });
    };

    return (
        <PageLayout>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                <Boxes className="h-5 w-5 text-primary" />
                            </div>
                            <h1 className="text-3xl font-bold text-foreground uppercase tracking-widest">SYSTEM_NODE_MAP</h1>
                        </div>
                        <p className="text-muted-foreground font-medium text-sm">
                            Authorized workspace clusters and distributed collaboration nodes.
                        </p>
                    </div>
                    
                    <Button 
                        onClick={() => setShowCreateModal(true)}
                        className="h-11 px-6 font-bold uppercase tracking-widest text-[11px] bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        INSTANTIATE_NODE
                    </Button>
                </div>

                {/* Workspaces Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="h-10 w-10 text-primary animate-spin opacity-40" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">SCANNING_NETWORDS...</span>
                        </div>
                    ) : workspaces.length === 0 ? (
                        <Card className="col-span-full bg-[hsl(220_18%_7%)]/50 backdrop-blur-xl border border-dashed border-[hsl(220_16%_16%)] shadow-2xl overflow-hidden group">
                            <CardContent className="py-24 text-center">
                                <div className="inline-flex p-4 rounded-full bg-primary/5 border border-primary/10 mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <Users className="h-12 w-12 text-primary/40" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 uppercase tracking-widest">NO_ACTIVE_CLUSTERS</h3>
                                <p className="text-sm text-muted-foreground mb-8 uppercase tracking-tight max-w-sm mx-auto font-medium">
                                    Operator has no registered collaboration nodes. Initialize first node to begin protocol.
                                </p>
                                <Button 
                                    onClick={() => setShowCreateModal(true)}
                                    variant="outline"
                                    className="h-11 px-8 font-mono text-[10px] tracking-widest uppercase border-primary/20 hover:bg-primary/10 hover:text-primary transition-all"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    CREATE_INITIAL_NODE
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        workspaces.map((workspace) => (
                            <Card key={workspace.id} className="group overflow-hidden bg-[hsl(220_18%_7%)]/50 backdrop-blur-xl border border-[hsl(220_16%_12%)] shadow-2xl hover:border-primary/40 transition-all duration-500 hover:shadow-primary/5 hover:-translate-y-1 relative">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                    <Command className="h-20 w-20 text-primary" />
                                </div>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                                
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="flex items-center gap-2 text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
                                                {workspace.name}
                                                <Crown className="h-3.5 w-3.5 text-yellow-500/80 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]" />
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-primary/5 text-primary/60 border-primary/20 font-mono text-[9px] px-1.5 py-0">
                                                    ID: {workspace.slug}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => setSelectedWorkspace(workspace.id)}
                                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                                        >
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {workspace.description && (
                                        <p className="mt-4 text-xs text-muted-foreground uppercase tracking-tight font-medium opacity-60 group-hover:opacity-100 transition-opacity line-clamp-2 leading-relaxed">
                                            {workspace.description}
                                        </p>
                                    )}
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="mt-2 pt-4 border-t border-[hsl(220_16%_12%)] flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-3.5 w-3.5 opacity-60" />
                                            <span className="group-hover:text-foreground transition-colors">COLLAB_NODE</span>
                                        </div>
                                        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform group-hover:text-primary" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Create Workspace Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                        <Card className="w-full max-w-md bg-[hsl(220_18%_7%)] border-[hsl(220_16%_16%)] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent" />
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl font-bold uppercase tracking-widest">
                                    <Plus className="h-5 w-5 text-primary" />
                                    NEW_CLUSTER
                                </CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase text-muted-foreground/40 font-mono">INITIALIZE_COLLABORATION_PARAMETERS</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">NODE_LABEL</Label>
                                    <Input
                                        placeholder="Identify cluster name"
                                        value={newWorkspace.name}
                                        onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                                        className="h-11 bg-[hsl(220_18%_9%)] border-[hsl(220_16%_16%)] focus-visible:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">DESCRIPTIVE_STRING</Label>
                                    <Input
                                        placeholder="Define cluster purpose"
                                        value={newWorkspace.description}
                                        onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                                        className="h-11 bg-[hsl(220_18%_9%)] border-[hsl(220_16%_16%)] focus-visible:ring-primary/20"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-6">
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setShowCreateModal(false)}
                                        className="h-10 font-mono text-[10px] tracking-widest uppercase text-muted-foreground hover:bg-muted/10"
                                    >
                                        ABORT
                                    </Button>
                                    <Button 
                                        onClick={handleCreate} 
                                        disabled={!newWorkspace.name || createWorkspace.isPending}
                                        className="h-10 px-8 font-bold uppercase tracking-widest text-[10px] bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                                    >
                                        {createWorkspace.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "INSTANTIATE"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Workspace Settings Modal */}
                {selectedWorkspace && (
                    <WorkspaceSettings
                        workspaceId={selectedWorkspace}
                        onClose={() => setSelectedWorkspace(null)}
                    />
                )}
            </div>
        </PageLayout>
    );
}

function WorkspaceSettings({ workspaceId, onClose }: { workspaceId: string; onClose: () => void }) {
    const { members, inviteMember } = useWorkspaceMembers(workspaceId);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');

    const handleInvite = () => {
        inviteMember.mutate(
            { email: inviteEmail, role: inviteRole },
            {
                onSuccess: () => {
                    setInviteEmail('');
                    setInviteRole('member');
                },
            }
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-[hsl(220_18%_7%)] border-[hsl(220_16%_16%)] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary via-primary to-transparent" />
                
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold uppercase tracking-widest">
                            <Settings className="h-5 w-5 text-secondary" />
                            CLUSTER_CONFIG
                        </CardTitle>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onClose}
                            className="h-8 w-8 rounded-full hover:bg-muted/10"
                        >
                            <Trash2 className="h-4 w-4 opacity-50" />
                        </Button>
                    </div>
                    <CardDescription className="text-[10px] font-black uppercase text-muted-foreground/40 font-mono">NODE_CLUSTER_ACCESS_AND_MEMBER_REGISTRY</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-8 overflow-y-auto pb-8 custom-scrollbar">
                    {/* Team Members */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            <Users className="h-3.5 w-3.5" />
                            REGISTERED_OPERATORS
                        </div>
                        <div className="grid gap-3">
                            {members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-4 bg-[hsl(220_18%_9%)] border border-[hsl(220_16%_16%)] rounded-xl group transition-all hover:border-primary/30">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary uppercase">
                                            {member.user_id.substring(0, 2)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold tracking-tight text-foreground/90">{member.user_id}</div>
                                            <Badge variant="outline" className="mt-1 bg-muted/10 text-muted-foreground/60 border-muted-foreground/20 font-mono text-[9px] uppercase tracking-tighter">
                                                {member.role}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                        <span className="text-[9px] font-black uppercase text-muted-foreground/40 font-mono">NODE_ACTIVE</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator className="bg-[hsl(220_16%_14%)]" />

                    {/* Invite Member */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            <Plus className="h-3.5 w-3.5" />
                            SOLICIT_OPERATOR
                        </div>
                        <div className="p-5 bg-primary/5 border border-primary/10 rounded-2xl flex flex-col md:flex-row gap-3">
                            <div className="flex-1 space-y-2">
                                <Input
                                    placeholder="operator_email@domain.sys"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="h-11 bg-background border-[hsl(220_16%_16%)] focus-visible:ring-primary/20"
                                />
                            </div>
                            <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                                <SelectTrigger className="w-full md:w-36 h-11 bg-background border-[hsl(220_16%_16%)]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[hsl(220_18%_7%)] border-[hsl(220_16%_16%)]">
                                    <SelectItem value="admin">ADMIN</SelectItem>
                                    <SelectItem value="member">MEMBER</SelectItem>
                                    <SelectItem value="viewer">VIEWER</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button 
                                onClick={handleInvite} 
                                disabled={!inviteEmail || inviteMember.isPending}
                                className="h-11 px-6 font-bold uppercase tracking-widest text-[10px] bg-secondary text-secondary-foreground shadow-lg shadow-secondary/10 hover:scale-[1.02] transition-transform"
                            >
                                {inviteMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "TRANSMIT"}
                            </Button>
                        </div>
                    </div>
                </CardContent>

                <div className="p-4 border-t border-[hsl(220_16%_14%)] bg-muted/5 flex justify-end">
                    <Button 
                        onClick={onClose}
                        variant="ghost"
                        className="h-10 font-mono text-[10px] tracking-widest uppercase text-muted-foreground hover:bg-muted/10 px-8"
                    >
                        DISMISS
                    </Button>
                </div>
            </Card>
        </div>
    );
}
