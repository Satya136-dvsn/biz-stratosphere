import { ChatMessage } from '@/hooks/useRAGChat';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, User, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessageProps {
    message: ChatMessage;
}

export function ChatMessageComponent({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';

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
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
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

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground">
                    {format(new Date(message.created_at), 'h:mm a')}
                </p>
            </div>
        </div>
    );
}
