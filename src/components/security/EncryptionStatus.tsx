// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Encryption Status Indicator Component
 * 
 * Displays encryption status for datasets and provides visual feedback.
 */

import { Shield, ShieldCheck, ShieldAlert, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface EncryptionStatusProps {
    isEncrypted: boolean;
    variant?: 'default' | 'compact' | 'badge';
    className?: string;
}

export function EncryptionStatus({
    isEncrypted,
    variant = 'default',
    className
}: EncryptionStatusProps) {
    if (variant === 'badge') {
        return (
            <Badge
                variant={isEncrypted ? 'default' : 'secondary'}
                className={cn(
                    'flex items-center gap-1',
                    isEncrypted && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20',
                    className
                )}
            >
                {isEncrypted ? (
                    <>
                        <ShieldCheck className="h-3 w-3" />
                        <span>Encrypted</span>
                    </>
                ) : (
                    <>
                        <ShieldAlert className="h-3 w-3" />
                        <span>Unencrypted</span>
                    </>
                )}
            </Badge>
        );
    }

    if (variant === 'compact') {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <div className={cn(
                            'flex items-center gap-1.5 text-sm',
                            isEncrypted ? 'text-emerald-600' : 'text-amber-600',
                            className
                        )}>
                            {isEncrypted ? (
                                <Lock className="h-4 w-4" />
                            ) : (
                                <ShieldAlert className="h-4 w-4" />
                            )}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{isEncrypted ? 'End-to-end encrypted' : 'Not encrypted'}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <div className={cn(
            'flex items-center gap-2 p-3 rounded-lg border',
            isEncrypted
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-amber-500/5 border-amber-500/20',
            className
        )}>
            {isEncrypted ? (
                <>
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                            End-to-End Encrypted
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">
                            Protected with AES-256-GCM encryption
                        </p>
                    </div>
                </>
            ) : (
                <>
                    <ShieldAlert className="h-5 w-5 text-amber-600" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            Not Encrypted
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            Data is stored without encryption
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}

/**
 * Encryption Progress Indicator
 */
interface EncryptionProgressProps {
    stage: 'parsing' | 'encrypting' | 'uploading' | 'complete';
    percent: number;
    message?: string;
}

export function EncryptionProgress({
    stage,
    percent,
    message
}: EncryptionProgressProps) {
    const getStageInfo = () => {
        switch (stage) {
            case 'parsing':
                return { icon: Shield, color: 'text-blue-600', label: 'Parsing' };
            case 'encrypting':
                return { icon: Lock, color: 'text-purple-600', label: 'Encrypting' };
            case 'uploading':
                return { icon: ShieldCheck, color: 'text-indigo-600', label: 'Uploading' };
            case 'complete':
                return { icon: ShieldCheck, color: 'text-emerald-600', label: 'Complete' };
        }
    };

    const { icon: Icon, color, label } = getStageInfo();

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Icon className={cn('h-5 w-5 animate-pulse', color)} />
                <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{label}</span>
                        <span className="text-muted-foreground">{percent}%</span>
                    </div>
                    {message && (
                        <p className="text-xs text-muted-foreground">{message}</p>
                    )}
                </div>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
                <div
                    className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        stage === 'complete' ? 'bg-emerald-500' : 'bg-primary'
                    )}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

/**
 * Encryption Stats Display
 */
interface EncryptionStatsProps {
    total: number;
    encrypted: number;
    unencrypted: number;
}

export function EncryptionStats({
    total,
    encrypted,
    unencrypted
}: EncryptionStatsProps) {
    const encryptionRate = total > 0 ? Math.round((encrypted / total) * 100) : 0;

    return (
        <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-card border">
                <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Total Datasets</p>
                </div>
                <p className="text-2xl font-bold">{total}</p>
            </div>

            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">Encrypted</p>
                </div>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{encrypted}</p>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">Unencrypted</p>
                </div>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{unencrypted}</p>
            </div>
        </div>
    );
}
