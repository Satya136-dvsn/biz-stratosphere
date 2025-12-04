import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Crown } from "lucide-react";

interface TopPerformer {
    id: string;
    name: string;
    category: string;
    revenue: number;
    growth: number;
    rank: number;
}

const mockTopPerformers: TopPerformer[] = [
    { id: '1', name: 'Enterprise Package', category: 'Product', revenue: 125000, growth: 15.5, rank: 1 },
    { id: '2', name: 'Premium Subscription', category: 'Service', revenue: 98000, growth: 12.3, rank: 2 },
    { id: '3', name: 'Consulting Services', category: 'Service', revenue: 87500, growth: 18.7, rank: 3 },
    { id: '4', name: 'Analytics Suite', category: 'Product', revenue: 76200, growth: 10.2, rank: 4 },
    { id: '5', name: 'API Access', category: 'Product', revenue: 65800, growth: 22.1, rank: 5 }
];

export function TopPerformers() {
    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-warning" />
                    Top Performers
                </CardTitle>
                <CardDescription>Best performing products and services</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">Rank</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                            <TableHead className="text-right">Growth</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockTopPerformers.map((item) => (
                            <TableRow key={item.id} className="hover:bg-muted/50">
                                <TableCell>
                                    <div className="flex items-center justify-center">
                                        {item.rank === 1 && <Crown className="h-4 w-4 text-warning" />}
                                        {item.rank !== 1 && (
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {item.rank}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                        {item.category}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                    ${item.revenue.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1 text-success">
                                        <TrendingUp className="h-3 w-3" />
                                        <span className="text-sm font-medium">
                                            {item.growth}%
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
