import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useAIUsageLimit } from './useAIUsageLimit';
import { aiOrchestrator } from '@/lib/ai/orchestrator';
import { useEmbeddings } from '@/hooks/useEmbeddings';
import { calculateConfidenceFromResults, type ConfidenceScore } from '@/lib/ai/confidenceScoring';
import { validateGrounding, type GroundingResult } from '@/lib/ai/groundingValidator';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_CHAT_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent';

export interface ChatMessage {
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    sources?: any[];
    confidence?: ConfidenceScore;
    grounding?: GroundingResult;
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
    const { searchSimilar } = useEmbeddings();

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
            setIsSearching(true);

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
                let contextText = '';
                let searchSources: any[] = [];

                // Perform Client-Side retrieval if dataset selected
                if (datasetId && datasetId !== 'none') {
                    try {
                        const results = await searchSimilar(message, contextLimit, datasetId, similarityThreshold);
                        if (results && results.length > 0) {
                            contextText = results.map(r => `[Source ID: ${r.id}]\n${r.content}`).join('\n\n');
                            searchSources = results.map(r => ({
                                content: r.content,
                                metadata: r.metadata,
                                similarity: r.similarity
                            }));
                            console.log(`[RAG] Found ${results.length} context chunks.`);
                        } else {
                            console.log('[RAG] No relevant context found above threshold.');
                        }
                    } catch (searchErr) {
                        console.error('Vector search failed:', searchErr);
                        // Continue without context rather than failing completely
                    }
                }

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
                    .limit(contextWindow);

                const history = (historyData || []).map(msg => ({
                    role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                    content: msg.content
                }));

                // 3. Call AI Orchestrator (Client-Side)
                const systemPrompt = `You are a helpful AI assistant analyzing business data. 
Answer questions based on the provided context if available.
If the answer isn't in the context, say so clearly but try to be helpful with general knowledge.
Cite sources using [Source ID] format if referenced.`;

                const response = await aiOrchestrator.generateResponse({
                    provider: 'gemini', // Default to Gemini Client-Side
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...history,
                        { role: 'user', content: message } // Current message
                    ],
                    context: contextText || undefined, // Pass retrieved text directly
                    temperature: conversationData?.temperature || 0.7,
                    maxTokens: conversationData?.max_tokens || 1000
                });

                if (response.error) {
                    throw new Error(response.error);
                }

                const assistantMessageContent = response.content;
                const sources = response.metadata?.sources || [];

                setIsSearching(false); // Done

                // 4. Calculate Confidence Score
                const confidence = calculateConfidenceFromResults(
                    searchSources,
                    message,
                    !!(datasetId && datasetId !== 'none')
                );

                // 5. Validate Grounding
                const grounding = validateGrounding({
                    response: assistantMessageContent,
                    sources: searchSources,
                });

                // 6. Save assistant message with confidence metadata
                const { data: aiMessage, error: aiMsgError } = await supabase
                    .from('chat_messages')
                    .insert([{
                        conversation_id: convId,
                        role: 'assistant',
                        content: assistantMessageContent,
                        sources: searchSources.map((r: any) => ({
                            content: r.content,
                            metadata: r.metadata,
                            similarity: r.similarity || 0,
                        })),
                    }])
                    .select()
                    .single();

                if (aiMsgError) throw aiMsgError;

                // 7. Log to AI Response Audit table (non-blocking)
                try {
                    await supabase.from('ai_response_audits').insert([{
                        user_id: user.id,
                        conversation_id: convId,
                        query: message,
                        response_preview: assistantMessageContent.substring(0, 500),
                        confidence_score: confidence.score,
                        confidence_level: confidence.level,
                        confidence_reasons: confidence.reasons,
                        grounding_score: grounding.groundingScore,
                        is_grounded: grounding.isGrounded,
                        source_count: searchSources.length,
                        dataset_id: datasetId && datasetId !== 'none' ? datasetId : null,
                        average_similarity: searchSources.length > 0
                            ? searchSources.reduce((a, b) => a + b.similarity, 0) / searchSources.length
                            : null,

                        // Versioning Metadata
                        model_version: 'gemini-1.5-flash',
                        prompt_version: 'v2.1-rag-optimized',
                    }]);
                } catch (auditError) {
                    console.warn('[RAG] Audit logging failed:', auditError);
                    // Don't fail the request if audit fails
                }

                // 8. Increment usage counter
                await incrementUsage();

                // Return message with confidence metadata attached
                return {
                    userMessage,
                    aiMessage: {
                        ...aiMessage,
                        confidence,
                        grounding,
                    },
                };

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
