import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Brain, Sparkles, Send, Loader2, Database, BarChart3, Workflow, ChevronRight } from 'lucide-react';
import { apiClients } from '@/lib/api/clients';

interface ToolUsage {
    name: string;
    args: any;
}

interface AgentResponse {
    success: boolean;
    query: string;
    tools_used: ToolUsage[];
    agent_reasoning: string;
    final_decision: string;
    confidence_score: number;
    status: string;
}

export default function AgentPlayground() {
    const { toast } = useToast();
    const [query, setQuery] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [result, setResult] = useState<AgentResponse | null>(null);

    const handleSubmit = async () => {
        if (!query.trim() || isThinking) return;

        setIsThinking(true);
        setResult(null);

        try {
            const res = await apiClients.llm.post('/agent/query', { query });
            setResult(res.data);
            toast({
                title: "Agent Execution Complete",
                description: `Decision reached with ${(res.data.confidence_score * 100).toFixed(1)}% confidence.`,
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Agent Execution Failed",
                description: error.response?.data?.detail || error.message,
                variant: "destructive"
            });
        } finally {
            setIsThinking(false);
        }
    };

    const getToolIcon = (name: string) => {
        switch (name) {
            case 'ml_predict': return <Brain className="h-4 w-4" />;
            case 'rag_retrieve': return <Database className="h-4 w-4" />;
            case 'analytics_insight': return <BarChart3 className="h-4 w-4" />;
            case 'action_trigger': return <Workflow className="h-4 w-4" />;
            default: return <Sparkles className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Agent Playground</h1>
                <p className="text-muted-foreground mt-2">
                    Submit multi-step business queries and watch the ReAct AI Agent plan, 
                    call tools, reason, and make a decision.
                </p>
            </div>

            <Card className="border-primary/20 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <Badge variant="outline" className="bg-primary/5 text-primary">Experimental Agent Engine</Badge>
                </div>
                <CardHeader>
                    <CardTitle>Decision Query</CardTitle>
                    <CardDescription>Enter a complex business scenario.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g., Should we offer a discount to John Doe given his usage decline?"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            disabled={isThinking}
                        />
                        <Button onClick={handleSubmit} disabled={!query.trim() || isThinking}>
                            {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span className="ml-2 hidden sm:inline">{isThinking ? 'Analyzing...' : 'Execute'}</span>
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 text-xs">
                        <span className="text-muted-foreground font-medium flex items-center mt-1">Example Scenarios:</span>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-muted" onClick={() => setQuery("What is our predicted churn for next month, and what should we do about it?")}>Churn Prediction</Badge>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-muted" onClick={() => setQuery("Summarize our corporate onboarding policies and draft a welcome email.")}>Policy & Email</Badge>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-muted" onClick={() => setQuery("Analyze our Q3 user growth and determine if we should launch the paid tier early.")}>Analytics Review</Badge>
                    </div>
                </CardContent>
            </Card>

            {isThinking && (
                <Card className="border-dashed bg-muted/20 animate-pulse">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                        <Brain className="h-10 w-10 mb-4 animate-bounce text-primary/50" />
                        <h3 className="text-lg font-medium">Agent is thinking...</h3>
                        <p className="text-sm mt-2">Interpreting query, routing to tools, and formulating a decision.</p>
                    </CardContent>
                </Card>
            )}

            {result && !isThinking && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Execution Pathway */}
                    <Card className="lg:col-span-1 shadow-sm">
                        <CardHeader className="bg-muted/5 pb-4 border-b">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Workflow className="h-5 w-5 text-primary" />
                                Execution Pathway
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[400px]">
                                <div className="p-6 space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary z-10">
                                                <span>1</span>
                                            </div>
                                            <div className="w-0.5 h-full bg-border mt-2 -mb-6" />
                                        </div>
                                        <div className="pt-1 w-full">
                                            <h4 className="font-semibold text-sm">Query Interpreted</h4>
                                            <p className="text-xs text-muted-foreground mt-1 break-words">{result.query}</p>
                                        </div>
                                    </div>

                                    {result.tools_used.length === 0 ? (
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="h-4 w-4 mt-2 rounded-full bg-muted border-2 border-background z-10" />
                                                <div className="w-0.5 h-full bg-border -mt-2 -mb-6" />
                                            </div>
                                            <div className="pt-1.5 pb-4 text-xs text-muted-foreground italic">
                                                Zero-shot answer (No tools called)
                                            </div>
                                        </div>
                                    ) : (
                                        result.tools_used.map((tool, idx) => (
                                            <div key={idx} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 z-10 shadow-sm relative overflow-hidden">
                                                        {getToolIcon(tool.name)}
                                                    </div>
                                                    <div className="w-0.5 h-full bg-border mt-2 -mb-6" />
                                                </div>
                                                <div className="pt-1 w-full">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                                                            {tool.name}
                                                        </h4>
                                                    </div>
                                                    <div className="mt-2 bg-muted/30 rounded-md p-2 text-[11px] font-mono text-muted-foreground overflow-x-auto border border-border/50">
                                                        {JSON.stringify(tool.args, null, 2)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 z-10">
                                                <ChevronRight className="h-5 w-5" />
                                            </div>
                                        </div>
                                        <div className="pt-1 w-full">
                                            <h4 className="font-semibold text-sm">Formulating Decision</h4>
                                            <p className="text-xs text-muted-foreground mt-1">Internal reasoning synthesized.</p>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Reasoning & Final Decision */}
                    <Card className="lg:col-span-2 shadow-sm border-primary/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-primary/5 border-b border-border/50">
                            <div>
                                <CardTitle className="text-lg">Agent Outcome</CardTitle>
                                <CardDescription>Final synthesized ReAct decision.</CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Confidence</span>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary transition-all duration-1000 ease-out"
                                            style={{ width: `${result.confidence_score * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold">{(result.confidence_score * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground mb-3">
                                    <Brain className="h-4 w-4" />
                                    Internal Reasoning
                                </h3>
                                <div className="p-4 rounded-xl bg-muted/50 border shadow-inner whitespace-pre-wrap text-sm">
                                    {result.agent_reasoning}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold flex items-center gap-2 text-primary mb-3">
                                    <Sparkles className="h-4 w-4" />
                                    Final Recommendation / Action
                                </h3>
                                <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 shadow-sm whitespace-pre-wrap text-[15px] leading-relaxed relative">
                                    {result.status === 'pending' && (
                                        <Badge className="absolute top-4 right-4 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 shadow-none">
                                            Requires Approval
                                        </Badge>
                                    )}
                                    {result.final_decision}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
