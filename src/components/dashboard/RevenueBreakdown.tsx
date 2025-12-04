import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DollarSign } from "lucide-react";

const revenueData = [
    { name: 'Products', value: 450000, color: 'hsl(var(--primary))' },
    { name: 'Services', value: 320000, color: 'hsl(var(--secondary))' },
    { name: 'Subscriptions', value: 280000, color: 'hsl(var(--accent))' },
    { name: 'Consulting', value: 150000, color: 'hsl(var(--success))' }
];

const total = revenueData.reduce((sum, item) => sum + item.value, 0);

export function RevenueBreakdown() {
    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-success" />
                    Revenue Breakdown
                </CardTitle>
                <CardDescription>Revenue distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={revenueData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {revenueData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => `$${value.toLocaleString()}`}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="space-y-2">
                        {revenueData.map((item) => {
                            const percentage = ((item.value / total) * 100).toFixed(1);
                            return (
                                <div key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                                        <span className="text-sm font-semibold">
                                            ${item.value.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Total Revenue</span>
                            <span className="text-lg font-bold text-success">
                                ${total.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
