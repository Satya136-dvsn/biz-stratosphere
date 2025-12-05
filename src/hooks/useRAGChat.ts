import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RAGMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
    timestamp: Date;
}

export function useRAGChat() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState<RAGMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    // Send RAG query
    const sendRAGQuery = useMutation({
        mutationFn: async (query: string) => {
            if (!user) throw new Error('Not authenticated');

            setIsTyping(true);

            try {
                const { data, error } = await supabase.functions.invoke('rag-query', {
                    body: {
                        query,
                        userId: user.id,
                    },
                });

                if (error) throw error;

                return {
                    answer: data.answer,
                    sources: data.sources || [],
                    usage: data.usage,
                };
            } finally {
                setIsTyping(false);
            }
        },
        onSuccess: (data, query) => {
            // Add user message
            const userMessage: RAGMessage = {
                id: crypto.randomUUID(),
                role: 'user',
                content: query,
                timestamp: new Date(),
            };

            // Add assistant message with sources
            const assistantMessage: RAGMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: data.answer,
                sources: data.sources,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, userMessage, assistantMessage]);
        },
    });

    const clearChat = () => {
        setMessages([]);
    };

    return {
        messages,
        sendQuery: sendRAGQuery.mutate,
        isSending: sendRAGQuery.isPending,
        isTyping,
        clearChat,
    };
}
