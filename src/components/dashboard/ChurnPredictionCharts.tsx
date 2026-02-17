// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ChurnPredictionViewData } from '@/hooks/useChurnPredictionsView';
import { ChartGradientDefs } from '@/components/ui/ChartGradientDefs';
import { GlassTooltip } from '@/components/ui/GlassTooltip';

interface ChurnPredictionChartsProps {
  data: ChurnPredictionViewData[];
}

export const ChurnPredictionCharts = ({ data }: ChurnPredictionChartsProps) => {
  // Prepare data for churn comparison chart
  const churnComparisonData = [
    {
      category: 'Predicted Churn',
      count: data.filter(p => p.predicted_churn === 'Churn').length,
    },
    {
      category: 'Predicted Retain',
      count: data.filter(p => p.predicted_churn === 'Retain').length,
    },
    {
      category: 'Actual Churn',
      count: data.filter(p => p.actual_churn === 'Churn').length,
    },
    {
      category: 'Actual Retain',
      count: data.filter(p => p.actual_churn === 'Retain').length,
    },
  ];

  // Prepare data for contract type breakdown
  const contractData = Array.from(
    data.reduce((acc, item) => {
      const key = item.contract_type;
      const existing = acc.get(key) || {
        contract_type: key,
        predicted_churn: 0,
        predicted_retain: 0,
        total: 0
      };

      if (item.predicted_churn === 'Churn') {
        existing.predicted_churn++;
      } else {
        existing.predicted_retain++;
      }
      existing.total++;

      acc.set(key, existing);
      return acc;
    }, new Map())
  ).map(([_, value]) => value);

  // Prepare data for probability trend (grouping by date)
  const probabilityTrendData = data
    .sort((a, b) => new Date(a.prediction_time).getTime() - new Date(b.prediction_time).getTime())
    .reduce((acc: any[], item) => {
      const date = new Date(item.prediction_time).toLocaleDateString();
      const existing = acc.find(d => d.date === date);

      if (existing) {
        existing.probabilities.push(item.predicted_probability);
        existing.avg_probability = existing.probabilities.reduce((sum: number, p: number) => sum + p, 0) / existing.probabilities.length;
      } else {
        acc.push({
          date,
          probabilities: [item.predicted_probability],
          avg_probability: item.predicted_probability,
        });
      }

      return acc;
    }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Churn vs Predicted Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Prediction vs Reality</CardTitle>
          <CardDescription>Comparison of predicted and actual churn</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={churnComparisonData}>
              <ChartGradientDefs />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.2)' }} content={<GlassTooltip indicator="line" />} />
              <Bar dataKey="count" fill="url(#colorCustomers)" radius={[4, 4, 0, 0]} maxBarSize={50} animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Contract Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Churn by Contract Type</CardTitle>
          <CardDescription>Prediction breakdown by contract type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contractData}>
              <ChartGradientDefs />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
              <XAxis dataKey="contract_type" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.2)' }} content={<GlassTooltip indicator="line" />} />
              <Bar dataKey="predicted_churn" fill="url(#colorDestructive)" name="Predicted Churn" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1500} />
              <Bar dataKey="predicted_retain" fill="url(#colorSuccess)" name="Predicted Retain" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Probability Trend Over Time */}
      {probabilityTrendData.length > 1 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Average Churn Probability Trend</CardTitle>
            <CardDescription>Daily average churn probability over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={probabilityTrendData}>
                <ChartGradientDefs />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<GlassTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Line
                  type="monotone"
                  dataKey="avg_probability"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};