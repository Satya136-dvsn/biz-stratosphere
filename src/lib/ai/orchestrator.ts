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

    constructor(config: Partial<AIConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Main entry point for AI requests.
     * Handles routing, fallback, and error wrapping.
     */
    async generateResponse(request: AIRequest): Promise<AIResponse> {
        const startTime = performance.now();
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

        if (!apiKey) {
            throw new Error('Missing VITE_GEMINI_API_KEY environment variable');
        }

        const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

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
            // System instruction support depends on model version, usually simpler to prepend to first user message or handle above
        };

        // Prepend system instruction to first message if present (Gemini Pro doesn't always support system_instruction field in all versions yet)
        if (systemInstruction && payload.contents.length > 0) {
            payload.contents[0].parts[0].text = `System Prompt: ${systemInstruction}\n\nUser Message: ${payload.contents[0].parts[0].text}`;
        }

        const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

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
            metadata: { model: 'gemini-pro' }
        };
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
