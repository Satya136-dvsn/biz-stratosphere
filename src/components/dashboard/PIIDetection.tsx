import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Eye, EyeOff, Shield } from 'lucide-react';
import { useState, useMemo } from 'react';
import { detectPII, PIIDetectionResult, getPIITypeLabel, getPIISeverity, maskPII } from '@/lib/piiDetection';

interface PIIDetectionProps {
    data: any[];
    columns: string[];
}

export function PIIDetection({ data, columns }: PIIDetectionProps) {
    const [maskedColumns, setMaskedColumns] = useState<Set<string>>(new Set());

    // Detect PII using comprehensive library
    const piiResults = useMemo(() => {
        if (!data || data.length === 0) return [];
        return detectPII(data);
    }, [data]);

    const toggleMask = (column: string) => {
        setMaskedColumns((prev) => {
            const next = new Set(prev);
            if (next.has(column)) {
                next.delete(column);
            } else {
                next.add(column);
            }
            return next;
        });
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'destructive';
            case 'high':
                return 'default';
            default:
                return 'secondary';
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            PII Detection
                        </CardTitle>
                        <Badge variant={piiResults.length > 0 ? 'destructive' : 'default'}>
                            {piiResults.length} column{piiResults.length !== 1 ? 's' : ''} flagged
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Automatically detected potentially sensitive personally identifiable information
                    </p>
                </CardHeader>
                <CardContent>
                    {piiResults.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Shield className="h-12 w-12 mx-auto mb-2 text-green-500" />
                            <p className="font-medium">No PII detected in your data</p>
                            <p className="text-xs mt-1">Your data appears to be safe for processing</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {piiResults.map((result: PIIDetectionResult, idx: number) => {
                                const highestSeverity = Math.max(
                                    ...result.piiTypes.map(type => {
                                        const severity = getPIISeverity(type);
                                        return severity === 'critical' ? 3 : severity === 'high' ? 2 : 1;
                                    })
                                );
                                const severityLabel = highestSeverity === 3 ? 'critical' : highestSeverity === 2 ? 'high' : 'medium';

                                return (
                                    <div key={idx} className="p-4 border rounded-lg">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AlertTriangle className={`h-4 w-4 ${severityLabel === 'critical' ? 'text-red-500' :
                                                            severityLabel === 'high' ? 'text-orange-500' :
                                                                'text-yellow-500'
                                                        }`} />
                                                    <h4 className="font-semibold">{result.columnName}</h4>
                                                    <Badge variant="outline" className="text-xs">
                                                        {result.confidence} confidence
                                                    </Badge>
                                                </div>
                                                <div className="flex gap-1 flex-wrap">
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
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => toggleMask(result.columnName)}
                                            >
                                                {maskedColumns.has(result.columnName) ? (
                                                    <>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Show
                                                    </>
                                                ) : (
                                                    <>
                                                        <EyeOff className="h-4 w-4 mr-2" />
                                                        Mask
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        {result.sampleValues.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-xs font-medium text-muted-foreground mb-1">Samples:</p>
                                                <div className="space-y-1">
                                                    {result.sampleValues.map((sample, sidx) => (
                                                        <code key={sidx} className="block text-xs bg-muted p-2 rounded">
                                                            {maskedColumns.has(result.columnName)
                                                                ? maskPII(sample, result.piiTypes[0])
                                                                : sample}
                                                        </code>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
