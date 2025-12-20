import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Download, Upload, Info, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { batchPredict, formatBatchResultsCSV, BatchResult } from '@/lib/batchPredictor';

const MODEL_CONFIGS = {
    churn: {
        name: 'churn_model_trained',
        featureNames: ['usage_frequency', 'support_tickets', 'tenure_months', 'monthly_spend', 'feature_usage_pct'],
        templateCSV: `usage_frequency,support_tickets,tenure_months,monthly_spend,feature_usage_pct
75,2,24,250,80
30,8,6,80,35
90,1,48,400,95`,
    },
    revenue: {
        name: 'revenue_model_trained',
        featureNames: ['num_customers', 'avg_deal_size', 'marketing_spend', 'sales_team_size', 'market_growth_pct'],
        templateCSV: `num_customers,avg_deal_size,marketing_spend,sales_team_size,market_growth_pct
250,2500,15000,10,5
100,5000,8000,5,3
500,1500,25000,20,8`,
    },
};

export function BatchPredictionPanel() {
    const { toast } = useToast();
    const [modelType, setModelType] = useState<'churn' | 'revenue'>('churn');
    const [csvData, setCsvData] = useState<number[][] | null>(null);
    const [results, setResults] = useState<BatchResult[] | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);

    const config = MODEL_CONFIGS[modelType];

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const lines = text.trim().split('\n');

            if (lines.length < 2) {
                throw new Error('CSV must contain header and at least one data row');
            }

            // Parse header
            const header = lines[0].toLowerCase().split(',').map(h => h.trim());

            // Validate headers
            const missingCols = config.featureNames.filter(col => !header.includes(col));
            if (missingCols.length > 0) {
                throw new Error(`Missing columns: ${missingCols.join(', ')}`);
            }

            // Get column indices
            const indices = config.featureNames.map(name => header.indexOf(name));

            // Parse data rows
            const data: number[][] = [];
            const parseErrors: string[] = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const values = line.split(',').map(v => v.trim());

                try {
                    const row = indices.map(idx => parseFloat(values[idx]));

                    // Validate
                    if (row.some(v => isNaN(v))) {
                        parseErrors.push(`Row ${i + 1}: Contains non-numeric values`);
                        continue;
                    }

                    data.push(row);
                } catch (error) {
                    parseErrors.push(`Row ${i + 1}: Parse error`);
                }
            }

            setCsvData(data);
            setResults(null);
            setErrors(parseErrors);

            toast({
                title: 'CSV Loaded',
                description: `${data.length} rows ready for batch prediction${parseErrors.length > 0 ? ` (${parseErrors.length} errors)` : ''}`,
            });
        } catch (error: any) {
            toast({
                title: 'Upload Failed',
                description: error.message,
                variant: 'destructive',
            });
        }

        // Reset file input
        event.target.value = '';
    };

    const handleBatchPredict = async () => {
        if (!csvData || csvData.length === 0) return;

        setIsProcessing(true);
        setProgress(0);
        setResults(null);

        try {
            const batchResults = await batchPredict(
                csvData,
                config.name,
                {
                    onProgress: (current, total) => {
                        setProgress((current / total) * 100);
                    },
                }
            );

            setResults(batchResults);

            toast({
                title: 'Batch Complete',
                description: `Processed ${batchResults.length} predictions successfully`,
            });
        } catch (error: any) {
            toast({
                title: 'Batch Prediction Failed',
                description: error.message || 'An error occurred during batch processing',
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    const handleDownloadTemplate = () => {
        const blob = new Blob([config.templateCSV], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch_${modelType}_template.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: 'Template Downloaded',
            description: 'Use this template for batch predictions',
        });
    };

    const handleDownloadResults = () => {
        if (!results) return;

        const csv = formatBatchResultsCSV(
            results,
            modelType === 'churn',
            config.featureNames
        );

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch_predictions_${modelType}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: 'Results Downloaded',
            description: 'Batch predictions saved to CSV',
        });
    };

    const getStats = () => {
        if (!results) return null;

        const isChurn = modelType === 'churn';

        if (isChurn) {
            const churnCount = results.filter(r => r.prediction > 0.5).length;
            const stayCount = results.length - churnCount;
            return {
                churnCount,
                stayCount,
                churnRate: ((churnCount / results.length) * 100).toFixed(1),
            };
        } else {
            const totalRevenue = results.reduce((sum, r) => sum + (r.prediction * 1000), 0);
            const avgRevenue = totalRevenue / results.length;
            return {
                totalRevenue: totalRevenue.toFixed(0),
                avgRevenue: avgRevenue.toFixed(0),
            };
        }
    };

    const stats = getStats();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Batch Predictions
                </CardTitle>
                <CardDescription>
                    Process multiple predictions from CSV files (up to 1000 rows)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        Upload a CSV with features (no prediction column). Download template for correct format.
                    </AlertDescription>
                </Alert>

                {/* Model Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Select Model</label>
                    <Select value={modelType} onValueChange={(value: any) => setModelType(value)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="churn">Customer Churn Prediction</SelectItem>
                            <SelectItem value="revenue">Revenue Forecasting</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Upload Section */}
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="batch-csv-upload"
                    />
                    <label htmlFor="batch-csv-upload" className="flex-1">
                        <Button variant="outline" className="w-full" asChild>
                            <span>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload CSV
                            </span>
                        </Button>
                    </label>
                    <Button variant="outline" onClick={handleDownloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                    </Button>
                </div>

                {/* Data Status */}
                {csvData && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">{csvData.length} rows loaded</span>
                        </div>
                        {errors.length > 0 && (
                            <div className="mt-2 text-sm text-orange-700">
                                {errors.length} rows skipped (validation errors)
                            </div>
                        )}
                    </div>
                )}

                {/* Process Button */}
                {csvData && !results && (
                    <Button
                        onClick={handleBatchPredict}
                        disabled={isProcessing || csvData.length === 0}
                        className="w-full"
                        size="lg"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing... {progress.toFixed(0)}%
                            </>
                        ) : (
                            <>
                                <Zap className="h-4 w-4 mr-2" />
                                Run Batch Prediction ({csvData.length} rows)
                            </>
                        )}
                    </Button>
                )}

                {/* Progress Bar */}
                {isProcessing && (
                    <div className="space-y-2">
                        <Progress value={progress} />
                        <p className="text-sm text-center text-muted-foreground">
                            Processing predictions...
                        </p>
                    </div>
                )}

                {/* Results */}
                {results && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Results ({results.length} predictions)</h3>
                            <Button onClick={handleDownloadResults} variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Download Results CSV
                            </Button>
                        </div>

                        {/* Statistics */}
                        {stats && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {modelType === 'churn' ? (
                                    <>
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="text-sm text-red-600 font-medium">Will Churn</div>
                                            <div className="text-2xl font-bold text-red-700">{stats.churnCount}</div>
                                            <div className="text-sm text-red-600">{stats.churnRate}% of total</div>
                                        </div>
                                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="text-sm text-green-600 font-medium">Will Stay</div>
                                            <div className="text-2xl font-bold text-green-700">{stats.stayCount}</div>
                                            <div className="text-sm text-green-600">{(100 - parseFloat(stats.churnRate)).toFixed(1)}% of total</div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="text-sm text-blue-600 font-medium">Total Revenue</div>
                                            <div className="text-2xl font-bold text-blue-700">${parseInt(stats.totalRevenue).toLocaleString()}</div>
                                        </div>
                                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                            <div className="text-sm text-purple-600 font-medium">Average Revenue</div>
                                            <div className="text-2xl font-bold text-purple-700">${parseInt(stats.avgRevenue).toLocaleString()}</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Preview Table (first 10 rows) */}
                        <div>
                            <h4 className="text-sm font-medium mb-2">Preview (first 10 rows)</h4>
                            <div className="rounded-md border max-h-[400px] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Row</TableHead>
                                            <TableHead>Prediction</TableHead>
                                            <TableHead>Confidence</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {results.slice(0, 10).map((result, idx) => {
                                            const isChurn = modelType === 'churn';
                                            const predText = isChurn
                                                ? (result.prediction > 0.5 ? 'Will Churn' : 'Will Stay')
                                                : `$${(result.prediction * 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

                                            return (
                                                <TableRow key={idx}>
                                                    <TableCell>{idx + 1}</TableCell>
                                                    <TableCell className="font-medium">{predText}</TableCell>
                                                    <TableCell>{(result.confidence * 100).toFixed(1)}%</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                            {results.length > 10 && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    ...and {results.length - 10} more rows. Download CSV for full results.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
