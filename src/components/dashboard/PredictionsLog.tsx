// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PredictionsFilter } from './PredictionsFilter';
import { usePredictionsLog } from '@/hooks/usePredictionsLog';
import { Brain, TrendingUp, Target, Eye, Trash2, CheckCircle, XCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import React from 'react';

export const PredictionsLog = () => {
  const { 
    predictions, 
    isLoading,
    contractTypes,
    fetchPredictions,
    createPrediction, 
    updatePredictionOutcome, 
    deletePrediction, 
    getPredictionStats 
  } = usePredictionsLog();
  
  // Filter states
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [contractType, setContractType] = useState<string | undefined>();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPrediction, setNewPrediction] = useState({
    customer_id: '',
    predicted_probability: 0.5,
    predicted_label: false,
    model_version: '',
    confidence_score: 0.8,
    input_features: '{}'
  });

  // Apply filters when they change
  const applyFilters = () => {
    fetchPredictions({ startDate, endDate, contractType });
  };

  // Clear all filters
  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setContractType(undefined);
    fetchPredictions();
  };

  // Auto-apply filters when they change
  React.useEffect(() => {
    applyFilters();
  }, [startDate, endDate, contractType]);

  const stats = getPredictionStats();

  const handleCreatePrediction = async () => {
    try {
      const inputFeatures = JSON.parse(newPrediction.input_features);
      await createPrediction({
        ...newPrediction,
        input_features: inputFeatures
      });
      setIsCreateDialogOpen(false);
      setNewPrediction({
        customer_id: '',
        predicted_probability: 0.5,
        predicted_label: false,
        model_version: '',
        confidence_score: 0.8,
        input_features: '{}'
      });
    } catch (error) {
      toast.error('Invalid JSON in input features');
    }
  };

  const handleOutcomeUpdate = async (predictionId: string, outcome: boolean) => {
    await updatePredictionOutcome(predictionId, outcome);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <PredictionsFilter
        startDate={startDate}
        endDate={endDate}
        contractType={contractType}
        contractTypes={contractTypes}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onContractTypeChange={setContractType}
        onClearFilters={clearFilters}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Predictions</p>
                <p className="text-2xl font-bold">{stats.totalPredictions}</p>
              </div>
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Predicted Churn</p>
                <p className="text-2xl font-bold text-red-500">{stats.churnPredictions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold text-green-500">{stats.accuracy}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">{stats.avgConfidence}</p>
              </div>
              <Eye className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Predictions Log</CardTitle>
              <CardDescription>
                History of all churn predictions and their outcomes
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Prediction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Prediction</DialogTitle>
                  <DialogDescription>
                    Manually log a new churn prediction
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customer_id">Customer ID</Label>
                    <Input
                      id="customer_id"
                      value={newPrediction.customer_id}
                      onChange={(e) => setNewPrediction({...newPrediction, customer_id: e.target.value})}
                      placeholder="Enter customer ID"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="probability">Predicted Probability</Label>
                    <Input
                      id="probability"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={newPrediction.predicted_probability}
                      onChange={(e) => setNewPrediction({...newPrediction, predicted_probability: parseFloat(e.target.value)})}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="predicted_label"
                      checked={newPrediction.predicted_label}
                      onCheckedChange={(checked) => setNewPrediction({...newPrediction, predicted_label: checked})}
                    />
                    <Label htmlFor="predicted_label">
                      Will Churn: {newPrediction.predicted_label ? 'Yes' : 'No'}
                    </Label>
                  </div>

                  <div>
                    <Label htmlFor="model_version">Model Version</Label>
                    <Input
                      id="model_version"
                      value={newPrediction.model_version}
                      onChange={(e) => setNewPrediction({...newPrediction, model_version: e.target.value})}
                      placeholder="e.g., v1.0.0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confidence">Confidence Score</Label>
                    <Input
                      id="confidence"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={newPrediction.confidence_score}
                      onChange={(e) => setNewPrediction({...newPrediction, confidence_score: parseFloat(e.target.value)})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="input_features">Input Features (JSON)</Label>
                    <Textarea
                      id="input_features"
                      value={newPrediction.input_features}
                      onChange={(e) => setNewPrediction({...newPrediction, input_features: e.target.value})}
                      placeholder='{"tenure": 12, "monthly_charges": 65.50}'
                      rows={3}
                    />
                  </div>

                  <Button onClick={handleCreatePrediction} className="w-full">
                    Create Prediction
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading predictions...</div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No predictions found. Upload churn data and start making predictions!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Prediction</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Model Version</TableHead>
                  <TableHead>Actual Outcome</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictions.map((prediction) => (
                  <TableRow key={prediction.id}>
                    <TableCell>{prediction.customer_id || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={prediction.predicted_label ? 'destructive' : 'default'}>
                        {prediction.predicted_label ? 'Will Churn' : 'Will Retain'}
                      </Badge>
                    </TableCell>
                    <TableCell>{(prediction.predicted_probability * 100).toFixed(1)}%</TableCell>
                    <TableCell>{((prediction.confidence_score || 0) * 100).toFixed(1)}%</TableCell>
                    <TableCell>{prediction.model_version || 'N/A'}</TableCell>
                    <TableCell>
                      {prediction.actual_outcome === null || prediction.actual_outcome === undefined ? (
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleOutcomeUpdate(prediction.id!, true)}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleOutcomeUpdate(prediction.id!, false)}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Badge variant={prediction.actual_outcome ? 'destructive' : 'default'}>
                          {prediction.actual_outcome ? 'Churned' : 'Retained'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(prediction.created_at!), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deletePrediction(prediction.id!)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};