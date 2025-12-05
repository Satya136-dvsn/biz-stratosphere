import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDataContext, buildAIContext } from './useDataContext';

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

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = 'gpt-4o-mini'; // Cost-effective model

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
            if (!user) throw new Error('User not authenticated');

            setIsTyping(true);

            try {
                // Build context from user's data
                const context = dataContext ? buildAIContext(dataContext) : '';

                // Prepare messages for OpenAI
                const messages: any[] = [
                    {
                        role: 'system',
                        content: `You are an AI business analyst assistant. You help users analyze their business data and provide insights.
            
${context}

Provide concise, actionable insights based on the user's data. When referencing data, be specific. If the user hasn't uploaded data yet, guide them to upload their business data first.`
                    }
                ];

                // Add conversation history
                if (conversation?.messages) {
                    conversation.messages.forEach(msg => {
                        messages.push({
                            role: msg.role,
                            content: msg.content
                        });
                    });
                }

                // Add current user message
                messages.push({
                    role: 'user',
                    content: message
                });

                // Call OpenAI API
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: OPENAI_MODEL,
                        messages,
                        temperature: 0.7,
                        max_tokens: 1000,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`OpenAI API error: ${response.statusText}`);
                }

                const data = await response.json();
                const assistantMessage = data.choices[0].message.content;
                const usage = data.usage;

                // Update token usage
                setTokenUsage({
                    prompt: usage.prompt_tokens,
                    completion: usage.completion_tokens,
                    total: usage.total_tokens,
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
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-conversation'] });
            queryClient.invalidateQueries({ queryKey: ['ai-conversations-list'] });
        },
    });

    // Calculate cost (approximate)
    const estimatedCost = (tokenUsage.total / 1000) * 0.00015; // gpt-4o-mini pricing

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
