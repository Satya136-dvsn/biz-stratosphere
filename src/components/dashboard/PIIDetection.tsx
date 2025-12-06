import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Eye, EyeOff, Shield } from 'lucide-react';
import { useState, useMemo } from 'react';

// Common PII patterns
const PII_PATTERNS = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    credit_card: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    ip_address: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
};

interface PIIDetectionProps {
    data: any[];
    columns: string[];
}

export function PIIDetection({ data, columns }: PIIDetectionProps) {
    const [maskedColumns, setMaskedColumns] = useState<Set<string>>(new Set());

    // Detect PII in data
    const piiDetection = useMemo(() => {
        const results: Record<string, { type: string; count: number; samples: string[] }> = {};

        columns.forEach((column) => {
            const columnData = data.map((row) => String(row[column] || '')).filter(Boolean);

            Object.entries(PII_PATTERNS).forEach(([type, pattern]) => {
                const matches = columnData.join(' ').match(pattern);
                if (matches && matches.length > 0) {
                    if (!results[column]) {
                        results[column] = { type, count: matches.length, samples: matches.slice(0, 3) };
                    }
                }
            });

            // Check column names for common PII indicators
            const piiKeywords = ['email', 'phone', 'ssn', 'credit', 'card', 'password', 'address', 'ip'];
            const columnLower = column.toLowerCase();
            if (piiKeywords.some(keyword => columnLower.includes(keyword))) {
                if (!results[column]) {
                    results[column] = { type: 'potential_pii', count: columnData.length, samples: columnData.slice(0, 3) };
                }
            }
        });

        return results;
    }, [data, columns]);

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

    const maskValue = (value: string): string => {
        return '*'.repeat(Math.min(value.length, 10));
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
                        <Badge variant={Object.keys(piiDetection).length > 0 ? 'destructive' : 'default'}>
                            {Object.keys(piiDetection).length} columns flagged
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Automatically detected potential personally identifiable information
                    </p>
                </CardHeader>
                <CardContent>
                    {Object.keys(piiDetection).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Shield className="h-12 w-12 mx-auto mb-2 text-green-500" />
                            <p>No PII detected in your data</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(piiDetection).map(([column, info]) => (
                                <div key={column} className="p-4 border rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                                <h4 className="font-semibold">{column}</h4>
                                                <Badge variant="outline" className="text-xs">
                                                    {info.type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {info.count} potential PII values detected
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => toggleMask(column)}
                                        >
                                            {maskedColumns.has(column) ? (
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
                                    {info.samples.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs text-muted-foreground mb-1">Samples:</p>
                                            <div className="space-y-1">
                                                {info.samples.map((sample, idx) => (
                                                    <code key={idx} className="block text-xs bg-muted p-1 rounded">
                                                        {maskedColumns.has(column) ? maskValue(sample) : sample}
                                                    </code>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
