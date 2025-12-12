import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useEmbeddings } from './useEmbeddings';

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
    created_at: string;
    updated_at: string;
}

export function useRAGChat(conversationId?: string) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { searchSimilar } = useEmbeddings();
    const [isStreaming, setIsStreaming] = useState(false);

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

    // Create new conversation
    const createConversation = useMutation({
        mutationFn: async (title: string) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('chat_conversations')
                .insert([{ user_id: user.id, title }])
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
        }: {
            convId: string;
            message: string;
            datasetId?: string;
        }) => {
            if (!user) throw new Error('Not authenticated');

            setIsStreaming(true);

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

                // 2. Search for similar embeddings
                const searchResults = await searchSimilar(message, 5, datasetId);

                // 3. Build context from search results
                const context = searchResults
                    .map((result, idx) => `[Source ${idx + 1}]: ${result.content}`)
                    .join('\n\n');

                // 4. Build prompt
                const systemPrompt = `You are a helpful AI assistant analyzing business data. 
Answer questions based ONLY on the provided context from the user's data.
If the answer isn't in the context, say so clearly.
Cite sources using [Source 1], [Source 2] format.`;

                const userPrompt = context
                    ? `Context from data:\n${context}\n\nQuestion: ${message}`
                    : `Question: ${message}\n\nNote: No relevant data found in the database.`;

                // 5. Call Gemini API
                const response = await fetch(`${GEMINI_CHAT_URL}?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            {
                                role: 'user',
                                parts: [{ text: systemPrompt + '\n\n' + userPrompt }]
                            }
                        ],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1024,
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`Gemini API error: ${response.statusText}`);
                }

                const data = await response.json();
                const assistantMessage = data.candidates[0].content.parts[0].text;

                // 6. Save assistant message
                const { data: aiMessage, error: aiMsgError } = await supabase
                    .from('chat_messages')
                    .insert([{
                        conversation_id: convId,
                        role: 'assistant',
                        content: assistantMessage,
                        sources: searchResults.map(r => ({
                            content: r.content,
                            metadata: r.metadata,
                            similarity: r.similarity,
                        })),
                    }])
                    .select()
                    .single();

                if (aiMsgError) throw aiMsgError;

                return { userMessage, aiMessage };
            } finally {
                setIsStreaming(false);
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
        isCreating: createConversation.isPending,
        isDeleting: deleteConversation.isPending,
    };
}
