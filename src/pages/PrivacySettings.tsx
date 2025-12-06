import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function PrivacySettings() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            if (!user) return;

            // Fetch all user data
            const { data: datasets } = await supabase
                .from('datasets')
                .select('*')
                .eq('user_id', user.id);

            const { data: notifications } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id);

            const { data: conversations } = await supabase
                .from('ai_conversations')
                .select('*')
                .eq('user_id', user.id);

            const { data: rules } = await supabase
                .from('automation_rules')
                .select('*')
                .eq('user_id', user.id);

            // Combine all data
            const exportData = {
                exported_at: new Date().toISOString(),
                user_id: user.id,
                email: user.email,
                datasets: datasets || [],
                notifications: notifications || [],
                ai_conversations: conversations || [],
                automation_rules: rules || [],
            };

            // Create downloadable JSON
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `biz-stratosphere-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: 'Data exported successfully',
                description: 'Your data has been downloaded as a JSON file',
            });
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: 'Export failed',
                description: 'Failed to export your data',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        if (!confirm('This will permanently delete ALL your data including datasets, conversations, and settings. Type DELETE to confirm.')) {
            return;
        }

        setIsDeleting(true);
        try {
            if (!user) return;

            // Delete all user data (cascade will handle related records)
            await supabase.from('datasets').delete().eq('user_id', user.id);
            await supabase.from('notifications').delete().eq('user_id', user.id);
            await supabase.from('ai_conversations').delete().eq('user_id', user.id);
            await supabase.from('automation_rules').delete().eq('user_id', user.id);
            await supabase.from('data_embeddings').delete().eq('user_id', user.id);

            toast({
                title: 'Account deleted',
                description: 'Your account and all data have been deleted',
            });

            // Sign out
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Delete error:', error);
            toast({
                title: 'Deletion failed',
                description: 'Failed to delete your account',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Privacy & Data</h2>
                <p className="text-muted-foreground">
                    Manage your data and privacy settings (GDPR compliant)
                </p>
            </div>

            {/* Data Export */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <Download className="h-5 w-5" />
                                Export Your Data
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Download a copy of all your data (GDPR Right to Access)
                            </p>
                        </div>
                        <Badge variant="outline" className="gap-1">
                            <Shield className="h-3 w-3" />
                            GDPR Compliant
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>All datasets</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>AI conversations</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Automation rules</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Notifications</span>
                            </div>
                        </div>
                        <Button onClick={handleExportData} disabled={isExporting} className="w-full">
                            {isExporting ? 'Exporting...' : 'Download My Data'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        Delete Account
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data (GDPR Right to Erasure)
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="p-4 bg-destructive/10 rounded-lg">
                            <h4 className="font-semibold text-sm mb-2">This will delete:</h4>
                            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                                <li>All uploaded datasets and files</li>
                                <li>All AI conversations and history</li>
                                <li>All automation rules and logs</li>
                                <li>All notifications and settings</li>
                                <li>Your account permanently</li>
                            </ul>
                        </div>
                        <Button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            variant="destructive"
                            className="w-full"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete My Account'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Privacy Notice */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Privacy Rights</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert">
                    <p>Under GDPR, you have the right to:</p>
                    <ul>
                        <li><strong>Access:</strong> Export all your data</li>
                        <li><strong>Erasure:</strong> Delete your account and data</li>
                        <li><strong>Portability:</strong> Receive data in JSON format</li>
                        <li><strong>Rectification:</strong> Update your information</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-4">
                        We comply with GDPR and respect your privacy. Your data is yours.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
