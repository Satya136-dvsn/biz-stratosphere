import { useState } from 'react';
import { ChatMessage } from '@/hooks/useRAGChat';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-primary' : 'bg-secondary'
                }`}>
                {isUser ? (
                    <User className="h-4 w-4 text-primary-foreground" />
                ) : (
                    <Bot className="h-4 w-4 text-secondary-foreground" />
                )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}  flex flex-col gap-2`}>
                <Card className={`p-3 ${isUser
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                    }`}>
                    {isUser ? (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({ node, inline, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const language = match ? match[1] : '';
                                        const codeString = String(children).replace(/\n$/, '');
                                        const codeId = `${language}-${codeString.substring(0, 20)}`;

                                        return !inline && match ? (
                                            <div className="relative group my-4">
                                                <div className="flex items-center justify-between bg-zinc-800 px-4 py-2 rounded-t-lg">
                                                    <span className="text-xs text-zinc-400 font-mono">{language}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2 text-zinc-400 hover:text-zinc-100"
                                                        onClick={() => copyToClipboard(codeString, language)}
                                                    >
                                                        {copiedCode === codeId ? (
                                                            <>
                                                                <Check className="h-3 w-3 mr-1" />
                                                                Copied
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="h-3 w-3 mr-1" />
                                                                Copy
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                                <SyntaxHighlighter
                                                    style={oneDark}
                                                    language={language}
                                                    PreTag="div"
                                                    className="!mt-0 !rounded-t-none"
                                                    {...props}
                                                >
                                                    {codeString}
                                                </SyntaxHighlighter>
                                            </div>
                                        ) : (
                                            <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    a({ node, children, ...props }) {
                                        return (
                                            <a
                                                {...props}
                                                className="text-primary hover:underline"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {children}
                                            </a>
                                        );
                                    },
                                    table({ node, children, ...props }) {
                                        return (
                                            <div className="overflow-x-auto my-4">
                                                <table className="min-w-full divide-y divide-border" {...props}>
                                                    {children}
                                                </table>
                                            </div>
                                        );
                                    },
                                    th({ node, children, ...props }) {
                                        return (
                                            <th className="px-4 py-2 bg-muted text-left text-sm font-semibold" {...props}>
                                                {children}
                                            </th>
                                        );
                                    },
                                    td({ node, children, ...props }) {
                                        return (
                                            <td className="px-4 py-2 border-t text-sm" {...props}>
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
                </Card>

                {/* Sources */}
                {!isUser && message.sources && message.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {message.sources.map((source, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Source {idx + 1}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Confidence Badge for AI responses */}
                {!isUser && message.confidence && (
                    <ConfidenceBadge
                        confidence={message.confidence}
                        showDetails={true}
                        sourceCount={message.sources?.length || 0}
                        className="mt-1"
                    />
                )}

                {/* Source Transparency */}
                {!isUser && (
                    <SourceTransparency
                        sourceCount={message.sources?.length || 0}
                        isLimited={!message.sources || message.sources.length === 0}
                    />
                )}

                {/* Decision Action */}
                {!isUser && (
                    <div className="flex gap-2 mt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5"
                            onClick={handleUseInsight}
                        >
                            <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                            Use Insight
                        </Button>
                    </div>
                )}

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground">
                    {format(new Date(message.created_at), 'h:mm a')}
                </p>
            </div>
        </div>
    );
}
