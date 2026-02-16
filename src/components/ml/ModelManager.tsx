// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Download, Upload, Trash2, CheckCircle2, Info, Package, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    exportModel,
    importModel,
    listModels,
    deleteModel,
    getModelInfo,
    ModelMetadata
} from '@/lib/modelExporter';
import { useAdvancedML } from '@/hooks/useAdvancedML';

export function ModelManager() {
    const { toast } = useToast();
    const [models, setModels] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const { metrics, isLoadingMetrics } = useAdvancedML();

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        setIsLoading(true);
        try {
            const modelList = await listModels();
            setModels(modelList);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: 'Failed to load models',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async (modelName: string) => {
        setIsExporting(modelName);
        try {
            // Get model info and metadata
            const info = await getModelInfo(modelName);

            const metadata: Partial<ModelMetadata> = {
                version: '1.0.0',
                trainingMetadata: {
                    datasetSize: 1000, // Could track this in future
                    epochs: 100,
                    batchSize: 32,
                    trainedAt: new Date().toISOString(),
                },
            };

            const result = await exportModel(modelName, metadata);

            if (result.success && result.blob) {
                // Download file
                const url = URL.createObjectURL(result.blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${modelName}_${new Date().toISOString().split('T')[0]}.bizml`;
                a.click();
                URL.revokeObjectURL(url);

                toast({
                    title: 'Exported Successfully',
                    description: `${modelName} exported as .bizml file`,
                });
            } else {
                throw new Error(result.error || 'Export failed');
            }
        } catch (error: any) {
            toast({
                title: 'Export Failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsExporting(null);
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.bizml')) {
            toast({
                title: 'Invalid File',
                description: 'Please select a .bizml file',
                variant: 'destructive',
            });
            return;
        }

        setIsImporting(true);
        try {
            const result = await importModel(file);

            if (result.success && result.metadata) {
                toast({
                    title: 'Imported Successfully',
                    description: `Model "${result.metadata.modelName}" imported`,
                });
                loadModels(); // Refresh list
            } else {
                throw new Error(result.error || 'Import failed');
            }
        } catch (error: any) {
            toast({
                title: 'Import Failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsImporting(false);
            // Reset file input
            event.target.value = '';
        }
    };

    const handleDelete = async (modelName: string) => {
        if (!confirm(`Delete "${modelName}"? This cannot be undone.`)) {
            return;
        }

        try {
            const success = await deleteModel(modelName);
            if (success) {
                toast({
                    title: 'Deleted',
                    description: `${modelName} has been deleted`,
                });
                loadModels(); // Refresh list
            } else {
                throw new Error('Delete failed');
            }
        } catch (error: any) {
            toast({
                title: 'Delete Failed',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const getModelBadge = (modelName: string) => {
        if (modelName.includes('churn')) {
            return <Badge variant="secondary">Churn</Badge>;
        } else if (modelName.includes('revenue')) {
            return <Badge variant="default">Revenue</Badge>;
        } else {
            return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const isTrainedModel = (modelName: string) => {
        return modelName.includes('_trained');
    };

    const isAdvancedModel = (modelName: string) => {
        return modelName.includes('_advanced');
    };

    const getModelVersion = (modelName: string) => {
        const parts = modelName.split('_v');
        if (parts.length > 1) {
            return parts[parts.length - 1].replace(/_/g, '.');
        }
        return '1.0.0';
    };

    const getModelMetrics = (modelName: string) => {
        const baseName = modelName.split('_v')[0].replace('_trained', '');
        const version = getModelVersion(modelName);
        return metrics.find(m =>
            (m.model_name === baseName || m.model_name + '_trained' === baseName) &&
            m.version === version
        );
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Model Manager
                        </CardTitle>
                        <CardDescription>
                            Export, import, and manage your trained models
                        </CardDescription>
                    </div>
                    <div>
                        <input
                            type="file"
                            accept=".bizml"
                            onChange={handleImport}
                            className="hidden"
                            id="model-import"
                            disabled={isImporting}
                        />
                        <label htmlFor="model-import">
                            <Button variant="outline" disabled={isImporting} asChild>
                                <span>
                                    {isImporting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Import Model
                                        </>
                                    )}
                                </span>
                            </Button>
                        </label>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        <strong>Export:</strong> Save trained models to .bizml files for backup or sharing.
                        <br />
                        <strong>Import:</strong> Load previously exported models back into the browser.
                    </AlertDescription>
                </Alert>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Loading models...</span>
                    </div>
                ) : models.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground">No models found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Train a model first or import an existing one
                        </p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Model Name</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Performance</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {models.map((modelName) => {
                                    const modelMetrics = getModelMetrics(modelName);
                                    const version = getModelVersion(modelName);

                                    return (
                                        <TableRow key={modelName}>
                                            <TableCell className="font-medium">
                                                {modelName.split('_v')[0]}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">v{version}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {getModelBadge(modelName)}
                                            </TableCell>
                                            <TableCell>
                                                {modelMetrics ? (
                                                    <div className="text-xs">
                                                        {modelMetrics.accuracy !== undefined && (
                                                            <span className="text-green-600 font-medium">
                                                                Acc: {(modelMetrics.accuracy * 100).toFixed(1)}%
                                                            </span>
                                                        )}
                                                        {modelMetrics.r2 !== undefined && (
                                                            <span className="text-blue-600 font-medium">
                                                                R²: {(modelMetrics.r2 * 100).toFixed(1)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isTrainedModel(modelName) ? (
                                                    <div className="flex items-center gap-1 text-sm text-green-600">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Custom Trained
                                                    </div>
                                                ) : isAdvancedModel(modelName) ? (
                                                    <div className="flex items-center gap-1 text-sm text-purple-600">
                                                        <Brain className="h-3 w-3" />
                                                        Advanced DNN
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        Legacy Base
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleExport(modelName)}
                                                        disabled={isExporting === modelName}
                                                        title="Export Model"
                                                    >
                                                        {isExporting === modelName ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Download className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(modelName)}
                                                        title="Delete Model"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
