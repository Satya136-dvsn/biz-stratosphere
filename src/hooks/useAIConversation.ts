import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { trackLatency } from '@/lib/performance';
import { useAuth } from './useAuth';
import { useDataContext, buildAIContext } from './useDataContext';
import { aiOrchestrator } from '@/lib/ai/orchestrator';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    created_at: Date;
    updated_at: Date;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash'; // Fast and free!

export function useAIConversation(conversationId?: string) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { data: dataContext } = useDataContext();
    const [isTyping, setIsTyping] = useState(false);
    const [tokenUsage, setTokenUsage] = useState({ prompt: 0, completion: 0, total: 0 });

    // Fetch conversation history
    const { data: conversation } = useQuery({
        queryKey: ['ai-conversation', conversationId],
        queryFn: async (): Promise<Conversation | null> => {
            if (!conversationId || !user) return null;

            const { data } = await supabase
                .from('ai_conversations')
                .select('*')
                .eq('id', conversationId)
                .eq('user_id', user.id)
                .single();

            return data ? {
                id: data.id,
                title: data.title,
                messages: data.messages || [],
                created_at: new Date(data.created_at),
                updated_at: new Date(data.updated_at),
            } : null;
        },
        enabled: !!conversationId && !!user,
    });

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: async ({ message, newConversation }: { message: string; newConversation?: boolean }) => {
            return trackLatency('AI Query', async () => {
                if (!user) throw new Error('User not authenticated');

                setIsTyping(true);

                try {
                    // Build context from user's data
                    const context = dataContext ? buildAIContext(dataContext) : '';

                    // Build conversation history for Orchestrator
                    const prevMessages = conversation?.messages.map(msg => ({
                        role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                        content: msg.content
                    })) || [];

                    // Add System Prompt
                    const systemInstruction = `You are an AI business analyst assistant. You help users analyze their business data and provide insights.
    ${context}
    Provide concise, actionable insights based on the user's data.`;

                    // Call AI Orchestrator
                    const response = await aiOrchestrator.generateResponse({
                        provider: 'gemini', // Default to Gemini (Free)
                        messages: [
                            { role: 'system', content: systemInstruction },
                            ...prevMessages,
                            { role: 'user', content: message }
                        ],
                        context: context // Pass explicit context if available locally
                    });

                    if (response.error) {
                        throw new Error(response.error);
                    }

                    const assistantMessage = response.content;

                    // Update token usage (from response or estimate)
                    const usedTokens = response.tokensUsed || 0;
                    setTokenUsage({
                        prompt: 0, // Orchestrator might not return split yet
                        completion: 0,
                        total: usedTokens,
                    });

                    // Create or update conversation in database
                    const newMessages: Message[] = [
                        ...(conversation?.messages || []),
                        {
                            id: crypto.randomUUID(),
                            role: 'user',
                            content: message,
                            timestamp: new Date(),
                        },
                        {
                            id: crypto.randomUUID(),
                            role: 'assistant',
                            content: assistantMessage,
                            timestamp: new Date(),
                        },
                    ];

                    if (newConversation || !conversationId) {
                        // Create new conversation
                        const { data: newConv } = await supabase
                            .from('ai_conversations')
                            .insert({
                                user_id: user.id,
                                title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
                                messages: newMessages,
                            })
                            .select()
                            .single();

                        return { conversation: newConv, messages: newMessages };
                    } else {
                        // Update existing conversation
                        await supabase
                            .from('ai_conversations')
                            .update({
                                messages: newMessages,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', conversationId);

                        return { conversation: { ...conversation, messages: newMessages }, messages: newMessages };
                    }
                } finally {
                    setIsTyping(false);
                }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-conversation'] });
            queryClient.invalidateQueries({ queryKey: ['ai-conversations-list'] });
        },
    });

    const estimatedCost = 0; // Gemini Flash is free

    return {
        conversation,
        messages: conversation?.messages || [],
        isTyping,
        sendMessage: sendMessageMutation.mutate,
        isSending: sendMessageMutation.isPending,
        tokenUsage,
        estimatedCost,
    };
}

// List all conversations
export function useAIConversations() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['ai-conversations-list', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data } = await supabase
                .from('ai_conversations')
                .select('id, title, created_at, updated_at')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(20);

            return data || [];
        },
        enabled: !!user,
    });
}
