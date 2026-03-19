import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
    Brain, 
    Sparkles, 
    Send, 
    Loader2, 
    Database, 
    BarChart3, 
    Workflow, 
    ChevronRight, 
    History, 
    Trash2,
    Activity,
    Cpu,
    Network,
    Terminal,
    BrainCircuit,
    Layers,
    Bot
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

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
    const { session } = useAuth();
    const [query, setQuery] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessionId, setSessionId] = useState<string>('');
    const scrollAreaRef = useRef<HTMLDivElement>(null);

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

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [messages, isThinking]);

    const handleResetSession = () => {
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);
        sessionStorage.setItem('agent_session_id', newSessionId);
        setMessages([]);
        setQuery('');
        toast({
            title: "NEURAL_RESET_ACKNOWLEDGED",
            description: "Agent session memory purged. New context initialized.",
        });
    };

    const handleSubmit = async () => {
        if (!query.trim() || isThinking) return;

        const userQuery = query;
        setQuery('');
        setIsThinking(true);
        
        const newUserMessage: ChatMessage = { role: 'user', content: userQuery };
        setMessages(prev => [...prev, newUserMessage]);

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/v1/llm/agent/query`, {
                method: 'POST',
                headers,
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
            
            const assistantMessage: ChatMessage = { 
                role: 'assistant', 
                content: data.final_decision,
                result: data
            };
            setMessages(prev => [...prev, assistantMessage]);

            toast({
                title: "PROCESS_COMPLETE",
                description: `Execution successful. Confidence: ${(data.confidence_score * 100).toFixed(0)}%`,
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "EXECUTION_ERROR",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsThinking(false);
        }
    };

    const getToolIcon = (name: string) => {
        switch (name) {
            case 'ml_predict': return <Cpu className="h-3.5 w-3.5" />;
            case 'rag_retrieve': return <Network className="h-3.5 w-3.5" />;
            case 'analytics_insight': return <BarChart3 className="h-3.5 w-3.5" />;
            case 'action_trigger': return <Workflow className="h-3.5 w-3.5" />;
            default: return <Terminal className="h-3.5 w-3.5" />;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-6xl mx-auto animate-in fade-in duration-700">
            {/* --- Header Area --- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-[hsl(220_16%_12%)]">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                        <BrainCircuit className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight text-foreground uppercase tracking-wider">NEURAL_PLAYGROUND</h1>
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono">
                                v2.5.1-STABLE
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 overflow-x-auto no-scrollbar">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                                <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
                                NODE_ACTIVE: AMER-EAST
                            </div>
                            <span className="text-[hsl(220_16%_16%)]">|</span>
                            {sessionId && (
                                <div className="flex items-center gap-1.5 text-[10px] font-mono text-primary/70 uppercase tracking-widest whitespace-nowrap">
                                    <History className="h-3 w-3" />
                                    STRATUM_ID: {sessionId.substring(0, 8)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleResetSession} 
                        className="h-9 px-3 text-[11px] font-bold uppercase tracking-widest hover:bg-destructive/10 hover:text-destructive transition-all border border-transparent hover:border-destructive/20"
                    >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        PURGE_SESSION
                    </Button>
                </div>
            </div>

            {/* --- Main Chat Space --- */}
            <div className="relative flex-1 min-h-0 flex flex-col mb-4">
                <ScrollArea 
                    ref={scrollAreaRef}
                    className="flex-1 rounded-2xl border border-border bg-muted/20 backdrop-blur-sm shadow-inner"
                >
                    <div className="p-4 sm:p-6 space-y-6 lg:space-y-10 max-w-4xl mx-auto">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 lg:py-32 text-center">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                    <div className="relative p-6 bg-card rounded-3xl border border-primary/20 shadow-2xl">
                                        <Bot className="h-10 w-10 text-primary" />
                                    </div>
                                </div>
                                <div className="space-y-2 max-w-md">
                                    <h3 className="text-lg font-bold text-foreground">AWAITING_NEURAL_STIMULUS</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        The ReAct Agent is docked. Provide a complex query to initiate the multi-step reasoning and tool discovery process.
                                    </p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-2 mt-8">
                                    {['"Analyze revenue trends and predict Q3 growth"', '"What data assets correlate with customer churn?"', '"Run a sensitivity analysis on supply pricing"'].map((example, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => setQuery(example.slice(1, -1))}
                                            className="text-[11px] px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:bg-muted/10 hover:text-primary transition-all duration-200"
                                        >
                                            {example}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={cn("group flex flex-col w-full animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "relative max-w-[85%] sm:max-w-[75%] p-4 lg:p-5 rounded-3xl",
                                    msg.role === 'user' 
                                        ? "bg-muted/50 text-foreground border border-border rounded-tr-sm shadow-lg"
                                        : "bg-card/80 backdrop-blur-md border border-primary/10 rounded-tl-sm shadow-xl"
                                )}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {msg.role === 'user' ? (
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">SOURCE: OPERATOR</span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="h-4 px-1.5 text-[8px] font-black bg-primary/10 text-primary border-primary/20">AGENT_CORE</Badge>
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">NEURAL_DECODER</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={cn(
                                        "text-[15px] leading-relaxed",
                                        msg.role === 'assistant' ? "font-medium text-foreground/90 font-serif" : "text-foreground"
                                    )}>
                                        {msg.content}
                                    </div>
                                </div>

                                {/* Detailed Agent Pathway Overlay */}
                                {msg.role === 'assistant' && msg.result && (
                                    <div className="mt-4 w-full grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 animate-in zoom-in-95 duration-500">
                                        {/* Pathway Detail */}
                                        <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
                                            <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">EXECUTION_STACK</span>
                                                <span className="text-[10px] font-mono text-muted-foreground/40">{msg.result.tools_used.length} TOOLS_ACCESSED</span>
                                            </div>
                                            <div className="space-y-3">
                                                {msg.result.tools_used.length === 0 ? (
                                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                                        <Zap className="h-3 w-3 text-emerald-500" />
                                                        <p className="text-[11px] font-mono text-emerald-500/80 uppercase">Cognitive Inference Output</p>
                                                    </div>
                                                ) : (
                                                    msg.result.tools_used.map((tool, tIdx) => (
                                                        <div key={tIdx} className="flex gap-3 animate-in fade-in duration-300" style={{ animationDelay: `${tIdx * 100}ms` }}>
                                                            <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                                                                {getToolIcon(tool.name)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-bold text-[11px] uppercase tracking-wide text-foreground/80">{tool.name}</h4>
                                                                <div className="mt-1.5 p-2 rounded-md bg-muted/50 border border-input text-[9px] font-mono text-muted-foreground/70 overflow-x-auto custom-scrollbar">
                                                                    {JSON.stringify(tool.args, null, 2)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* Logic Detail */}
                                        <div className="p-4 rounded-2xl bg-card border border-border flex flex-col">
                                            <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/70">REASONING_ENGINE</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono text-foreground font-bold">{Math.round(msg.result.confidence_score * 100)}%</span>
                                                    <div className="h-1 w-12 bg-muted rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                                            style={{ width: `${msg.result.confidence_score * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[12px] text-muted-foreground/90 font-mono leading-relaxed italic border-l-2 border-amber-500/20 pl-3">
                                                "{msg.result.agent_reasoning}"
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {isThinking && (
                            <div className="flex flex-col items-start animate-pulse">
                                <div className="bg-card/50 border border-primary/10 rounded-3xl rounded-tl-sm p-4 shadow-sm flex items-center gap-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-md rounded-full animate-ping" />
                                        <Brain className="h-4 w-4 text-primary relative z-10" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-primary/60">SYNAPSE_FIRING: AGENT_EXECUTING_TOOLS...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* --- Bottom Input Dock (NON-FIXED) --- */}
                <div className="mt-4">
                    <Card className="relative overflow-hidden border-border shadow-2xl bg-card/95 backdrop-blur-xl">
                        {/* Decorative glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                        
                        <CardContent className="p-2 sm:p-3">
                            <div className="flex gap-2 items-end">
                                <div className="flex-1 relative group">
                                    <Input
                                        placeholder="INPUT_NEURAL_COMMAND..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                        disabled={isThinking}
                                        className="min-h-[48px] bg-transparent border-none shadow-none focus-visible:ring-0 text-[15px] pl-4 font-mono placeholder:text-muted-foreground/30 text-foreground"
                                    />
                                </div>
                                <Button 
                                    onClick={handleSubmit} 
                                    disabled={!query.trim() || isThinking}
                                    className={cn(
                                        "h-12 px-6 rounded-2xl transition-all duration-300 font-bold uppercase tracking-widest text-[11px]",
                                        query.trim() && !isThinking 
                                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:scale-105 active:scale-95" 
                                            : "bg-muted text-muted-foreground opacity-50"
                                    )}
                                >
                                    {isThinking ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span>EXECUTE</span>
                                            <Send className="h-3.5 w-3.5" />
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Status Footer */}
                    <div className="flex justify-center gap-6 mt-3">
                        <div className="flex items-center gap-2 group cursor-help">
                            <Layers className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                            <span className="text-[9px] font-black tracking-[0.15em] text-muted-foreground/40 uppercase">CONTEXT: MULTI_TURN_ENGAGED</span>
                        </div>
                        <div className="flex items-center gap-2 group cursor-help">
                            <Database className="h-3 w-3 text-muted-foreground/30 group-hover:text-emerald-500 transition-colors" />
                            <span className="text-[9px] font-black tracking-[0.15em] text-muted-foreground/40 uppercase">KNOWLEDGE: GRAPH_RAG_ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
