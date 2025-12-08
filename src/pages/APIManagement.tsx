import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, Plus, Copy, Trash2, Shield, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useAPIKeys } from '@/hooks/useAPIKeys';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

function APIManagement({ workspaceId }: { workspaceId: string }) {
    const { apiKeys, createAPIKey, revokeAPIKey, deleteAPIKey } = useAPIKeys(workspaceId);
    const { toast } = useToast();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [createdKey, setCreatedKey] = useState<string | null>(null);

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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">API Keys</h2>
                    <p className="text-muted-foreground">
                        Manage API keys for programmatic access
                    </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create API Key
                </Button>
            </div>

            {/* API Keys List */}
            <div className="space-y-4">
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
                                            {key.key_prefix}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                                            {key.is_active ? 'Active' : 'Revoked'}
                                        </Badge>
                                        {key.is_active && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => revokeAPIKey.mutate(key.id)}
                                            >
                                                Revoke
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => deleteAPIKey.mutate(key.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Created:</span>{' '}
                                        {new Date(key.created_at).toLocaleDateString()}
                                    </div>
                                    <div>
                                        <span className="font-medium">Expires:</span>{' '}
                                        {key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never'}
                                    </div>
                                    <div className="col-span-2">
                                        <span className="font-medium">Permissions:</span>{' '}
                                        {key.permissions.join(', ')}
                                    </div>
                                    {key.last_used_at && (
                                        <div className="col-span-2">
                                            <span className="font-medium">Last used:</span>{' '}
                                            {new Date(key.last_used_at).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Create API Key Modal */}
            {showCreateModal && !createdKey && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Create API Key</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Key Name *</Label>
                                <Input
                                    placeholder="Production API Key"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                />
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Permissions
                                </h4>
                                <ul className="text-sm space-y-1 list-disc list-inside">
                                    <li>Read datasets</li>
                                    <li>Write datasets</li>
                                    <li>Read analytics</li>
                                </ul>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreate} disabled={!newKeyName}>
                                    Create Key
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Show Created Key Modal */}
            {createdKey && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-500">
                                <CheckCircle2 className="h-5 w-5" />
                                API Key Created!
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-destructive/10 border-destructive/50 border rounded-lg">
                                <p className="text-sm font-semibold text-destructive mb-2">
                                    ⚠️ Save this key now!
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    This is the only time you'll see the full key. Store it securely.
                                </p>
                            </div>
                            <div>
                                <Label>Your API Key</Label>
                                <div className="flex gap-2 mt-1">
                                    <Input
                                        value={createdKey}
                                        readOnly
                                        className="font-mono text-xs"
                                    />
                                    <Button size="icon" onClick={() => copyToClipboard(createdKey)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={() => {
                                        setCreatedKey(null);
                                        setShowCreateModal(false);
                                    }}
                                >
                                    Done
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* API Documentation */}
            <Card>
                <CardHeader>
                    <CardTitle>API Documentation</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <h4>Quick Start</h4>
                    <p>Use your API key to make requests:</p>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.bizstratosphere.com/v1/datasets`}</code>
                    </pre>
                    <h4>Available Endpoints</h4>
                    <ul>
                        <li><code>GET /v1/datasets</code> - List all datasets</li>
                        <li><code>POST /v1/datasets</code> - Upload new dataset</li>
                        <li><code>GET /v1/analytics</code> - Get analytics data</li>
                        <li><code>GET /v1/kpis</code> - Get KPI metrics</li>
                    </ul>
                    <p className="text-xs text-muted-foreground">
                        Full API documentation available at{' '}
                    </div>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create API Key
                    </Button>
                </div>

                {/* API Keys List */}
                <div className="space-y-4">
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
                                                {key.key_prefix}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={key.is_active ? 'default' : 'secondary'}>
                                                {key.is_active ? 'Active' : 'Revoked'}
                                            </Badge>
                                            {key.is_active && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => revokeAPIKey.mutate(key.id)}
                                                >
                                                    Revoke
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => deleteAPIKey.mutate(key.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium">Created:</span>{' '}
                                            {new Date(key.created_at).toLocaleDateString()}
                                        </div>
                                        <div>
                                            <span className="font-medium">Expires:</span>{' '}
                                            {key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never'}
                                        </div>
                                        <div className="col-span-2">
                                            <span className="font-medium">Permissions:</span>{' '}
                                            {key.permissions.join(', ')}
                                        </div>
                                        {key.last_used_at && (
                                            <div className="col-span-2">
                                                <span className="font-medium">Last used:</span>{' '}
                                                {new Date(key.last_used_at).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Create API Key Modal */}
                {showCreateModal && !createdKey && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <CardTitle>Create API Key</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Key Name *</Label>
                                    <Input
                                        placeholder="Production API Key"
                                        value={newKeyName}
                                        onChange={(e) => setNewKeyName(e.target.value)}
                                    />
                                </div>
                                <div className="p-4 bg-muted rounded-lg">
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Permissions
                                    </h4>
                                    <ul className="text-sm space-y-1 list-disc list-inside">
                                        <li>Read datasets</li>
                                        <li>Write datasets</li>
                                        <li>Read analytics</li>
                                    </ul>
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleCreate} disabled={!newKeyName}>
                                        Create Key
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Show Created Key Modal */}
                {createdKey && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-500">
                                    <CheckCircle2 className="h-5 w-5" />
                                    API Key Created!
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-destructive/10 border-destructive/50 border rounded-lg">
                                    <p className="text-sm font-semibold text-destructive mb-2">
                                        ⚠️ Save this key now!
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        This is the only time you'll see the full key. Store it securely.
                                    </p>
                                </div>
                                <div>
                                    <Label>Your API Key</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            value={createdKey}
                                            readOnly
                                            className="font-mono text-xs"
                                        />
                                        <Button size="icon" onClick={() => copyToClipboard(createdKey)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button
                                        onClick={() => {
                                            setCreatedKey(null);
                                            setShowCreateModal(false);
                                        }}
                                    >
                                        Done
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* API Documentation */}
                <Card>
                    <CardHeader>
                        <CardTitle>API Documentation</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                        <h4>Quick Start</h4>
                        <p>Use your API key to make requests:</p>
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                            <code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.bizstratosphere.com/v1/datasets`}</code>
                        </pre>
                        <h4>Available Endpoints</h4>
                        <ul>
                            <li><code>GET /v1/datasets</code> - List all datasets</li>
                            <li><code>POST /v1/datasets</code> - Upload new dataset</li>
                            <li><code>GET /v1/analytics</code> - Get analytics data</li>
                            <li><code>GET /v1/kpis</code> - Get KPI metrics</li>
                        </ul>
                        <p className="text-xs text-muted-foreground">
                            Full API documentation available at{' '}
                            <a href="https://docs.bizstratosphere.com" className="text-primary">
                                docs.bizstratosphere.com
                            </a>
                        </p>
                    </CardContent>
                </Card>
        </div>
    );
}

// Default export wrapper that provides workspace context
export default function APIManagementPage() {
    const { user } = useAuth();
    // Use user ID as workspace ID for now
    const workspaceId = user?.id || 'default-workspace';

    return <APIManagement workspaceId={workspaceId} />;
}


// Default export wrapper
export default function APIManagementPage() {
    const { user } = useAuth();
    const workspaceId = user?.id || 'default-workspace';
    return <APIManagement workspaceId={workspaceId} />;
}
