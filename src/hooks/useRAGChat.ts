// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

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

const GATEWAY_URL = 'http://localhost:8000/api/v1/chat';

async function authFetch(url: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${session?.access_token}`
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
        let err = res.statusText;
        try { err = await res.text(); } catch (e) {}
        throw new Error(`API Error: ${err}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
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
            return await authFetch(`${GATEWAY_URL}/conversations?select=*&user_id=eq.${user.id}&order=updated_at.desc`) as Conversation[];
        },
        enabled: !!user,
    });

    // Fetch messages for current conversation
    const { data: messages = [], isLoading: messagesLoading } = useQuery({
        queryKey: ['chat-messages', conversationId],
        queryFn: async () => {
            if (!conversationId) return [];
            return await authFetch(`${GATEWAY_URL}/messages?select=*&conversation_id=eq.${conversationId}&order=created_at.asc`) as ChatMessage[];
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

             const data = await authFetch(`${GATEWAY_URL}/conversations`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    user_id: user.id,
                    title,
                    context_window,
                    temperature,
                    max_tokens
                })
            });
            return (Array.isArray(data) ? data[0] : data) as Conversation;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
        },
    });

    // Delete conversation
    const deleteConversation = useMutation({
        mutationFn: async (id: string) => {
            await authFetch(`${GATEWAY_URL}/conversations/${id}`, { method: 'DELETE' });
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
                const userMsgData = await authFetch(`${GATEWAY_URL}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
                    body: JSON.stringify({
                        conversation_id: convId,
                        role: 'user',
                        content: message,
                    })
                });
                const userMessage = Array.isArray(userMsgData) ? userMsgData[0] : userMsgData;

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
                        }
                    } catch (searchErr) {
                        console.error('Vector search failed:', searchErr);
                    }
                }

                // Get conversation settings
                const convDataRes = await authFetch(`${GATEWAY_URL}/conversations?select=context_window,temperature,max_tokens&id=eq.${convId}`);
                const conversationData = Array.isArray(convDataRes) ? convDataRes[0] : convDataRes;
                const contextWindow = conversationData?.context_window || 10;

                // Get recent history
                const historyData = await authFetch(`${GATEWAY_URL}/messages?select=*&conversation_id=eq.${convId}&order=created_at.asc&limit=${contextWindow}`);
                const history = (historyData || []).map((msg: any) => ({
                    role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                    content: msg.content
                }));

                // 3. Call AI Orchestrator
                const systemPrompt = `You are a helpful AI assistant analyzing business data. 
Answer questions based on the provided context if available.
If the answer isn't in the context, say so clearly but try to be helpful with general knowledge.
Cite sources using [Source ID] format if referenced.`;

                const response = await aiOrchestrator.generateResponse({
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...history,
                        { role: 'user', content: message } 
                    ],
                    context: contextText || undefined,
                    temperature: conversationData?.temperature || 0.7,
                    maxTokens: conversationData?.max_tokens || 1000
                });

                if (response.error) {
                    throw new Error(response.error);
                }

                const assistantMessageContent = response.content;
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

                // 6. Save assistant message
                const aiMsgData = await authFetch(`${GATEWAY_URL}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
                    body: JSON.stringify({
                        conversation_id: convId,
                        role: 'assistant',
                        content: assistantMessageContent,
                        sources: searchSources.map((r: any) => ({
                            content: r.content,
                            metadata: r.metadata,
                            similarity: r.similarity || 0,
                        }))
                    })
                });
                const aiMessage = Array.isArray(aiMsgData) ? aiMsgData[0] : aiMsgData;

                // 7. Log to AI Response Audit table
                try {
                    await authFetch(`${GATEWAY_URL}/audits`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
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
                            model_version: aiOrchestrator.getChatModelName(),
                            prompt_version: 'v2.1-rag-optimized',
                        })
                    });
                } catch (auditError) {
                    console.warn('[RAG] Audit logging failed:', auditError);
                }

                // 8. Increment usage counter
                await incrementUsage();

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
