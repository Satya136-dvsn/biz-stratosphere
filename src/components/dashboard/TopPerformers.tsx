// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Crown } from "lucide-react";
import { useTopPerformers } from "@/hooks/useTopPerformers";

export function TopPerformers() {
    const { data: topPerformers = [], isLoading } = useTopPerformers();

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
                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                        ))}
                    </div>
                ) : topPerformers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Crown className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No data available</p>
                        <p className="text-xs mt-1">Upload data to see top performers</p>
                    </div>
                ) : (
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
                            {topPerformers.map((item) => (
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
                                                {item.growth.toFixed(1)}%
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
