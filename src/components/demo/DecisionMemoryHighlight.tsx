import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { DEMO_DECISIONS } from '@/data/demoDataset';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Dashboard widget that highlights the Decision Memory™ feature.
 * Shows recent AI decisions with outcomes — draws attention to the unique feature.
 */
export function DecisionMemoryHighlight() {
    // Show the top 3 most recent decisions
    const decisions = DEMO_DECISIONS.slice(0, 3);

    return (
        <Card className="border-2 border-primary/20 relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />

            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        Decision Memory™
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] border-primary/40 text-primary font-semibold">
                        EXCLUSIVE
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                    Track what AI predicted, what your team did, and what actually happened.
                </p>
            </CardHeader>

            <CardContent className="space-y-3">
                {decisions.map((d) => {
                    const isPositive = d.outcome.includes('retained')
                        || d.outcome.includes('Upgraded')
                        || d.outcome.includes('fixed')
                        || d.outcome.includes('above');

                    return (
                        <div
                            key={d.id}
                            className="p-3 bg-muted/30 rounded-lg space-y-1.5 text-sm hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-foreground text-xs">{d.model}</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[9px] px-1.5">{d.confidence}%</Badge>
                                    {isPositive ? (
                                        <CheckCircle className="h-3.5 w-3.5 text-success" />
                                    ) : (
                                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                <span className="text-primary font-medium">Predicted:</span> {d.prediction}
                            </p>
                            <p className={cn(
                                'text-xs font-medium',
                                isPositive ? 'text-success' : 'text-destructive'
                            )}>
                                {d.outcome}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="h-2.5 w-2.5" />
                                {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                        </div>
                    );
                })}

                <Link to="/decision-audit">
                    <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary/80 text-xs mt-1">
                        View All Decisions
                        <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
