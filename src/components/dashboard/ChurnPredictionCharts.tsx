import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ChurnPredictionViewData } from '@/hooks/useChurnPredictionsView';

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

  const COLORS = ['hsl(var(--destructive))', 'hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

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
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
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
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="contract_type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="predicted_churn" fill="hsl(var(--destructive))" name="Predicted Churn" />
              <Bar dataKey="predicted_retain" fill="hsl(var(--primary))" name="Predicted Retain" />
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <Tooltip formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Avg Probability']} />
                <Line 
                  type="monotone" 
                  dataKey="avg_probability" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};