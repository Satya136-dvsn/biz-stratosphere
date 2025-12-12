import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Info } from 'lucide-react';
import { PIIDetectionResult, getPIITypeLabel, getPIISeverity, maskPII } from '@/lib/piiDetection';

interface PIIConsentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    piiResults: PIIDetectionResult[];
    onConsent: () => void;
    onReject: () => void;
}

export function PIIConsentDialog({
    open,
    onOpenChange,
    piiResults,
    onConsent,
    onReject,
}: PIIConsentDialogProps) {
    const criticalPII = piiResults.filter(r =>
        r.piiTypes.some(type => getPIISeverity(type) === 'critical')
    );

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'destructive';
            case 'high':
                return 'warning';
            default:
                return 'secondary';
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-xl">
                        <Shield className="h-6 w-6 text-destructive" />
                        Personally Identifiable Information Detected
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base">
                        We've detected {piiResults.length} column{piiResults.length > 1 ? 's' : ''} containing
                        potentially sensitive personal information. Please review and confirm before proceeding.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 my-4">
                    {criticalPII.length > 0 && (
                        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-destructive">Critical PII Detected</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {criticalPII.length} column{criticalPII.length > 1 ? 's contain' : ' contains'} highly sensitive information
                                        (SSN, Credit Card). Exercise extreme caution.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Detected PII Columns
                        </h4>

                        {piiResults.map((result, idx) => (
                            <div key={idx} className="border rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="font-medium">{result.columnName}</div>
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {result.piiTypes.map((type) => (
                                                <Badge
                                                    key={type}
                                                    variant={getSeverityColor(getPIISeverity(type)) as any}
                                                    className="text-xs"
                                                >
                                                    {getPIITypeLabel(type)}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {result.confidence} confidence
                                    </Badge>
                                </div>

                                {result.sampleValues.length > 0 && (
                                    <div className="mt-2 text-xs">
                                        <div className="text-muted-foreground mb-1">Sample values (masked):</div>
                                        <div className="space-y-1">
                                            {result.sampleValues.map((value, vidx) => (
                                                <code key={vidx} className="block bg-muted p-1.5 rounded">
                                                    {maskPII(value, result.piiTypes[0])}
                                                </code>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">Data Processing Consent</h4>
                        <p className="text-sm text-muted-foreground">
                            By proceeding, you acknowledge that:
                        </p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                            <li>This data contains personally identifiable information</li>
                            <li>You have the legal right to process this data</li>
                            <li>You've obtained necessary consent from data subjects</li>
                            <li>Data will be stored securely and used only for analytics</li>
                            <li>You comply with applicable privacy regulations (GDPR, CCPA, etc.)</li>
                        </ul>
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onReject}>
                        Cancel Upload
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={onConsent} className="bg-primary">
                        I Consent - Proceed with Upload
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
