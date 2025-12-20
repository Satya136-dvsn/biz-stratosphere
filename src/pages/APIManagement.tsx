import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, Plus, Copy, Trash2, Shield, CheckCircle2, BarChart3, Activity, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useAPIKeys } from '@/hooks/useAPIKeys';
import { useToast } from '@/hooks/use-toast';
import { PageLayout } from '@/components/layout/PageLayout';

import { useWorkspaces } from '@/hooks/useWorkspaces';

function APIManagement({ workspaceId }: { workspaceId?: string }) {
    const { workspaces, isLoading: isLoadingWorkspaces } = useWorkspaces();
    const activeWorkspaceId = workspaceId || workspaces[0]?.id;

    // We can't call useAPIKeys conditionally, but we can pass a dummy ID or skip query if empty.
    // However, useAPIKeys hook likely depends on the ID.
    // Let's assume useAPIKeys handles null/undefined or we pass a safe fallback.
    // Looking at the file content, useAPIKeys takes a string.

    // Standard pattern: Only run logic if we have an ID
    const { apiKeys, createAPIKey, revokeAPIKey, deleteAPIKey } = useAPIKeys(activeWorkspaceId || '');

    const { toast } = useToast();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [createdKey, setCreatedKey] = useState<string | null>(null);

    if (isLoadingWorkspaces) {
        return <div className="p-8 text-center">Loading workspace...</div>;
    }

    if (!activeWorkspaceId) {
        return (
            <PageLayout>
                <div className="p-8 text-center text-muted-foreground">
                    No workspace found. Please create a workspace first.
                </div>
            </PageLayout>
        );
    }

    const handleCreate = async () => {
        createAPIKey.mutate(
            {
                name: newKeyName,
                permissions: ['read:datasets', 'write:datasets', 'read:analytics'],
                expiresInDays: 365,
            },
            {
                onSuccess: (data) => {
                    setCreatedKey(data.plainKey);
                    setNewKeyName('');
                },
            }
        );
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copied to clipboard',
            description: 'API key copied successfully',
        });
    };

    return (
        <PageLayout>
            <div>
                <h2 className="text-3xl font-bold tracking-tight">API Management</h2>
                <p className="text-muted-foreground">
                    Manage API keys and monitor usage analytics
                </p>
            </div>

            <Tabs defaultValue="keys" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="keys" className="gap-2">
                        <Key className="h-4 w-4" />
                        API Keys
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Request Logs
                    </TabsTrigger>
                </TabsList>

                {/* API Keys Tab */}
                <TabsContent value="keys" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Your API Keys</h3>
                            <p className="text-sm text-muted-foreground">
                                Manage API keys for programmatic access
                            </p>
                        </div>
                        <Button onClick={() => setShowCreateModal(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create API Key
                        </Button>
                    </div>

                    {apiKeys.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Create an API key to access the platform programmatically
                                </p>
                                <Button onClick={() => setShowCreateModal(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create API Key
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        apiKeys.map((key) => (
                            <Card key={key.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Key className="h-5 w-5" />
                                                {key.name}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Created {new Date(key.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            {key.is_active ? (
                                                <Badge variant="default" className="gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Revoked</Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <Input
                                                readOnly
                                                value={`${key.key_prefix}${'*'.repeat(40)}`}
                                                className="font-mono text-sm"
                                            />
                                            <Button variant="outline" size="icon">
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex gap-2">
                                            {key.is_active && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => revokeAPIKey.mutate({ keyId: key.id })}
                                                >
                                                    <Shield className="mr-2 h-4 w-4" />
                                                    Revoke
                                                </Button>
                                            )}
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => deleteAPIKey.mutate({ keyId: key.id })}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>API Usage Analytics</CardTitle>
                            <CardDescription>Monitor your API usage and performance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                                    <p className="text-3xl font-bold">1,247</p>
                                    <p className="text-xs text-muted-foreground">
                                        <span className="text-green-500">↑ 12%</span> from last month
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                                    <p className="text-3xl font-bold">99.2%</p>
                                    <p className="text-xs text-muted-foreground">
                                        <span className="text-green-500">↑ 0.5%</span> improvement
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                                    <p className="text-3xl font-bold">124ms</p>
                                    <p className="text-xs text-muted-foreground">
                                        <span className="text-green-500">↓ 15ms</span> faster
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Rate Limits</CardTitle>
                            <CardDescription>Current usage against your limits</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium">Requests / Hour</span>
                                    <span className="text-sm text-muted-foreground">45 / 1000</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div className="bg-primary h-2 rounded-full" style={{ width: '4.5%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium">Requests / Day</span>
                                    <span className="text-sm text-muted-foreground">423 / 10000</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div className="bg-primary h-2 rounded-full" style={{ width: '4.23%' }}></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Request Logs Tab */}
                <TabsContent value="logs" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent API Requests</CardTitle>
                            <CardDescription>Last 10 API calls to your endpoints</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {[
                                    { method: 'GET', endpoint: '/api/v1/datasets', status: 200, time: '12ms', timestamp: '2 min ago' },
                                    { method: 'POST', endpoint: '/api/v1/data-points', status: 201, time: '34ms', timestamp: '5 min ago' },
                                    { method: 'GET', endpoint: '/api/v1/analytics', status: 200, time: '89ms', timestamp: '8 min ago' },
                                    { method: 'PUT', endpoint: '/api/v1/datasets/123', status: 200, time: '45ms', timestamp: '12 min ago' },
                                    { method: 'GET', endpoint: '/api/v1/datasets', status: 200, time: '15ms', timestamp: '15 min ago' },
                                ].map((log, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                                        <div className="flex items-center gap-4 flex-1">
                                            <Badge variant={log.method === 'GET' ? 'outline' : 'default'} className="w-16 justify-center">
                                                {log.method}
                                            </Badge>
                                            <code className="text-sm font-mono flex-1">{log.endpoint}</code>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <Badge variant={log.status === 200 || log.status === 201 ? 'default' : 'destructive'}>
                                                {log.status}
                                            </Badge>
                                            <span className="text-muted-foreground w-16 text-right">{log.time}</span>
                                            <span className="text-muted-foreground w-20 text-right">{log.timestamp}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create API Key Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Create API Key</CardTitle>
                            <CardDescription>Generate a new API key for programmatic access</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Key Name *</Label>
                                <Input
                                    placeholder="Production Server"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                />
                            </div>
                            {createdKey && (
                                <div className="p-4 bg-muted rounded-lg space-y-2">
                                    <p className="text-sm font-semibold text-warning">Save this key - it won't be shown again!</p>
                                    <div className="flex gap-2">
                                        <Input readOnly value={createdKey} className="font-mono text-sm" />
                                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(createdKey)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => { setShowCreateModal(false); setCreatedKey(null); }}>
                                    {createdKey ? 'Done' : 'Cancel'}
                                </Button>
                                {!createdKey && (
                                    <Button onClick={handleCreate} disabled={!newKeyName}>
                                        Create Key
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </PageLayout>
    );
}

export default APIManagement;
