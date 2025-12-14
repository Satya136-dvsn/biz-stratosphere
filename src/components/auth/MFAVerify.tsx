/**
 * MFA Verification Component
 * 
 * Displays during login when user has MFA enabled.
 * Supports both TOTP codes and backup recovery codes.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertCircle, Key, RefreshCw } from 'lucide-react';
import { verifyTOTPToken, verifyBackupCode } from '@/lib/mfa';
import { supabase } from '@/integrations/supabase/client';
import { decryptData } from '@/lib/encryption';
import { getDataKey } from '@/lib/keyManagement';

interface MFAVerifyProps {
    userId: string;
    sessionId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

type VerificationMode = 'totp' | 'backup';

export function MFAVerify({ userId, sessionId, onSuccess, onCancel }: MFAVerifyProps) {
    const [mode, setMode] = useState<VerificationMode>('totp');
    const [code, setCode] = useState('');
    const [trustDevice, setTrustDevice] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);
    const { toast } = useToast();

    const MAX_ATTEMPTS = 5;

    // Verify TOTP code
    const handleVerifyTOTP = async () => {
        if (code.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch encrypted secret from database
            const { data: secretData, error: fetchError } = await supabase
                .from('mfa_secrets')
                .select('secret_encrypted')
                .eq('user_id', userId)
                .eq('is_enabled', true)
                .single();

            if (fetchError || !secretData) {
                throw new Error('MFA secret not found');
            }

            // Decrypt the secret
            const encryptionKey = getDataKey(sessionId);
            const encryptedSecret = JSON.parse(secretData.secret_encrypted);
            const secret = decryptData(encryptedSecret, encryptionKey);

            // Verify the TOTP code
            const result = verifyTOTPToken(code, secret);

            if (!result.valid) {
                setAttempts(prev => prev + 1);

                // Log failed attempt
                await supabase.from('mfa_verification_attempts').insert({
                    user_id: userId,
                    success: false,
                    method: 'totp',
                });

                if (attempts + 1 >= MAX_ATTEMPTS) {
                    throw new Error('Too many failed attempts. Please try again later.');
                }

                throw new Error(result.error || 'Invalid code');
            }

            // Log successful attempt
            await supabase.from('mfa_verification_attempts').insert({
                user_id: userId,
                success: true,
                method: 'totp',
            });

            // Trust device if requested
            if (trustDevice) {
                await handleTrustDevice();
            }

            toast({
                title: 'Verified',
                description: 'Authentication successful',
            });

            onSuccess();
        } catch (err) {
            console.error('TOTP verification error:', err);
            setError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    // Verify backup code
    const handleVerifyBackupCode = async () => {
        if (code.length === 0) {
            setError('Please enter a backup code');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch all unused backup codes for user
            const { data: codes, error: fetchError } = await supabase
                .from('mfa_backup_codes')
                .select('id, code_hash')
                .eq('user_id', userId)
                .is('used_at', null);

            if (fetchError) throw fetchError;

            if (!codes || codes.length === 0) {
                throw new Error('No backup codes available');
            }

            // Try to match the code
            let matchedCodeId: string | null = null;
            for (const codeData of codes) {
                if (verifyBackupCode(code, codeData.code_hash)) {
                    matchedCodeId = codeData.id;
                    break;
                }
            }

            if (!matchedCodeId) {
                setAttempts(prev => prev + 1);

                // Log failed attempt
                await supabase.from('mfa_verification_attempts').insert({
                    user_id: userId,
                    success: false,
                    method: 'backup_code',
                });

                if (attempts + 1 >= MAX_ATTEMPTS) {
                    throw new Error('Too many failed attempts. Please try again later.');
                }

                throw new Error('Invalid backup code');
            }

            // Mark code as used
            const { error: updateError } = await supabase
                .from('mfa_backup_codes')
                .update({ used_at: new Date().toISOString() })
                .eq('id', matchedCodeId);

            if (updateError) throw updateError;

            // Log successful attempt
            await supabase.from('mfa_verification_attempts').insert({
                user_id: userId,
                success: true,
                method: 'backup_code',
            });

            // Check remaining codes
            const remainingCodes = codes.length - 1;
            if (remainingCodes <= 2) {
                toast({
                    title: 'Warning',
                    description: `Only ${remainingCodes} backup code(s) remaining. Please generate new codes.`,
                    variant: 'destructive',
                });
            }

            toast({
                title: 'Verified',
                description: 'Backup code accepted',
            });

            onSuccess();
        } catch (err) {
            console.error('Backup code verification error:', err);
            setError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    // Trust current device
    const handleTrustDevice = async () => {
        try {
            // Generate device fingerprint (simplified version)
            const fingerprint = await generateDeviceFingerprint();

            // Trust for 30 days
            const trustedUntil = new Date();
            trustedUntil.setDate(trustedUntil.getDate() + 30);

            await supabase.from('mfa_trusted_devices').upsert({
                user_id: userId,
                device_fingerprint: fingerprint,
                device_name: navigator.userAgent,
                trusted_until: trustedUntil.toISOString(),
            });
        } catch (err) {
            console.error('Error trusting device:', err);
            // Non-critical error, don't block login
        }
    };

    // Generate device fingerprint
    const generateDeviceFingerprint = async (): Promise<string> => {
        const components = [
            navigator.userAgent,
            navigator.language,
            new Date().getTimezoneOffset(),
            screen.width,
            screen.height,
            screen.colorDepth,
        ].join('|');

        // Simple hash (in production, use a proper fingerprinting library)
        const encoder = new TextEncoder();
        const data = encoder.encode(components);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // Handle verification based on mode
    const handleVerify = () => {
        if (mode === 'totp') {
            handleVerifyTOTP();
        } else {
            handleVerifyBackupCode();
        }
    };

    // Handle Enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && code.length > 0 && !loading) {
            handleVerify();
        }
    };

    return (
        <div className="max-w-md mx-auto p-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-primary" />
                        <CardTitle>Two-Factor Authentication</CardTitle>
                    </div>
                    <CardDescription>
                        {mode === 'totp'
                            ? 'Enter the code from your authenticator app'
                            : 'Enter one of your backup recovery codes'
                        }
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {attempts > 0 && attempts < MAX_ATTEMPTS && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {MAX_ATTEMPTS - attempts} attempt(s) remaining
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Code Input */}
                    <div className="space-y-2">
                        <Label htmlFor="code">
                            {mode === 'totp' ? 'Verification Code' : 'Backup Code'}
                        </Label>
                        <div className="relative">
                            <Input
                                id="code"
                                type="text"
                                inputMode={mode === 'totp' ? 'numeric' : 'text'}
                                pattern={mode === 'totp' ? '[0-9]*' : undefined}
                                maxLength={mode === 'totp' ? 6 : undefined}
                                placeholder={mode === 'totp' ? '000000' : 'XXXX-XXXX'}
                                value={code}
                                onChange={(e) => {
                                    const value = mode === 'totp'
                                        ? e.target.value.replace(/\D/g, '')
                                        : e.target.value.toUpperCase();
                                    setCode(value);
                                    setError(null);
                                }}
                                onKeyPress={handleKeyPress}
                                className={mode === 'totp' ? 'text-center text-2xl tracking-widest' : 'font-mono'}
                                autoFocus
                                disabled={loading || attempts >= MAX_ATTEMPTS}
                            />
                            {mode === 'totp' && (
                                <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            )}
                        </div>
                    </div>

                    {/* Trust Device (only for TOTP) */}
                    {mode === 'totp' && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="trust"
                                checked={trustDevice}
                                onCheckedChange={(checked) => setTrustDevice(checked as boolean)}
                            />
                            <Label htmlFor="trust" className="text-sm cursor-pointer">
                                Trust this device for 30 days
                            </Label>
                        </div>
                    )}

                    {/* Verify Button */}
                    <Button
                        onClick={handleVerify}
                        disabled={code.length === 0 || loading || attempts >= MAX_ATTEMPTS}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            'Verify'
                        )}
                    </Button>

                    {/* Mode Toggle */}
                    <div className="text-center">
                        <Button
                            variant="link"
                            onClick={() => {
                                setMode(mode === 'totp' ? 'backup' : 'totp');
                                setCode('');
                                setError(null);
                            }}
                            className="text-sm"
                        >
                            {mode === 'totp'
                                ? 'Use a backup code instead'
                                : 'Use authenticator app instead'
                            }
                        </Button>
                    </div>

                    {/* Cancel Button */}
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="w-full"
                    >
                        Cancel
                    </Button>

                    {/* Help Text */}
                    {mode === 'backup' && (
                        <Alert>
                            <AlertDescription className="text-xs">
                                Backup codes are the codes you saved when setting up MFA.
                                Each code can only be used once.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
