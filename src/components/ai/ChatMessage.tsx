// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState } from 'react';
import { ChatMessage } from '@/hooks/useRAGChat';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Bot, User, ExternalLink, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { ConfidenceBadge, SourceTransparency } from './ConfidenceBadge';
import { useDecisionMemory } from '@/hooks/useDecisionMemory';
import { BrainCircuit } from 'lucide-react';

interface ChatMessageProps {
    message: ChatMessage;
}

export function ChatMessageComponent({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const { createDecision } = useDecisionMemory();

    const copyToClipboard = (code: string, language: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(`${language}-${code.substring(0, 20)}`);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleUseInsight = () => {
        createDecision.mutate({
            decision_type: 'ai_chat',
            input_context: { message_content: message.content, sources: message.sources },
            expected_outcome: 'Insight applied to business context',
            human_action: 'accepted',
            ai_confidence_score: message.confidence?.score || 0.8,
            ai_confidence_level: message.confidence?.level || 'high'
        });
    };

    return (
        <div className={cn(
            "flex gap-4 group animate-in slide-in-from-bottom-2 duration-500",
            isUser ? "flex-row-reverse" : "flex-row"
        )}>
            {/* Neural Identity Avatar */}
            <div className="flex-shrink-0 mt-1">
                <div className={cn(
                    "h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300",
                    isUser 
                        ? "bg-primary text-white shadow-primary/20" 
                        : "bg-[hsl(220_16%_9%)] border border-[hsl(220_16%_14%)] text-primary shadow-black/40"
                )}>
                    {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>
            </div>

            {/* Neural Signal Content */}
            <div className={cn(
                "flex-1 max-w-[85%] flex flex-col gap-3",
                isUser ? "items-end" : "items-start"
            )}>
                <div className={cn(
                    "relative px-5 py-4 rounded-[24px] shadow-2xl transition-all duration-300",
                    isUser
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-white/[0.03] backdrop-blur-md border border-white/[0.08] text-foreground rounded-tl-none hover:border-primary/20"
                )}>
                    {isUser ? (
                        <p className="text-[14px] leading-relaxed font-medium whitespace-pre-wrap break-words">{message.content}</p>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[hsl(220_16%_5%)] prose-pre:border prose-pre:border-white/[0.05] prose-pre:rounded-xl">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({ node, inline, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const language = match ? match[1] : '';
                                        const codeString = String(children).replace(/\n$/, '');
                                        const codeId = `${language}-${codeString.substring(0, 20)}`;

                                        return !inline && match ? (
                                            <div className="relative group/code my-6 rounded-xl overflow-hidden border border-white/[0.05] shadow-2xl">
                                                <div className="flex items-center justify-between bg-[hsl(220_16%_9%)] px-4 py-2.5 border-b border-white/[0.05]">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                        <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">{language}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-3 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                                                        onClick={() => copyToClipboard(codeString, language)}
                                                    >
                                                        {copiedCode === codeId ? (
                                                            <>
                                                                <Check className="h-3 w-3 mr-1.5 text-emerald-500" />
                                                                Copied
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="h-3 w-3 mr-1.5" />
                                                                Copy Signal
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                                <SyntaxHighlighter
                                                    style={oneDark}
                                                    language={language}
                                                    PreTag="div"
                                                    customStyle={{
                                                        margin: 0,
                                                        padding: '1.25rem',
                                                        background: 'hsl(220 16% 5%)',
                                                        fontSize: '13px',
                                                        lineHeight: '1.6'
                                                    }}
                                                    {...props}
                                                >
                                                    {codeString}
                                                </SyntaxHighlighter>
                                            </div>
                                        ) : (
                                            <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[13px] font-mono font-bold" {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    a({ node, children, ...props }) {
                                        return (
                                            <a
                                                {...props}
                                                className="text-primary font-bold hover:underline decoration-2 underline-offset-4"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {children}
                                            </a>
                                        );
                                    },
                                    table({ node, children, ...props }) {
                                        return (
                                            <div className="overflow-x-auto my-6 border border-white/[0.05] rounded-xl bg-white/[0.01]">
                                                <table className="min-w-full divide-y divide-white/[0.05]" {...props}>
                                                    {children}
                                                </table>
                                            </div>
                                        );
                                    },
                                    th({ node, children, ...props }) {
                                        return (
                                            <th className="px-5 py-3 bg-white/[0.03] text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60" {...props}>
                                                {children}
                                            </th>
                                        );
                                    },
                                    td({ node, children, ...props }) {
                                        return (
                                            <td className="px-5 py-3 text-[13px] border-t border-white/[0.03]" {...props}>
                                                {children}
                                            </td>
                                        );
                                    },
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}
                    
                    {/* Timestamp overlay for user messages */}
                    <div className={cn(
                        "mt-3 text-[9px] font-bold uppercase tracking-widest opacity-30",
                        isUser ? "text-right" : "text-left"
                    )}>
                        {format(new Date(message.created_at), 'HH:mm:ss')} · {isUser ? 'HUMAN_INPUT' : 'NEURAL_EMISSION'}
                    </div>
                </div>

                {/* Extended Heuristics (AI Only) */}
                {!isUser && (
                    <div className="flex flex-col gap-3 px-1 w-full animate-in fade-in slide-in-from-top-1 duration-700 delay-300">
                        {/* Sources & Transparency */}
                        <div className="flex flex-wrap items-center gap-2">
                             {message.sources && message.sources.length > 0 && message.sources.map((source, idx) => (
                                <Badge key={idx} variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 hover:bg-primary/10 transition-colors cursor-pointer">
                                    <ExternalLink className="h-2.5 w-2.5 mr-1" />
                                    Node Ref {idx + 1}
                                </Badge>
                             ))}
                             
                             <SourceTransparency
                                sourceCount={message.sources?.length || 0}
                                isLimited={!message.sources || message.sources.length === 0}
                             />
                        </div>

                        {/* Confidence Metric */}
                        {message.confidence && (
                            <ConfidenceBadge
                                confidence={message.confidence}
                                showDetails={true}
                                sourceCount={message.sources?.length || 0}
                            />
                        )}

                        {/* Intelligence Actions */}
                        <div className="flex items-center gap-2 pt-1 border-t border-white/[0.05]">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary hover:bg-primary/10 rounded-full transition-all gap-1.5"
                                onClick={handleUseInsight}
                            >
                                <BrainCircuit className="h-3.5 w-3.5" />
                                Integrate Insight
                            </Button>
                            
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground/40 hover:text-foreground hover:bg-white/5 rounded-full transition-all"
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
