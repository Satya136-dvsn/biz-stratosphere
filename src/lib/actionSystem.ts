// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { supabase } from './supabase';
import type { AutomationRule } from './automation';

export interface ActionChain {
    id: string;
    rule_id: string;
    sequence_order: number;
    action_type: 'email' | 'webhook' | 'notification' | 'slack' | 'data_update';
    action_config: any;
    condition_type: 'always' | 'on_success' | 'on_failure';
    enabled: boolean;
}

export interface WebhookConfig {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
    body_template?: any;
    timeout_ms?: number;
}

export interface WebhookLog {
    id: string;
    log_id: string;
    rule_id: string;
    url: string;
    method: string;
    headers: any;
    payload: any;
    response_status: number;
    response_body: string;
    error_message?: string;
    duration_ms: number;
    executed_at: string;
}

export interface ActionTemplate {
    id: string;
    name: string;
    description: string;
    action_type: string;
    template_config: any;
    is_public: boolean;
}

/**
 * Execute a webhook action
 */
export async function executeWebhook(
    config: WebhookConfig,
    context: any
): Promise<{ success: boolean; response?: any; error?: string; duration_ms: number }> {
    const startTime = Date.now();

    try {
        // Replace template variables in body
        let body = config.body_template;
        if (typeof body === 'string') {
            body = body.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] || '');
        } else if (typeof body === 'object') {
            body = JSON.parse(
                JSON.stringify(body).replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] || '')
            );
        }

        const response = await fetch(config.url, {
            method: config.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...config.headers,
            },
            body: config.method !== 'GET' ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(config.timeout_ms || 10000),
        });

        const responseBody = await response.text();
        const duration_ms = Date.now() - startTime;

        if (!response.ok) {
            return {
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`,
                duration_ms,
            };
        }

        return {
            success: true,
            response: responseBody,
            duration_ms,
        };
    } catch (error: any) {
        const duration_ms = Date.now() - startTime;
        return {
            success: false,
            error: error.message,
            duration_ms,
        };
    }
}

/**
 * Execute action chain for a rule
 */
export async function executeActionChain(
    ruleId: string,
    logId: string,
    context: any
): Promise<{ success: boolean; results: any[] }> {
    // Get action chains for this rule
    const { data: chains, error } = await supabase
        .from('automation_action_chains')
        .select('*')
        .eq('rule_id', ruleId)
        .eq('enabled', true)
        .order('sequence_order', { ascending: true });

    if (error || !chains) {
        return { success: false, results: [] };
    }

    const results = [];
    let previousSuccess = true;

    for (const chain of chains) {
        // Check if should execute based on condition
        const shouldExecute =
            chain.condition_type === 'always' ||
            (chain.condition_type === 'on_success' && previousSuccess) ||
            (chain.condition_type === 'on_failure' && !previousSuccess);

        if (!shouldExecute) {
            continue;
        }

        // Execute action
        let actionResult;

        switch (chain.action_type) {
            case 'webhook':
                actionResult = await executeWebhook(chain.action_config, context);

                // Log webhook execution
                await supabase.from('automation_webhook_logs').insert({
                    log_id: logId,
                    rule_id: ruleId,
                    url: chain.action_config.url,
                    method: chain.action_config.method || 'POST',
                    headers: chain.action_config.headers,
                    payload: context,
                    response_status: actionResult.success ? 200 : 500,
                    response_body: actionResult.response,
                    error_message: actionResult.error,
                    duration_ms: actionResult.duration_ms,
                });
                break;

            case 'notification':
                // Create in-app notification
                await supabase.from('notifications').insert({
                    user_id: context.userId,
                    title: chain.action_config.title || 'Automation Alert',
                    message: chain.action_config.message || `Rule triggered: ${context.ruleName}`,
                    type: chain.action_config.type || 'info',
                });
                actionResult = { success: true };
                break;

            case 'email':
                // Email will be handled by notification system
                actionResult = { success: true, message: 'Email queued' };
                break;

            default:
                actionResult = { success: false, error: 'Unknown action type' };
        }

        results.push({
            action_type: chain.action_type,
            sequence: chain.sequence_order,
            success: actionResult.success,
            result: actionResult,
        });

        previousSuccess = actionResult.success;
    }

    return {
        success: results.every((r) => r.success),
        results,
    };
}

/**
 * Get action templates
 */
export async function getActionTemplates(): Promise<ActionTemplate[]> {
    const { data, error } = await supabase
        .from('automation_action_templates')
        .select('*')
        .eq('is_public', true);

    if (error) {
        console.error('Error fetching templates:', error);
        return [];
    }

    return data || [];
}

/**
 * Validate webhook configuration
 */
export async function validateWebhookConfig(
    config: WebhookConfig
): Promise<{ valid: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('validate_webhook_config', {
        p_config: config,
    });

    if (error || !data || data.length === 0) {
        return { valid: false, error: 'Validation failed' };
    }

    return {
        valid: data[0].is_valid,
        error: data[0].error_message,
    };
}
