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
                    name: string;
                    file_name: string;
                    file_type: string;
                    file_size: number;
                    status: string;
                    metadata: Record<string, Json | undefined> | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    name: string;
                    file_name: string;
                    file_type?: string;
                    file_size?: number;
                    status?: string;
                    metadata?: Record<string, Json | undefined> | null;
                    created_at?: string;
                };
                Update: {
                    name?: string;
                    file_name?: string;
                    file_type?: string;
                    file_size?: number;
                    status?: string;
                    metadata?: Record<string, Json | undefined> | null;
                };
            };
            data_points: {
                Row: {
                    id: string;
                    user_id: string;
                    dataset_id: string;
                    metric_name: string;
                    metric_value: number;
                    date_recorded: string;
                    metadata: Record<string, Json | undefined> | null;
                    created_at: string;
                };
                Insert: {
                    user_id: string;
                    dataset_id: string;
                    metric_name: string;
                    metric_value: number;
                    date_recorded: string;
                    metadata?: Record<string, Json | undefined> | null;
                };
                Update: {
                    user_id?: string;
                    dataset_id?: string;
                    metric_name?: string;
                    metric_value?: number;
                    date_recorded?: string;
                    metadata?: Record<string, Json | undefined> | null;
                };
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
            get_admin_users_v2: {
                Args: {
                    page: number;
                    page_size: number;
                    search_query?: string;
                };
                Returns: Array<{
                    id: string;
                    email: string;
                    full_name: string;
                    role: string;
                    suspended: boolean;
                    created_at: string;
                    last_sign_in: string | null;
                    dataset_count: number;
                }>;
            };
            admin_update_role: {
                Args: {
                    target_user_id: string;
                    new_role: string;
                };
                Returns: null;
            };
            admin_toggle_suspend: {
                Args: {
                    target_user_id: string;
                    suspend: boolean;
                };
                Returns: null;
            };
            increment: {
                Args: { row_id: string };
                Returns: number;
            };
        };
        Enums: {
            [key: string]: any;
        };
    };
}
