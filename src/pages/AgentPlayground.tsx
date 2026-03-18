import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Brain, Sparkles, Send, Loader2, Database, BarChart3, Workflow, ChevronRight, History, Trash2 } from 'lucide-react';
const API_BASE_URL = 'http://localhost:8000';

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

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    result?: AgentResponse;
}

export default function AgentPlayground() {
    const { toast } = useToast();
    const [query, setQuery] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessionId, setSessionId] = useState<string>('');

    // Initialize session ID on load
    useEffect(() => {
        const existingSessionId = sessionStorage.getItem('agent_session_id');
        if (existingSessionId) {
            setSessionId(existingSessionId);
        } else {
            const newSessionId = crypto.randomUUID();
            setSessionId(newSessionId);
            sessionStorage.setItem('agent_session_id', newSessionId);
        }
    }, []);

    const handleResetSession = () => {
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);
        sessionStorage.setItem('agent_session_id', newSessionId);
        setMessages([]);
        setQuery('');
        toast({
            title: "Session Reset",
            description: "New agent session started. History cleared.",
        });
    };

    const handleSubmit = async () => {
        if (!query.trim() || isThinking) return;

        const userQuery = query;
        setQuery('');
        setIsThinking(true);
        
        // Optimistically add user message
        const newUserMessage: ChatMessage = { role: 'user', content: userQuery };
        setMessages(prev => [...prev, newUserMessage]);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/llm/agent/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query: userQuery,
                    session_id: sessionId 
                }),
            });
            
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Error ${response.status}`);
            }

            const data = await response.json();
            
            // Add assistant response
            const assistantMessage: ChatMessage = { 
                role: 'assistant', 
                content: data.final_decision,
                result: data
            };
            setMessages(prev => [...prev, assistantMessage]);

            toast({
                title: "Agent Execution Complete",
                description: `Decision reached with ${(data.confidence_score * 100).toFixed(1)}% confidence.`,
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Agent Execution Failed",
                description: error.message,
                variant: "destructive"
            });
            // Remove the optimistic user message on failure if you want, 
            // or just leave it and show the error.
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
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI Agent Playground</h1>
                    <p className="text-muted-foreground mt-2">
                        Submit multi-step business queries and watch the ReAct AI Agent plan, 
                        call tools, and maintain session context.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {sessionId && (
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 flex items-center gap-2">
                            <History className="h-3 w-3" />
                            Session: {sessionId.substring(0, 8)}
                        </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={handleResetSession} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Reset Session
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Chat History */}
                <ScrollArea className="h-full min-h-[400px] rounded-xl border bg-muted/5 p-4">
                    <div className="space-y-8 max-w-5xl mx-auto">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-80">
                                <div className="p-4 bg-primary/5 rounded-full ring-1 ring-primary/10">
                                    <Brain className="h-8 w-8 text-primary/60" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-lg">New Agent Session</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Ask a complex question to begin the decision-making process.
                                    </p>
                                </div>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                    : 'bg-card border border-border/60 rounded-tl-none'
                                }`}>
                                    <div className="flex items-center gap-2 mb-2 opacity-80">
                                        {msg.role === 'user' ? (
                                            <span className="text-[10px] font-bold uppercase tracking-wider">You</span>
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                <Sparkles className="h-3 w-3 text-primary" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">AI Agent</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </div>
                                </div>

                                {/* Agent Result Breakdown for Assistant Messages */}
                                {msg.role === 'assistant' && msg.result && (
                                    <div className="mt-4 w-full grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-500">
                                        {/* Execution Pathway */}
                                        <Card className="lg:col-span-1 shadow-sm bg-background/50 border-muted/50">
                                            <CardHeader className="py-3 border-b bg-muted/10">
                                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                                    <Workflow className="h-4 w-4 text-primary" />
                                                    Execution Pathway
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <ScrollArea className="h-[300px]">
                                                    <div className="p-4 space-y-4">
                                                        {msg.result.tools_used.length === 0 ? (
                                                            <div className="flex gap-3">
                                                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">0</div>
                                                                <p className="text-xs text-muted-foreground italic pt-1">Zero-shot answer</p>
                                                            </div>
                                                        ) : (
                                                            msg.result.tools_used.map((tool, tIdx) => (
                                                                <div key={tIdx} className="flex gap-3">
                                                                    <div className="h-6 w-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
                                                                        {getToolIcon(tool.name)}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-semibold text-xs">{tool.name}</h4>
                                                                        <div className="mt-1 bg-muted/40 rounded p-1.5 text-[10px] font-mono text-muted-foreground overflow-x-auto border border-border/30">
                                                                            {JSON.stringify(tool.args, null, 2)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                            </CardContent>
                                        </Card>

                                        {/* Reasoning & Confidence */}
                                        <Card className="lg:col-span-2 shadow-sm border-primary/10 bg-background/50">
                                            <CardHeader className="py-3 border-b bg-primary/5 flex flex-row items-center justify-between">
                                                <CardTitle className="text-sm font-medium">Internal Logic</CardTitle>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Confidence</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-primary transition-all duration-1000"
                                                                style={{ width: `${msg.result.confidence_score * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold">{(msg.result.confidence_score * 100).toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 space-y-4">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5 font-medium">
                                                        <Brain className="h-3 w-3" />
                                                        Agent Reasoning
                                                    </p>
                                                    <div className="p-3 rounded-lg bg-muted/30 border text-xs text-foreground/80 leading-relaxed italic">
                                                        {msg.result.agent_reasoning}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        ))}

                        {isThinking && (
                            <div className="flex flex-col items-start animate-in fade-in duration-300">
                                <div className="bg-card border border-border/60 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-sm font-medium text-muted-foreground">Agent is processing and calling tools...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Input Fixed at Bottom */}
            <div className="fixed bottom-6 left-0 right-0 px-6 z-20">
                <div className="max-w-5xl mx-auto">
                    <Card className="border-primary/20 shadow-2xl bg-background/90 backdrop-blur-md">
                        <CardContent className="p-3">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ask the Agent a follow-up or a new business query..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                    disabled={isThinking}
                                    className="bg-background/50 border-none shadow-none focus-visible:ring-0 text-base"
                                />
                                <Button 
                                    onClick={handleSubmit} 
                                    disabled={!query.trim() || isThinking}
                                    className="rounded-full h-10 w-10 p-0 shadow-lg shadow-primary/20"
                                >
                                    {isThinking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-center gap-4 mt-2 px-2">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3" />
                            Multi-turn enabled
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest flex items-center gap-1.5">
                            <Database className="h-3 w-3" />
                            RAG Knowledge Active
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
