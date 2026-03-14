import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, CheckCircle2, XCircle, Clock, Search, Workflow } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AgentDecision {
    id: string;
    user_query: string;
    tools_used: any[];
    ml_results: any;
    rag_context: any;
    agent_reasoning: string;
    final_decision: string;
    confidence_score: number;
    status: string;
    timestamp: string;
}

export default function DecisionHistory() {
    const { toast } = useToast();
    const [decisions, setDecisions] = useState<AgentDecision[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('agent_decision_memory')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(50);
            
            if (error) throw error;
            setDecisions(data || []);
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Failed to load decision history",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('agent_decision_memory')
                .update({ status: newStatus } as any)
                .eq('id', id);
            
            if (error) throw error;
            setDecisions(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
            
            toast({
                title: "Status Updated",
                description: `Action trigger has been ${newStatus}.`,
            });
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"><Clock className="w-3 h-3 mr-1" /> Pending Approval</Badge>;
            case 'approved': return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'rejected': return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            default: return <Badge variant="secondary"><CheckCircle2 className="w-3 h-3 mr-1 text-muted-foreground" /> Executed</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Decision History</h1>
                    <p className="text-muted-foreground mt-2">
                        Audit log of AI Agent actions, reasoning chains, and human-in-the-loop approvals.
                    </p>
                </div>
                <Button onClick={fetchHistory} variant="outline" size="sm">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                    Refresh
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : decisions.length === 0 ? (
                <Card className="border-dashed bg-muted/10">
                    <CardContent className="flex flex-col items-center justify-center p-16 text-muted-foreground">
                        <FileText className="h-12 w-12 mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">No decisions logged yet</h3>
                        <p className="text-sm">Run scenarios in the Agent Playground to populate this timeline.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {decisions.map((decision) => (
                        <Card key={decision.id} className="overflow-hidden shadow-sm transition-all hover:shadow-md">
                            <div className="flex flex-col md:flex-row">
                                <div className="p-6 md:w-1/3 bg-muted/5 border-r border-border/50">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(decision.timestamp).toLocaleString()}
                                        </div>
                                        {getStatusBadge(decision.status)}
                                    </div>
                                    <h4 className="font-medium text-sm mb-2 line-clamp-2" title={decision.user_query}>
                                        "{decision.user_query}"
                                    </h4>
                                    
                                    <div className="mt-4 pt-4 border-t border-border/50">
                                        <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">Tools Invoked</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {decision.tools_used?.length > 0 ? (
                                                decision.tools_used.map((t: any, i) => (
                                                    <Badge key={i} variant="outline" className="text-[10px] font-normal py-0">
                                                        {t.name}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">None (Zero-shot)</span>
                                            )}
                                        </div>
                                        <div className="mt-4 flex items-center gap-2">
                                            <div className="w-full bg-muted rounded-full h-1.5">
                                                <div 
                                                    className="bg-primary h-1.5 rounded-full" 
                                                    style={{ width: `${decision.confidence_score * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-semibold">
                                                {(decision.confidence_score * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>

                                    {decision.status === 'pending' && (
                                        <div className="mt-6 flex gap-2">
                                            <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(decision.id, 'approved')}>
                                                <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                                            </Button>
                                            <Button size="sm" variant="destructive" className="w-full" onClick={() => updateStatus(decision.id, 'rejected')}>
                                                <XCircle className="w-4 h-4 mr-1" /> Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 md:w-2/3 space-y-4">
                                    <div>
                                        <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                            <Workflow className="w-3 h-3" /> Agent Reasoning
                                        </div>
                                        <ScrollArea className="h-[80px] w-full bg-background rounded-md border p-3">
                                            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                                {decision.agent_reasoning || "Reasoning not provided"}
                                            </p>
                                        </ScrollArea>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-bold tracking-wider text-primary mb-1.5">Final Decision</div>
                                        <div className="p-3 bg-primary/5 border border-primary/10 rounded-md text-sm whitespace-pre-wrap">
                                            {decision.final_decision || "No final decision recorded"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
