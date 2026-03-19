import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { DollarSign, TrendingUp, ChevronRight } from "lucide-react";
import { useRevenueBreakdown } from "@/hooks/useRevenueBreakdown";
import { GlassTooltip } from "@/components/ui/GlassTooltip";
import { formatCurrency } from "@/lib/utils";

export function RevenueBreakdown() {
    const { data: breakdown = [], isLoading } = useRevenueBreakdown();

    const COLORS = [
        'hsl(221, 83%, 53%)',
        'hsl(262, 83%, 58%)',
        'hsl(142, 71%, 45%)',
        'hsl(38, 92%, 50%)',
    ];

    return (
        <Card className="bg-[hsl(220_18%_7%)]/40 border-[hsl(220_16%_12%)] backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden group/card h-full">
            <CardHeader className="pb-0">
                <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors group-hover/card:text-primary/70 flex items-center justify-between">
                    <span>Revenue Breakdown</span>
                    <DollarSign className="h-4 w-4 text-primary/40" />
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/40">Distribution by sector</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                {isLoading ? (
                    <div className="space-y-6">
                        <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    </div>
                ) : breakdown.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                            <DollarSign className="h-8 w-8 text-primary/40" />
                        </div>
                        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">No Intelligence Data</p>
                        <p className="text-[10px] text-muted-foreground/40 mt-2">Upload datasets to generate breakdown</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Pie Chart */}
                        <div className="h-56 relative group/pie">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={breakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                        animationDuration={1500}
                                    >
                                        {breakdown.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={COLORS[index % COLORS.length]} 
                                                stroke="none"
                                                className="hover:opacity-80 transition-opacity"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<GlassTooltip formatter={(v) => formatCurrency(v as number)} />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Total</p>
                                <p className="text-lg font-black">{formatCurrency(breakdown.reduce((a, b) => a + b.value, 0))}</p>
                            </div>
                        </div>

                        {/* Breakdown List */}
                        <div className="space-y-2">
                            {breakdown.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group/item"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide group-hover/item:text-primary transition-colors">{item.name}</p>
                                            <p className="text-[10px] font-mono text-muted-foreground/60">
                                                {formatCurrency(item.value)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black font-mono">
                                                {item.percentage.toFixed(1)}%
                                            </span>
                                            <ChevronRight className="h-3 w-3 text-muted-foreground/20 group-hover/item:text-primary transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
