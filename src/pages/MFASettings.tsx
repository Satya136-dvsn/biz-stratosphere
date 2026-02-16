// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * MFA Settings Page
 * 
 * Allows users to manage their Multi-Factor Authentication settings:
 * - Enable/disable MFA
 * - View backup codes
 * - Regenerate backup codes
 * - Manage trusted devices
 * - View verification history
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
    Shield,
    ShieldCheck,
    ShieldAlert,
    Key,
    Smartphone,
    Clock,
    Trash2,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MFASetup } from '@/components/auth/MFASetup';
import { generateBackupCodes, downloadBackupCodes, type BackupCode } from '@/lib/mfa';

interface MFAStatus {
    enabled: boolean;
    verified: boolean;
    verifiedAt: string | null;
    backupCodesRemaining: number;
    trustedDevicesCount: number;
}

interface TrustedDevice {
    id: string;
    deviceName: string;
    trustedUntil: string;
    lastUsedAt: string;
    createdAt: string;
}

interface VerificationAttempt {
    id: string;
    success: boolean;
    method: string;
    createdAt: string;
}

export function MFASettings() {
    const [status, setStatus] = useState<MFAStatus | null>(null);
    const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
    const [recentAttempts, setRecentAttempts] = useState<VerificationAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSetup, setShowSetup] = useState(false);
    const [sessionId] = useState('demo-session'); // TODO: Get from auth context
    const { toast } = useToast();

    // Load MFA status
    useEffect(() => {
        loadMFAStatus();
        loadTrustedDevices();
        loadRecentAttempts();
    }, []);

    const loadMFAStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('user_mfa_status')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                setStatus({
                    enabled: data.mfa_enabled || false,
                    verified: data.mfa_verified || false,
                    verifiedAt: data.verified_at,
                    backupCodesRemaining: data.backup_codes_remaining || 0,
                    trustedDevicesCount: data.trusted_devices_count || 0,
                });
            }
        } catch (err) {
            console.error('Error loading MFA status:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadTrustedDevices = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('mfa_trusted_devices')
                .select('*')
                .eq('user_id', user.id)
                .gt('trusted_until', new Date().toISOString())
                .order('last_used_at', { ascending: false });

            if (error) throw error;

            setTrustedDevices(data || []);
        } catch (err) {
            console.error('Error loading trusted devices:', err);
        }
    };

    const loadRecentAttempts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('mfa_verification_attempts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            setRecentAttempts(data || []);
        } catch (err) {
            console.error('Error loading verification attempts:', err);
        }
    };

    const handleDisableMFA = async () => {
        if (!confirm('Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.')) {
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Disable MFA
            const { error } = await supabase
                .from('mfa_secrets')
                .update({ is_enabled: false })
                .eq('user_id', user.id);

            if (error) throw error;

            toast({
                title: 'MFA Disabled',
                description: 'Two-factor authentication has been disabled',
            });

            await loadMFAStatus();
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to disable MFA',
                variant: 'destructive',
            });
        }
    };

    const handleRegenerateCodes = async () => {
        if (!confirm('This will invalidate all existing backup codes. Continue?')) {
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Delete old codes
            await supabase
                .from('mfa_backup_codes')
                .delete()
                .eq('user_id', user.id);

            // Generate new codes
            const newCodes = generateBackupCodes();

            // Store new codes
            const codeRecords = newCodes.map(code => ({
                user_id: user.id,
                code_hash: code.hash,
            }));

            await supabase
                .from('mfa_backup_codes')
                .insert(codeRecords);

            // Download new codes
            downloadBackupCodes(newCodes);

            toast({
                title: 'Codes Regenerated',
                description: 'New backup codes have been generated and downloaded',
            });

            await loadMFAStatus();
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to regenerate backup codes',
                variant: 'destructive',
            });
        }
    };

    const handleRevokeTrust = async (deviceId: string) => {
        try {
            const { error } = await supabase
                .from('mfa_trusted_devices')
                .delete()
                .eq('id', deviceId);

            if (error) throw error;

            toast({
                title: 'Device Removed',
                description: 'Device trust has been revoked',
            });

            await loadTrustedDevices();
            await loadMFAStatus();
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to revoke device trust',
                variant: 'destructive',
            });
        }
    };

    if (showSetup) {
        return (
            <MFASetup
                sessionId={sessionId}
                onComplete={() => {
                    setShowSetup(false);
                    loadMFAStatus();
                }}
                onCancel={() => setShowSetup(false)}
            />
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Two-Factor Authentication</h1>
                    <p className="text-muted-foreground">
                        Add an extra layer of security to your account
                    </p>
                </div>
            </div>

            {/* MFA Status Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {status?.enabled ? (
                                <ShieldCheck className="h-6 w-6 text-green-500" />
                            ) : (
                                <ShieldAlert className="h-6 w-6 text-amber-500" />
                            )}
                            <CardTitle>MFA Status</CardTitle>
                        </div>
                        <Badge variant={status?.enabled ? 'default' : 'secondary'}>
                            {status?.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                    </div>
                    <CardDescription>
                        {status?.enabled
                            ? 'Your account is protected with two-factor authentication'
                            : 'Enable MFA to add an extra layer of security'
                        }
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {status?.enabled && status.verified && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Verified</p>
                                <p className="text-sm font-medium">
                                    {new Date(status.verifiedAt!).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Backup Codes</p>
                                <p className="text-sm font-medium">
                                    {status.backupCodesRemaining} remaining
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Trusted Devices</p>
                                <p className="text-sm font-medium">
                                    {status.trustedDevicesCount} active
                                </p>
                            </div>
                        </div>
                    )}

                    {status?.backupCodesRemaining !== undefined && status.backupCodesRemaining <= 2 && status.backupCodesRemaining > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                You have {status.backupCodesRemaining} backup code(s) remaining.
                                Please regenerate new codes soon.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-2">
                        {!status?.enabled ? (
                            <Button onClick={() => setShowSetup(true)}>
                                <Shield className="mr-2 h-4 w-4" />
                                Enable MFA
                            </Button>
                        ) : (
                            <>
                                <Button variant="destructive" onClick={handleDisableMFA}>
                                    Disable MFA
                                </Button>
                                <Button variant="outline" onClick={handleRegenerateCodes}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Regenerate Backup Codes
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Trusted Devices */}
            {status?.enabled && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5" />
                            <CardTitle>Trusted Devices</CardTitle>
                        </div>
                        <CardDescription>
                            Devices that you've marked as trusted (won't ask for MFA for 30 days)
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {trustedDevices.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No trusted devices</p>
                        ) : (
                            <div className="space-y-3">
                                {trustedDevices.map((device) => (
                                    <div
                                        key={device.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium line-clamp-1">
                                                {device.deviceName || 'Unknown Device'}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Last used: {new Date(device.lastUsedAt).toLocaleDateString()}
                                                </span>
                                                <span>
                                                    Expires: {new Date(device.trustedUntil).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRevokeTrust(device.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Recent Verification Attempts */}
            {status?.enabled && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            <CardTitle>Recent Verification Attempts</CardTitle>
                        </div>
                        <CardDescription>
                            View your recent MFA verification history
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {recentAttempts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No recent attempts</p>
                        ) : (
                            <div className="space-y-2">
                                {recentAttempts.map((attempt) => (
                                    <div
                                        key={attempt.id}
                                        className="flex items-center justify-between p-2 border rounded"
                                    >
                                        <div className="flex items-center gap-3">
                                            {attempt.success ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                            )}
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {attempt.success ? 'Successful' : 'Failed'} verification
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Method: {attempt.method} • {new Date(attempt.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
