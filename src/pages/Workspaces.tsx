import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Settings, Trash2, Crown } from 'lucide-react';
import { useState } from 'react';
import { useWorkspaces, useWorkspaceMembers } from '@/hooks/useWorkspaces';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Workspaces() {
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Workspaces</h2>
                    <p className="text-muted-foreground">
                        Manage your workspaces and team collaboration
                    </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Workspace
                </Button>
            </div>

            {/* Workspaces Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <Card className="col-span-full">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            Loading workspaces...
                        </CardContent>
                    </Card>
                ) : workspaces.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="py-12 text-center">
                            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <h3 className="text-lg font-semibold mb-2">No workspaces yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Create your first workspace to get started
                            </p>
                            <Button onClick={() => setShowCreateModal(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Workspace
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    workspaces.map((workspace) => (
                        <Card key={workspace.id} className="cursor-pointer hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        {workspace.name}
                                        <Crown className="h-4 w-4 text-yellow-500" />
                                    </CardTitle>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setSelectedWorkspace(workspace.id)}
                                    >
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </div>
                                {workspace.description && (
                                    <p className="text-sm text-muted-foreground">{workspace.description}</p>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        <span>Team workspace</span>
                                    </div>
                                    <Badge variant="outline">{workspace.slug}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Create Workspace Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Create New Workspace</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Workspace Name *</Label>
                                <Input
                                    placeholder="My Company"
                                    value={newWorkspace.name}
                                    onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Input
                                    placeholder="What is this workspace for?"
                                    value={newWorkspace.description}
                                    onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreate} disabled={!newWorkspace.name}>
                                    Create
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <CardTitle>Workspace Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Team Members */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Team Members</h3>
                        <div className="space-y-2">
                            {members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <div className="font-medium">{member.user_id}</div>
                                        <Badge variant="outline" className="mt-1">
                                            {member.role}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Invite Member */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Invite Member</h3>
                        <div className="flex gap-2">
                            <Input
                                placeholder="email@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="flex-1"
                            />
                            <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleInvite} disabled={!inviteEmail}>
                                Invite
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
