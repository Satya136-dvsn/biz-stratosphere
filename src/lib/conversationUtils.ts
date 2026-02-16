// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import type { ChatMessage } from '@/hooks/useRAGChat';

/**
 * Prepares conversation context for AI with sliding window
 * @param messages All messages in the conversation
 * @param contextWindow Number of recent messages to include
 * @returns Messages formatted for Gemini API
 */
export function prepareContextForAI(
    messages: ChatMessage[],
    contextWindow: number = 10
): Array<{ role: string; parts: Array<{ text: string }> }> {
    // Take last N messages for context window
    const recentMessages = messages.slice(-contextWindow);

    // Format for Gemini API
    return recentMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model', // Gemini uses 'model' instead of 'assistant'
        parts: [{ text: msg.content }]
    }));
}

/**
 * Estimates token count for messages (rough approximation)
 * @param messages Messages to estimate
 * @returns Approximate token count
 */
export function estimateTokenCount(messages: ChatMessage[]): number {
    // Rough estimate: 1 token ≈ 4 characters
    return messages.reduce((sum, msg) =>
        sum + Math.ceil(msg.content.length / 4), 0
    );
}

/**
 * Prunes conversation to fit within token limit
 * Keeps first message (context) and recent messages
 * @param messages All messages
 * @param maxTokens Maximum allowed tokens
 * @param contextWindow Number of messages to keep at end
 * @returns Pruned message list
 */
export function pruneConversation(
    messages: ChatMessage[],
    maxTokens: number = 4000,
    contextWindow: number = 10
): ChatMessage[] {
    const currentTokens = estimateTokenCount(messages);

    if (currentTokens <= maxTokens) {
        return messages;
    }

    // Keep first message (usually system/context)
    const firstMessage = messages[0];

    // Keep recent messages within context window
    const recentMessages = messages.slice(-contextWindow);

    // If we still have room for middle messages, include some
    const combinedLength = estimateTokenCount([firstMessage, ...recentMessages]);

    if (combinedLength < maxTokens) {
        // We have room for more - include what we can from the middle
        return messages;
    }

    // Just return first + recent if still over limit
    return [firstMessage, ...recentMessages];
}

/**
 * Generates a hash for content (for caching)
 * Uses Web Crypto API for browser compatibility
 * @param content Text to hash
 * @returns SHA-256 hash as hex string
 */
export async function hashContent(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
