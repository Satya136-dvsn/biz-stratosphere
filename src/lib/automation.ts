// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { supabase } from '@/integrations/supabase/client';

export interface AutomationRule {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    enabled: boolean;
    trigger_type: 'threshold' | 'schedule' | 'data_change';
    condition: any;
    action_type: 'email' | 'webhook' | 'notification';
    action_config: any;
    last_triggered?: string;
    // Production schedule fields
    schedule_type?: 'manual' | 'cron' | 'interval';
    schedule_config?: ScheduleConfig;
    last_run_at?: string;
    next_run_at?: string;
    retry_config?: RetryConfig;
    notification_channels?: NotificationChannel[];
}

export interface ScheduleConfig {
    cron?: string; // Cron expression for 'cron' type
    interval_minutes?: number; // Interval in minutes for 'interval' type
}

export interface RetryConfig {
    max_retries: number;
    retry_delay_seconds: number;
}

export interface NotificationChannel {
    type: 'email' | 'webhook' | 'slack' | 'in_app';
    recipient: string;
    config?: any;
}

// Advanced trigger types
export interface AdvancedConfig {
    type?: 'simple' | 'composite' | 'trend' | 'anomaly';
    // Composite config
    operator?: 'AND' | 'OR';
    conditions?: RuleCondition[];
    // Trend config
    trend_direction?: 'increasing' | 'decreasing';
    threshold_pct?: number;
    period_days?: number;
    // Anomaly config
    std_dev_multiplier?: number;
}

export interface TrendAnalysis {
    avg_value: number;
    min_value: number;
    max_value: number;
    std_dev: number;
    trend_direction: 'increasing' | 'decreasing' | 'stable';
    trend_percentage: number;
}

export interface AnomalyDetection {
    is_anomaly: boolean;
    avg_value: number;
    std_dev: number;
    deviation_score: number;
}

export interface RuleCondition {
    metric: string; // 'revenue', 'customers', 'churn_rate', etc.
    operator: '>' | '<' | '=' | '>=' | '<=';
    threshold: number;
}

export interface EmailAction {
    recipients: string[];
    subject: string;
    template: string;
}

export interface WebhookAction {
    url: string;
    method: 'POST' | 'GET';
    headers?: Record<string, string>;
}

/**
 * Evaluate a rule condition against current data
 */
export async function evaluateCondition(
    condition: RuleCondition,
    userId: string
): Promise<{ result: boolean; currentValue: number }> {
    // Fetch current metric value
    const { data: kpiData } = await supabase
        .from('data_points')
        .select('*')
        .eq('user_id', userId)
        .order('date_recorded', { ascending: false })
        .limit(1)
        .single();

    if (!kpiData) {
        return { result: false, currentValue: 0 };
    }

    const currentValue = kpiData[condition.metric] || 0;
    let result = false;

    switch (condition.operator) {
        case '>':
            result = currentValue > condition.threshold;
            break;
        case '<':
            result = currentValue < condition.threshold;
            break;
        case '=':
            result = currentValue === condition.threshold;
            break;
        case '>=':
            result = currentValue >= condition.threshold;
            break;
        case '<=':
            result = currentValue <= condition.threshold;
            break;
    }

    return { result, currentValue };
}

/**
 * Execute automation rule action
 */
export async function executeAction(
    actionType: string,
    actionConfig: any,
    context: any
): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
        switch (actionType) {
            case 'email':
                return await sendEmail(actionConfig, context);
            case 'webhook':
                return await callWebhook(actionConfig, context);
            case 'notification':
                return await createNotification(actionConfig, context);
            default:
                throw new Error(`Unknown action type: ${actionType}`);
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}

async function sendEmail(
    config: EmailAction,
    context: any
): Promise<{ success: boolean; result?: any }> {
    // Call the email-sender edge function
    const { data, error } = await supabase.functions.invoke('email-sender', {
        body: {
            to: config.recipients,
            template: 'threshold_alert',
            templateVars: {
                rule_name: context.ruleName,
                metric: context.metric || 'Metric',
                current_value: context.currentValue,
                operator: context.operator,
                threshold: context.threshold,
                triggered_at: new Date().toISOString(),
            }
        }
    });

    if (error) {
        console.warn('Email send failed, falling back to notification:', error);
        // Fallback to in-app notification
        await createNotification({
            title: 'Email Alert (delivery failed)',
            message: `${context.ruleName} triggered - email delivery failed`
        }, context);
        return { success: false, result: { fallback: 'notification' } };
    }

    return { success: true, result: data };
}

async function callWebhook(
    config: WebhookAction,
    context: any
): Promise<{ success: boolean; result?: any }> {
    const response = await fetch(config.url, {
        method: config.method,
        headers: {
            'Content-Type': 'application/json',
            ...config.headers,
        },
        body: JSON.stringify(context),
    });

    if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: true, result };
}

async function createNotification(
    config: any,
    context: any
): Promise<{ success: boolean; result?: any }> {
    const { error } = await supabase.from('notifications').insert({
        user_id: context.userId,
        title: config.title || 'Automation Alert',
        message: config.message || `Rule triggered: ${context.ruleName}`,
        type: config.type || 'info',
    });

    if (error) throw error;

    return { success: true };
}

/**
 * Run automation rule
 */
/**
 * Run automation rule via Edge Function
 */
export async function runAutomationRule(ruleId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('automation-evaluator', {
        body: { ruleId }
    });

    if (error) {
        console.error('Failed to invoke automation-evaluator:', error);
        throw error;
    }

    if (!data.success) {
        console.error('Automation evaluator returned failure:', data);
        throw new Error(data.error || 'Automation evaluation failed');
    }
}
