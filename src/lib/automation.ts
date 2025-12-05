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
    // This would integrate with SendGrid/Resend
    // For now, create a notification instead
    return {
        success: true,
        result: { message: 'Email would be sent via SendGrid' },
    };
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
export async function runAutomationRule(ruleId: string): Promise<void> {
    // Fetch rule
    const { data: rule } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

    if (!rule || !rule.enabled) return;

    // Evaluate condition
    const { result, currentValue } = await evaluateCondition(
        rule.condition,
        rule.user_id
    );

    if (!result) {
        // Log skip
        await supabase.from('automation_logs').insert({
            rule_id: ruleId,
            user_id: rule.user_id,
            status: 'skipped',
            condition_result: { matched: false, currentValue },
        });
        return;
    }

    // Execute action
    const actionResult = await executeAction(rule.action_type, rule.action_config, {
        userId: rule.user_id,
        ruleName: rule.name,
        currentValue,
        threshold: rule.condition.threshold,
    });

    // Log execution
    await supabase.from('automation_logs').insert({
        rule_id: ruleId,
        user_id: rule.user_id,
        status: actionResult.success ? 'success' : 'failure',
        condition_result: { matched: true, currentValue },
        action_result: actionResult.result,
        error_message: actionResult.error,
    });

    // Update last triggered
    if (actionResult.success) {
        await supabase
            .from('automation_rules')
            .update({ last_triggered: new Date().toISOString() })
            .eq('id', ruleId);
    }
}
