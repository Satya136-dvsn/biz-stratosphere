/**
 * MFA Setup Component
 * 
 * Multi-step wizard for setting up Two-Factor Authentication:
 * 1. Display QR code and manual secret
 * 2. Verify setup with TOTP code
 * 3. Display and save backup codes
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
    Shield,
    Download,
    Copy,
    CheckCircle2,
    AlertCircle,
    Smartphone,
    Key,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import {
    generateTOTPSecret,
    verifyTOTPToken,
    generateBackupCodes,
    downloadBackupCodes,
    copyBackupCodesToClipboard,
    type TOTPSecret,
    type BackupCode,
} from '@/lib/mfa';
import { supabase } from '@/integrations/supabase/client';
import { encryptData } from '@/lib/encryption';
import { getDataKey } from '@/lib/keyManagement';

interface MFASetupProps {
    sessionId: string;
    onComplete: () => void;
    onCancel: () => void;
}

type SetupStep = 'scan' | 'verify' | 'backup' | 'complete';

export function MFASetup({ sessionId, onComplete, onCancel }: MFASetupProps) {
    const [step, setStep] = useState<SetupStep>('scan');
    const [totpSecret, setTotpSecret] = useState<TOTPSecret | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [codesSaved, setCodesSaved] = useState(false);
    const { toast } = useToast();

    // Step 1: Generate and display QR code
    const handleGenerateQR = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !user.email) {
                throw new Error('User not authenticated');
            }

            const secret = await generateTOTPSecret(user.email);
            setTotpSecret(secret);
            setStep('verify');
        } catch (err) {
            console.error('QR generation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify TOTP code
    const handleVerifyCode = async () => {
        if (!totpSecret) return;

        setLoading(true);
        setError(null);

        try {
            // Verify the code
            const result = verifyTOTPToken(verificationCode, totpSecret.secret);

            if (!result.valid) {
                throw new Error(result.error || 'Invalid verification code');
            }

            // Generate backup codes
            const codes = generateBackupCodes();
            setBackupCodes(codes);

            // Save encrypted secret to database
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Encrypt the TOTP secret before storing
            const encryptionKey = getDataKey(sessionId);
            const encryptedSecret = encryptData(totpSecret.secret, encryptionKey);

            // Store MFA secret
            const { error: secretError } = await supabase
                .from('mfa_secrets')
                .upsert({
                    user_id: user.id,
                    secret_encrypted: JSON.stringify(encryptedSecret),
                    is_enabled: true,
                    is_verified: true,
                    verified_at: new Date().toISOString(),
                });

            if (secretError) throw secretError;

            // Store backup codes (hashed)
            const backupCodeRecords = codes.map(code => ({
                user_id: user.id,
                code_hash: code.hash,
            }));

            const { error: codesError } = await supabase
                .from('mfa_backup_codes')
                .insert(backupCodeRecords);

            if (codesError) throw codesError;

            toast({
                title: 'MFA Verified',
                description: 'Two-factor authentication has been successfully enabled',
            });

            setStep('backup');
        } catch (err) {
            console.error('Verification error:', err);
            setError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Complete setup
    const handleComplete = () => {
        if (!codesSaved) {
            setError('Please save your backup codes before continuing');
            return;
        }

        setStep('complete');
        setTimeout(() => {
            onComplete();
        }, 2000);
    };

    // Download codes
    const handleDownloadCodes = () => {
        downloadBackupCodes(backupCodes);
        setCodesSaved(true);
        toast({
            title: 'Downloaded',
            description: 'Backup codes have been downloaded',
        });
    };

    // Copy codes to clipboard
    const handleCopyCodes = async () => {
        await copyBackupCodesToClipboard(backupCodes);
        setCodesSaved(true);
        toast({
            title: 'Copied',
            description: 'Backup codes copied to clipboard',
        });
    };

    // Initialize on mount
    useState(() => {
        if (step === 'scan' && !totpSecret) {
            handleGenerateQR();
        }
    });

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-primary" />
                        <CardTitle>Enable Two-Factor Authentication</CardTitle>
                    </div>
                    <CardDescription>
                        Add an extra layer of security to your account
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-between mb-6">
                        {(['scan', 'verify', 'backup'] as const).map((s, idx) => (
                            <div key={s} className="flex items-center">
                                <div
                                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${step === s
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : idx < (['scan', 'verify', 'backup'] as const).indexOf(step)
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-muted-foreground/30 text-muted-foreground'
                                        }`}
                                >
                                    {idx + 1}
                                </div>
                                {idx < 2 && (
                                    <div
                                        className={`w-20 h-0.5 mx-2 ${idx < (['scan', 'verify', 'backup'] as const).indexOf(step)
                                                ? 'bg-primary'
                                                : 'bg-muted-foreground/30'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Step 1: Scan QR Code */}
                    {step === 'scan' && totpSecret && (
                        <div className="space-y-4">
                            <div className="text-center space-y-4">
                                <Smartphone className="h-12 w-12 mx-auto text-primary" />
                                <h3 className="text-lg font-semibold">Scan QR Code</h3>
                                <p className="text-sm text-muted-foreground">
                                    Use an authenticator app like Google Authenticator, Authy, or 1Password to scan this QR code
                                </p>
                            </div>

                            {/* QR Code */}
                            <div className="flex justify-center p-4 bg-white rounded-lg">
                                <img
                                    src={totpSecret.qrCode}
                                    alt="QR Code for MFA setup"
                                    className="w-64 h-64"
                                />
                            </div>

                            {/* Manual Entry */}
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Can't scan? Enter this code manually:</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                                        {totpSecret.secret}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(totpSecret.secret);
                                            toast({ title: 'Copied', description: 'Secret key copied to clipboard' });
                                        }}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <Button
                                onClick={() => setStep('verify')}
                                className="w-full"
                                disabled={loading}
                            >
                                Continue <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Verify Code */}
                    {step === 'verify' && (
                        <div className="space-y-4">
                            <div className="text-center space-y-4">
                                <Key className="h-12 w-12 mx-auto text-primary" />
                                <h3 className="text-lg font-semibold">Verify Setup</h3>
                                <p className="text-sm text-muted-foreground">
                                    Enter the 6-digit code from your authenticator app to confirm setup
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Verification Code</label>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                    className="text-center text-2xl tracking-widest"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('scan')}
                                    className="flex-1"
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <Button
                                    onClick={handleVerifyCode}
                                    disabled={verificationCode.length !== 6 || loading}
                                    className="flex-1"
                                >
                                    {loading ? 'Verifying...' : 'Verify & Continue'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Backup Codes */}
                    {step === 'backup' && (
                        <div className="space-y-4">
                            <div className="text-center space-y-4">
                                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                                <h3 className="text-lg font-semibold">Save Backup Codes</h3>
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Important:</strong> Save these codes in a safe place.
                                        You'll need them if you lose access to your authenticator app.
                                        Each code can only be used once.
                                    </AlertDescription>
                                </Alert>
                            </div>

                            {/* Backup Codes Grid */}
                            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                                {backupCodes.map((code, idx) => (
                                    <div key={idx} className="font-mono text-sm p-2 bg-background rounded">
                                        {idx + 1}. {code.code}
                                    </div>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleDownloadCodes}
                                    className="flex-1"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleCopyCodes}
                                    className="flex-1"
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy
                                </Button>
                            </div>

                            <Button
                                onClick={handleComplete}
                                disabled={!codesSaved}
                                className="w-full"
                            >
                                {codesSaved ? 'Complete Setup' : 'Save codes first'}
                            </Button>
                        </div>
                    )}

                    {/* Step 4: Complete */}
                    {step === 'complete' && (
                        <div className="text-center space-y-4 py-8">
                            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
                            <h3 className="text-2xl font-bold">All Set!</h3>
                            <p className="text-muted-foreground">
                                Two-factor authentication is now enabled on your account
                            </p>
                        </div>
                    )}

                    {/* Cancel Button */}
                    {step !== 'complete' && (
                        <Button
                            variant="ghost"
                            onClick={onCancel}
                            className="w-full"
                        >
                            Cancel Setup
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
