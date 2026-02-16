// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, History, Trash2, Eye, Filter, TrendingUp, UserX, Download } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { PredictionDetailsModal } from './PredictionDetailsModal';

interface PredictionRecord {
    id: string;
    model_id: string;
    inputs: number[];
    prediction: number;
    confidence: number;
    feature_importance?: Record<string, number>;
    cache_hit: boolean;
    created_at: string;
}

export function PredictionHistory() {
    const { toast } = useToast();
    const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'churn' | 'revenue'>('all');
    const [selectedPrediction, setSelectedPrediction] = useState<PredictionRecord | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        loadPredictions();
    }, [filter]);

    const loadPredictions = async () => {
        setIsLoading(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) {
                setIsLoading(false);
                return;
            }

            let query = supabase
                .from('ml_predictions')
                .select('*')
                .eq('user_id', userData.user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            // Apply filter if not 'all'
            if (filter !== 'all') {
                const modelName = filter === 'churn' ? 'churn_model' : 'revenue_model';
                // We need to join with ml_models table or filter by model name
                // For now, we'll filter client-side after loading
            }

            const { data, error } = await query;

            if (error) throw error;

            setPredictions(data || []);
        } catch (error: any) {
            console.error('Error loading predictions:', error);
            toast({
                title: 'Error Loading History',
                description: error.message || 'Failed to load prediction history',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('ml_predictions')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Deleted',
                description: 'Prediction deleted from history',
            });

            // Reload predictions
            loadPredictions();
        } catch (error: any) {
            console.error('Error deleting prediction:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete prediction',
                variant: 'destructive',
            });
        }
    };

    const handleViewDetails = (prediction: PredictionRecord) => {
        setSelectedPrediction(prediction);
        setShowDetails(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatPrediction = (pred: PredictionRecord) => {
        // Determine model type from inputs length or model_id
        const isChurn = pred.inputs.length === 5 && pred.prediction <= 1;

        if (isChurn) {
            return pred.prediction > 0.5 ? 'Will Churn' : 'Will Stay';
        } else {
            return `$${(pred.prediction * 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        }
    };

    const getModelIcon = (pred: PredictionRecord) => {
        const isChurn = pred.inputs.length === 5 && pred.prediction <= 1;
        return isChurn ? UserX : TrendingUp;
    };

    const getModelBadge = (pred: PredictionRecord) => {
        const isChurn = pred.inputs.length === 5 && pred.prediction <= 1;
        return (
            <Badge variant={isChurn ? 'secondary' : 'default'} className="text-xs">
                {isChurn ? 'Churn' : 'Revenue'}
            </Badge>
        );
    };

    const handleExportCSV = () => {
        if (predictions.length === 0) {
            toast({
                title: 'No Data',
                description: 'No predictions to export',
                variant: 'destructive',
            });
            return;
        }

        // Create CSV content
        const headers = ['Date', 'Model', 'Prediction', 'Confidence', 'Inputs'];
        const rows = predictions.map(pred => {
            const isChurn = pred.inputs.length === 5 && pred.prediction <= 1;
            const modelType = isChurn ? 'Churn' : 'Revenue';
            const predictionValue = formatPrediction(pred);
            const confidence = (pred.confidence * 100).toFixed(1) + '%';
            const inputs = pred.inputs.join('; ');
            const date = formatDate(pred.created_at);

            return [date, modelType, predictionValue, confidence, inputs];
        });

        // Build CSV string
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prediction_history_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: 'Exported',
            description: `Exported ${predictions.length} predictions to CSV`,
        });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Prediction History
                            </CardTitle>
                            <CardDescription>View and manage your past predictions</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportCSV}
                                disabled={predictions.length === 0}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Models</SelectItem>
                                    <SelectItem value="churn">Churn Only</SelectItem>
                                    <SelectItem value="revenue">Revenue Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">Loading history...</span>
                        </div>
                    ) : predictions.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground">No predictions yet</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Make your first prediction to see it here
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Model</TableHead>
                                        <TableHead>Prediction</TableHead>
                                        <TableHead>Confidence</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {predictions.map((pred) => {
                                        const ModelIcon = getModelIcon(pred);
                                        return (
                                            <TableRow key={pred.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <ModelIcon className="h-4 w-4 text-muted-foreground" />
                                                        {getModelBadge(pred)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {formatPrediction(pred)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {(pred.confidence * 100).toFixed(1)}%
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(pred.created_at)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewDetails(pred)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(pred.id)}
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

            {selectedPrediction && (
                <PredictionDetailsModal
                    prediction={selectedPrediction}
                    open={showDetails}
                    onClose={() => setShowDetails(false)}
                />
            )}
        </>
    );
}
