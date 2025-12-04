import { Loader2 } from "lucide-react";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, BarChart3, TrendingUp, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useChurnPredictionsView } from '@/hooks/useChurnPredictionsView';
import { ChurnPredictionCharts } from './ChurnPredictionCharts';
import React from 'react';

export const ChurnPredictionsView = () => {
  const { data, isLoading, contractTypes, fetchData } = useChurnPredictionsView();
  
  // Filter states
  const [contractType, setContractType] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Apply filters when they change
  React.useEffect(() => {
    fetchData({ contractType, startDate, endDate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractType, startDate, endDate]); // fetchData is stable via useCallback

  const clearFilters = () => {
    setContractType('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const hasActiveFilters = contractType !== 'all' || startDate || endDate;

  // Calculate stats
  const totalPredictions = data.length;
  const churnPredictions = data.filter(p => p.predicted_churn === 'Churn').length;
  const actualChurn = data.filter(p => p.actual_churn === 'Churn').length;
  const avgProbability = data.length > 0 
    ? (data.reduce((sum, p) => sum + p.predicted_probability, 0) / data.length * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter predictions by contract type and date range
            </CardDescription>
          </div>
          {isLoading && (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            {/* Contract Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Contract Type</label>
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contracts</SelectItem>
                  {contractTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-48 justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-48 justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Predictions</p>
                <p className="text-2xl font-bold">{totalPredictions}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Predicted Churn</p>
                <p className="text-2xl font-bold text-destructive">{churnPredictions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actual Churn</p>
                <p className="text-2xl font-bold text-destructive">{actualChurn}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Probability</p>
                <p className="text-2xl font-bold">{avgProbability}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <ChurnPredictionCharts data={data} />

      {/* Predictions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Churn Predictions Data</CardTitle>
          <CardDescription>
            Detailed view of all churn predictions with actual outcomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
  <div className="text-center py-8 text-muted-foreground">
    No predictions found for the selected filters.
  </div>
) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Tenure</TableHead>
                  <TableHead>Monthly Charges</TableHead>
                  <TableHead>Contract Type</TableHead>
                  <TableHead>Predicted</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Prediction Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((prediction, index) => (
                  <TableRow key={`${prediction.customer_id}-${index}`}>
                    <TableCell>{prediction.customer_id}</TableCell>
                    <TableCell>{prediction.tenure} months</TableCell>
                    <TableCell>${prediction.monthly_charges}</TableCell>
                    <TableCell>{prediction.contract_type}</TableCell>
                    <TableCell>
                      <Badge variant={prediction.predicted_churn === 'Churn' ? 'destructive' : 'default'}>
                        {prediction.predicted_churn}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={prediction.actual_churn === 'Churn' ? 'destructive' : 'default'}>
                        {prediction.actual_churn}
                      </Badge>
                    </TableCell>
                    <TableCell>{(prediction.predicted_probability * 100).toFixed(1)}%</TableCell>
                    <TableCell>
                      {format(new Date(prediction.prediction_time), 'MMM dd, yyyy HH:mm')}
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