// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { AIConfig, AIRequest, AIResponse, AIMessage, AIProvider } from './types';
import { supabase } from '../supabaseClient';
import { AI_PROMPTS } from './prompts';

const DEFAULT_CONFIG: AIConfig = {
    localUrl: 'http://localhost:11434/api/chat',
    preferredProvider: 'gemini', // Default to FREE/Cheap option
    fallbackEnabled: false
};

export class AIOrchestrator {
    private config: AIConfig;
    private cache: Map<string, { content: string; timestamp: number; metadata?: any }> = new Map();
    private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour

    constructor(config: Partial<AIConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Main entry point for AI requests.
     * Handles routing, fallback, and error wrapping.
     */
    async generateResponse(request: AIRequest): Promise<AIResponse> {
        const startTime = performance.now();

        // Cache Key Generation (simple hash of messages + config)
        const cacheKey = JSON.stringify({
            msgs: request.messages.map(m => ({ r: m.role, c: m.content })),
            model: request.provider || this.config.preferredProvider,
            temp: request.temperature
        });

        // Check Cache
        const cached = this.cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
            console.log('[AIOrchestrator] Cache Hit');
            return {
                content: cached.content,
                provider: (request.provider || this.config.preferredProvider) + ' (cached)',
                latencyMs: 0,
                metadata: cached.metadata
            };
        }

        const provider = request.provider || this.config.preferredProvider;

        try {
            console.log(`[AIOrchestrator] Routing to: ${provider}`);

            let response: AIResponse;

            if (provider === 'local') {
                response = await this.callLocalLLM(request);
            } else if (provider === 'gemini') {
                // Use client-side direct call for Gemini to avoid Edge Function dependency
                response = await this.callGeminiDirect(request);
            } else {
                // OpenAI still uses Edge Function (optional, or could be direct too if key exposed)
                response = await this.callEdgeFunction(request, provider);
            }

            // Save to Cache (if successful)
            if (response.content && !response.error) {
                this.cache.set(cacheKey, {
                    content: response.content,
                    timestamp: Date.now(),
                    metadata: response.metadata
                });

                // Simple LRU-like cleanup: if too big, clear half
                if (this.cache.size > 100) {
                    const keys = Array.from(this.cache.keys());
                    for (let i = 0; i < 50; i++) this.cache.delete(keys[i]);
                }
            }

            return response;

        } catch (error: any) {
            console.error(`[AIOrchestrator] Error with ${provider}:`, error);

            // Fallback Logic
            if (this.config.fallbackEnabled && provider !== 'openai') {
                console.log('[AIOrchestrator] Attempting fallback to OpenAI...');
                const fallbackRequest = { ...request, provider: 'openai' as AIProvider };
                return await this.callEdgeFunction(fallbackRequest, 'openai');
            }

            return {
                content: "I apologize, but I'm having trouble processing your request right now. Please check your connection or API keys.",
                provider: provider,
                latencyMs: performance.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Calls Google Gemini API directly from client.
     */
    private async callGeminiDirect(request: AIRequest): Promise<AIResponse> {
        const startTime = performance.now();
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

        // MOCK FALLBACK for Demo/Invalid Key
        if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.length < 10) {
            console.warn('[AIOrchestrator] No valid Gemini API Key found. Using Mock Response.');
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate latency
            return {
                content: "I'm currently in Demo Mode because a valid API Key wasn't detected. \n\nNormally, I would analyze your data using Gemini Flash, but for now, I can tell you that your Revenue is trending up! 🚀\n\n(To enable real AI, please set VITE_GEMINI_API_KEY in your .env file)",
                provider: 'gemini (mock)',
                latencyMs: performance.now() - startTime,
                metadata: { model: 'mock-gemini' }
            };
        }

        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        // Construct Prompt with Context
        let systemInstruction = "";
        if (request.messages.length > 0 && request.messages[0].role === 'system') {
            systemInstruction = request.messages[0].content;
        }

        // Inject Context if provided
        if (request.context && request.context !== 'auto') {
            systemInstruction += `\n\nCONTEXT DATA:\n${request.context}\n\nAnswer based on this context if relevant.`;
        }

        const contents = request.messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));

        const payload = {
            contents: contents,
            generationConfig: {
                temperature: request.temperature || 0.7,
                maxOutputTokens: request.maxTokens || 2000,
            }
        };

        // Prepend system instruction to first message if present
        if (systemInstruction && payload.contents.length > 0) {
            payload.contents[0].parts[0].text = `System Prompt: ${systemInstruction}\n\nUser Message: ${payload.contents[0].parts[0].text}`;
        }

        // Implementation of Exponential Backoff for Rate Limits (429)
        let attempt = 0;
        const maxRetries = 3;
        const baseDelay = 1000; // 1 second

        while (attempt <= maxRetries) {
            try {
                const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.status === 429) {
                    // Rate Limit Hit
                    attempt++;
                    if (attempt > maxRetries) {
                        throw new Error(`Gemini Rate Limit Exceeded after ${maxRetries} retries.`);
                    }
                    const delay = baseDelay * Math.pow(2, attempt) + (Math.random() * 1000); // Backoff + Jitter
                    console.warn(`[AIOrchestrator] Rate limit hit (429). Retrying in ${Math.round(delay)}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue; // Retry loop
                }

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(`Gemini API Error: ${res.statusText} ${JSON.stringify(errData)}`);
                }

                const data = await res.json();
                const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

                return {
                    content: content,
                    provider: 'gemini',
                    latencyMs: performance.now() - startTime,
                    metadata: { model: 'gemini-3.0-flash' }
                };

            } catch (error: any) {
                // If it's a network error (fetch failed), we might also want to retry, 
                // but for now we focus on the explicit 429 loop or throw for other errors.
                // If we threw inside the loop (max retries), re-throw here.
                if (attempt > maxRetries || !error.message.includes('Rate Limit')) {
                    throw error;
                }
            }
        }

        throw new Error('Unexpected retry loop exit');
    }

    /**
     * Calls a local LLM (e.g., Ollama) running on the user's machine.
     * This makes the app "AI-Native" without external dependencies if desired.
     */
    private async callLocalLLM(request: AIRequest): Promise<AIResponse> {
        const startTime = performance.now();

        // Ollama API format
        const payload = {
            model: "mistral", // Default, could be configurable
            messages: request.messages,
            stream: false,
            options: {
                temperature: request.temperature || 0.7,
                num_predict: request.maxTokens || 1000
            }
        };

        try {
            const res = await fetch(this.config.localUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error(`Local LLM Error: ${res.statusText}`);
            }

            const data = await res.json();

            return {
                content: data.message.content,
                provider: 'local',
                latencyMs: performance.now() - startTime,
                metadata: { model: data.model }
            };
        } catch (err) {
            // If fetch fails (e.g. refused connection), standard error
            if (err instanceof TypeError && err.message.includes('fetch')) {
                throw new Error('Local LLM server not reachable. Is Ollama running?');
            }
            throw err;
        }
    }

    /**
     * Calls the unified 'ai-pipeline' Edge Function.
     * The Edge Function handles the actual API calls to OpenAI/Gemini
     * and RAG context injection.
     */
    private async callEdgeFunction(request: AIRequest, provider: AIProvider): Promise<AIResponse> {
        const startTime = performance.now();

        const { data, error } = await supabase.functions.invoke('ai-pipeline', {
            body: {
                messages: request.messages,
                provider: provider,
                context: request.context,
                config: {
                    temperature: request.temperature,
                    maxTokens: request.maxTokens,
                    jsonMode: request.jsonMode
                }
            }
        });

        if (error) {
            throw error;
        }

        return {
            content: data.content,
            provider: provider,
            latencyMs: performance.now() - startTime,
            tokensUsed: data.usage?.total_tokens,
            metadata: data.metadata
        };
    }
    async explainPrediction(
        prediction: { label: string; score: number; confidence: number },
        features: Record<string, any>,
        featureImportance: Record<string, number>
    ): Promise<AIResponse> {
        const featureStr = Object.entries(features)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join('\n');

        const importanceStr = Object.entries(featureImportance)
            .sort(([, a], [, b]) => b - a)
            .map(([k, v]) => `- ${k}: ${(v * 100).toFixed(1)}% influence`)
            .join('\n');

        const prompt = `
        Prediction: ${prediction.label} (Score: ${prediction.score.toFixed(4)}, Confidence: ${(prediction.confidence * 100).toFixed(1)}%)
        
        Input Features:
        ${featureStr}
        
        Feature Importance:
        ${importanceStr}
        `;

        return this.generateResponse({
            messages: [
                { role: 'system', content: AI_PROMPTS.PREDICTION_EXPLAINER },
                { role: 'user', content: prompt }
            ],
            provider: 'gemini'
        });
    }
    async suggestAutomationRules(
        analyticsData: Record<string, any>
    ): Promise<any[]> {
        const dataStr = Object.entries(analyticsData)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join('\n');

        const prompt = `
        Current Business Metrics:
        ${dataStr}
        
        Suggest 3 high-impact automation rules.
        `;

        const response = await this.generateResponse({
            messages: [
                { role: 'system', content: AI_PROMPTS.AUTOMATION_SUGGESTER },
                { role: 'user', content: prompt }
            ],
            provider: 'gemini',
            jsonMode: true
        });

        try {
            // Attempt to parse JSON from content
            let jsonStr = response.content;
            // Clean markdown code blocks if present (despite prompt instruction)
            jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error('Failed to parse AI suggestions:', e);
            return [];
        }
    }
}

// Singleton instance
export const aiOrchestrator = new AIOrchestrator();
