// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            ai_conversations: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    messages: any;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title: string;
                    messages?: any;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    title?: string;
                    messages?: any;
                    updated_at?: string;
                };
            };
            chat_conversations: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    context_window: number;
                    temperature: number;
                    max_tokens: number;
                    model_name: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title: string;
                    context_window?: number;
                    temperature?: number;
                    max_tokens?: number;
                    model_name?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    title?: string;
                    context_window?: number;
                    temperature?: number;
                    max_tokens?: number;
                    model_name?: string;
                    updated_at?: string;
                };
            };
            chat_messages: {
                Row: {
                    id: string;
                    conversation_id: string;
                    role: string;
                    content: string;
                    sources: any;
                    confidence: any;
                    grounding: any;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    conversation_id: string;
                    role: string;
                    content: string;
                    sources?: any;
                    created_at?: string;
                };
                Update: {
                    content?: string;
                    sources?: any;
                };
            };
            ai_response_audits: {
                Row: {
                    id: string;
                    user_id: string;
                    conversation_id: string;
                    query: string;
                    response_preview: string;
                    confidence_score: number;
                    confidence_level: string;
                    confidence_reasons: string[];
                    grounding_score: number;
                    is_grounded: boolean;
                    source_count: number;
                    dataset_id: string | null;
                    average_similarity: number | null;
                    model_version: string;
                    prompt_version: string;
                    created_at: string;
                };
                Insert: {
                    user_id: string;
                    conversation_id: string;
                    query: string;
                    response_preview: string;
                    confidence_score?: number;
                    confidence_level?: string;
                    confidence_reasons?: string[];
                    grounding_score?: number;
                    is_grounded?: boolean;
                    source_count?: number;
                    dataset_id?: string | null;
                    average_similarity?: number | null;
                    model_version?: string;
                    prompt_version?: string;
                };
                Update: Record<string, any>;
            };
            datasets: {
                Row: {
                    id: string;
                    user_id: string;
                    file_name: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    file_name: string;
                    created_at?: string;
                };
                Update: {
                    file_name?: string;
                };
            };
            data_points: {
                Row: {
                    id: string;
                    dataset_id: string;
                    metric_name: string;
                    metric_value: number;
                    date_recorded: string;
                    created_at: string;
                };
                Insert: {
                    dataset_id: string;
                    metric_name: string;
                    metric_value: number;
                    date_recorded: string;
                };
                Update: Record<string, any>;
            };
            embeddings: {
                Row: {
                    id: string;
                    user_id: string;
                    content: string;
                    metadata: Record<string, any>;
                    embedding: number[];
                    created_at: string;
                };
                Insert: {
                    user_id: string;
                    content: string;
                    metadata?: Record<string, any>;
                    embedding: number[];
                };
                Update: Record<string, any>;
            };
            embedding_cache: {
                Row: {
                    content_hash: string;
                    content_text: string;
                    embedding: number[];
                    workspace_id: string;
                    last_accessed: string;
                    access_count: number;
                };
                Insert: {
                    content_hash: string;
                    content_text?: string;
                    embedding: number[];
                    workspace_id?: string;
                };
                Update: {
                    last_accessed?: string;
                    access_count?: number;
                };
            };
            data_embeddings: {
                Row: {
                    id: string;
                    user_id: string;
                    dataset_id: string;
                    content: string;
                    content_type: string;
                    embedding: string;
                    metadata: any;
                    created_at: string;
                };
                Insert: {
                    user_id: string;
                    dataset_id?: string;
                    content: string;
                    content_type: string;
                    embedding: string;
                    metadata?: any;
                };
                Update: Record<string, any>;
            };
            predictions_log: {
                Row: {
                    id: string;
                    user_id: string;
                    model_type: string;
                    prediction_result: any;
                    input_features: any;
                    created_at: string;
                };
                Insert: {
                    user_id: string;
                    model_type: string;
                    prediction_result?: any;
                    input_features?: any;
                };
                Update: Record<string, any>;
            };
            // Catch-all for other tables not explicitly typed
            [key: string]: {
                Row: Record<string, any>;
                Insert: Record<string, any>;
                Update: Record<string, any>;
            };
        };
        Views: {
            [key: string]: {
                Row: Record<string, any>;
            };
        };
        Functions: {
            match_embeddings: {
                Args: {
                    query_embedding: number[];
                    match_threshold: number;
                    match_count: number;
                    filter_dataset_id?: string | null;
                    filter_user_id?: string;
                };
                Returns: Array<{
                    id: string;
                    content: string;
                    metadata: Record<string, any>;
                    similarity: number;
                }>;
            };
            increment: {
                Args: { row_id: string };
                Returns: number;
            };
            [key: string]: {
                Args: any;
                Returns: any;
            };
        };
        Enums: {
            [key: string]: any;
        };
    };
}
