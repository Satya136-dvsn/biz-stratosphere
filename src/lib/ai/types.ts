export type AIProvider = 'local' | 'openai' | 'gemini';

export interface AIRequest {
    provider?: AIProvider;
    messages: AIMessage[];
    context?: string; // RAG Context or other data context
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean; // Force JSON output
}

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AIResponse {
    content: string;
    provider: AIProvider;
    latencyMs: number;
    tokensUsed?: number;
    error?: string;
    metadata?: any;
}

export interface AIConfig {
    localUrl: string; // e.g. "http://localhost:11434"
    preferredProvider: AIProvider;
    fallbackEnabled: boolean;
}

export interface AIRoutingMetrics {
    successRate: number;
    avgLatency: number;
    costEstimate: number;
}
