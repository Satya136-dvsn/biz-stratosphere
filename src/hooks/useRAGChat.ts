import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useAIUsageLimit } from './useAIUsageLimit';
import { aiOrchestrator } from '@/lib/ai/orchestrator';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_CHAT_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export interface ChatMessage {
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    sources?: any[];
    created_at: string;
}

export interface Conversation {
    id: string;
    user_id: string;
    title: string;
    context_window?: number;
    temperature?: number;
    max_tokens?: number;
    model_name?: string;
    created_at: string;
    updated_at: string;
}

export function useRAGChat(conversationId?: string) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { checkLimit, incrementUsage } = useAIUsageLimit();
    const [isStreaming, setIsStreaming] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Fetch conversations
    const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
        queryKey: ['chat-conversations', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('chat_conversations')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data as Conversation[];
        },
        enabled: !!user,
    });

    // Fetch messages for current conversation
    const { data: messages = [], isLoading: messagesLoading } = useQuery({
        queryKey: ['chat-messages', conversationId],
        queryFn: async () => {
            if (!conversationId) return [];

            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as ChatMessage[];
        },
        enabled: !!conversationId,
    });

    // Create new conversation with settings
    const createConversation = useMutation({
        mutationFn: async ({
            title,
            context_window = 10,
            temperature = 0.7,
            max_tokens = 2000
        }: {
            title: string;
            context_window?: number;
            temperature?: number;
            max_tokens?: number;
        }) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('chat_conversations')
                .insert([{
                    user_id: user.id,
                    title,
                    context_window,
                    temperature,
                    max_tokens
                }])
                .select()
                .single();

            if (error) throw error;
            return data as Conversation;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
        },
    });

    // Delete conversation
    const deleteConversation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('chat_conversations')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            toast({
                title: 'Success',
                description: 'Conversation deleted',
            });
        },
    });

    // Send message with RAG
    const sendMessage = useMutation({
        mutationFn: async ({
            convId,
            message,
            datasetId,
            similarityThreshold = 0.5,
            contextLimit = 5,
        }: {
            convId: string;
            message: string;
            datasetId?: string;
            similarityThreshold?: number;
            contextLimit?: number;
        }) => {
            if (!user) throw new Error('Not authenticated');

            // Check rate limit before processing
            const limitCheck = await checkLimit();
            if (!limitCheck.allowed) {
                throw new Error(limitCheck.reason || 'Rate limit exceeded');
            }

            setIsStreaming(true);
            setIsSearching(true); // Technically handled on server now, but keep state for UI feedback if needed

            try {
                // 1. Save user message
                const { data: userMessage, error: userMsgError } = await supabase
                    .from('chat_messages')
                    .insert([{
                        conversation_id: convId,
                        role: 'user',
                        content: message,
                    }])
                    .select()
                    .single();

                if (userMsgError) throw userMsgError;

                // 2. Prepare Context & History
                // Get conversation settings
                const { data: conversationData } = await supabase
                    .from('chat_conversations')
                    .select('context_window, temperature, max_tokens')
                    .eq('id', convId)
                    .single();

                const contextWindow = conversationData?.context_window || 10;

                // Get recent history
                const { data: historyData } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('conversation_id', convId)
                    .order('created_at', { ascending: true }) // Oldest first for context
                    .limit(contextWindow); // Simple limit for now, ideally token based

                const history = (historyData || []).map(msg => ({
                    role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                    content: msg.content
                }));

                // 3. Call AI Orchestrator
                // Note: We pass context='auto' to let the Edge Function handle RAG
                // But Orchestrator logic in client might need update to handle 'auto' or we just don't pass context 
                // and let Orchestrator's default behavior (which calls edge function) take over.
                // The prompt logic in Edge Function handles RAG if context is NOT provided or 'auto'.

                // We define a system prompt that encourages RAG usage
                const systemPrompt = `You are a helpful AI assistant analyzing business data. 
Answer questions based ONLY on the provided context from the user's data.
If the answer isn't in the context, say so clearly.
Cite sources using [Source 1], [Source 2] format.`;

                const response = await aiOrchestrator.generateResponse({
                    provider: 'gemini', // Default
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...history,
                        { role: 'user', content: message } // Current message
                    ],
                    context: 'auto', // Signal to Edge Function to perform RAG
                    temperature: conversationData?.temperature || 0.7,
                    maxTokens: conversationData?.max_tokens || 1000
                });

                if (response.error) {
                    throw new Error(response.error);
                }

                const assistantMessageContent = response.content;
                const sources = response.metadata?.sources || [];

                setIsSearching(false); // Done

                // 4. Save assistant message
                const { data: aiMessage, error: aiMsgError } = await supabase
                    .from('chat_messages')
                    .insert([{
                        conversation_id: convId,
                        role: 'assistant',
                        content: assistantMessageContent,
                        sources: sources.map((r: any) => ({
                            content: r.content,
                            metadata: r.metadata,
                            similarity: r.similarity || 0,
                        })),
                    }])
                    .select()
                    .single();

                if (aiMsgError) throw aiMsgError;

                // 5. Increment usage counter
                await incrementUsage();

                return { userMessage, aiMessage };

            } finally {
                setIsStreaming(false);
                setIsSearching(false);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to send message: ${error.message}`,
                variant: 'destructive',
            });
        },
    });

    return {
        conversations,
        conversationsLoading,
        messages,
        messagesLoading,
        createConversation: createConversation.mutate,
        deleteConversation: deleteConversation.mutate,
        sendMessage: sendMessage.mutate,
        isSending: sendMessage.isPending || isStreaming,
        isSearching,
        isCreating: createConversation.isPending,
        isDeleting: deleteConversation.isPending,
        refreshConversations: () => queryClient.invalidateQueries({ queryKey: ['chat-conversations'] }),
    };
}
