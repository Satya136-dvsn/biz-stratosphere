// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState } from 'react';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PredictionResult {
  id: string;
  predicted_label: string;
  predicted_probability: number;
  confidence_score: number;
  risk_level: string;
  factors: string[];
  recommendations: string[];
}

interface PredictionFormProps {
  onPredictionComplete?: () => void;
}

export const PredictionForm: React.FC<PredictionFormProps> = ({ onPredictionComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    customer_id: '',
    tenure: '',
    monthly_charges: '',
    contract_type: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to make predictions');
      return;
    }

    if (!formData.tenure || !formData.monthly_charges || !formData.contract_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-prediction', {
        body: {
          customer_id: formData.customer_id || null,
          tenure: parseInt(formData.tenure),
          monthly_charges: parseFloat(formData.monthly_charges),
          contract_type: formData.contract_type
        }
      });

      if (error) throw error;

      setResult(data.result);
      toast.success(data.message);
      
      // Reset form
      setFormData({
        customer_id: '',
        tenure: '',
        monthly_charges: '',
        contract_type: ''
      });

      // Notify parent to refresh predictions list
      onPredictionComplete?.();

    } catch (error) {
      console.error('Error making prediction:', error);
      toast.error(error.message || 'Failed to generate prediction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Customer Churn Prediction
          </CardTitle>
          <CardDescription>
            Enter customer details to predict churn probability using AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_id">Customer ID (Optional)</Label>
                <Input
                  id="customer_id"
                  placeholder="e.g., CUST_001"
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract_type">Contract Type *</Label>
                <Select 
                  value={formData.contract_type} 
                  onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contract type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Month-to-month">Month-to-month</SelectItem>
                    <SelectItem value="One year">One year</SelectItem>
                    <SelectItem value="Two year">Two year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenure">Tenure (months) *</Label>
                <Input
                  id="tenure"
                  type="number"
                  placeholder="e.g., 12"
                  min="0"
                  max="120"
                  value={formData.tenure}
                  onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_charges">Monthly Charges ($) *</Label>
                <Input
                  id="monthly_charges"
                  type="number"
                  placeholder="e.g., 79.99"
                  min="0"
                  step="0.01"
                  value={formData.monthly_charges}
                  onChange={(e) => setFormData({ ...formData, monthly_charges: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Prediction...
                </>
              ) : (
                'Generate Prediction'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.risk_level === 'High' && <AlertTriangle className="w-5 h-5 text-destructive" />}
              {result.risk_level === 'Medium' && <AlertTriangle className="w-5 h-5 text-warning" />}
              {result.risk_level === 'Low' && <TrendingUp className="w-5 h-5 text-success" />}
              Prediction Result: {result.predicted_label}
            </CardTitle>
            <CardDescription>
              Risk Level: {result.risk_level} | Confidence: {Math.round(result.confidence_score * 100)}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Churn Probability</h4>
                <div className="text-2xl font-bold text-primary">
                  {Math.round(result.predicted_probability * 100)}%
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Risk Factors</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {result.factors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {result.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Recommendations</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-success">✓</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};