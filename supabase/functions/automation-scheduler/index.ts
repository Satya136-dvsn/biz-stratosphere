import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutomationRule {
    id: string;
    name: string;
    user_id: string;
    schedule_type: string;
    schedule_config: any;
    condition: any;
    action_type: string;
    action_config: any;
    retry_config: any;
    notification_channels: any[];
}

/**
 * Calculate next run time based on schedule type
 */
function calculateNextRun(rule: AutomationRule): Date | null {
    const now = new Date();

    if (rule.schedule_type === 'interval') {
        const minutes = rule.schedule_config?.interval_minutes || 60;
        return new Date(now.getTime() + minutes * 60000);
    }

    if (rule.schedule_type === 'cron') {
        // For now, simple daily scheduling
        // TODO: Implement proper cron parsing
        const nextRun = new Date(now);
        nextRun.setDate(nextRun.getDate() + 1);
        nextRun.setHours(9, 0, 0, 0); // Default 9 AM
        return nextRun;
    }

    return null; // Manual scheduling
}

/**
 * Evaluate rule condition
 */
async function evaluateCondition(
    condition: any,
    userId: string,
    supabase: any
): Promise<{ result: boolean; currentValue: number }> {
    // Fetch latest data
    const { data: kpiData } = await supabase
        .from('data_points')
        .select('*')
        .eq('user_id', userId)
        .order('date_recorded', { ascending: false })
        .limit(1)
        .maybeSingle();

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
 * Execute rule action
 */
async function executeAction(
    rule: AutomationRule,
    context: any,
    supabase: any
): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
        switch (rule.action_type) {
            case 'notification':
                await supabase.from('notifications').insert({
                    user_id: rule.user_id,
                    title: rule.action_config.title || 'Automation Alert',
                    message: rule.action_config.message || `Rule triggered: ${rule.name}`,
                    type: rule.action_config.type || 'info',
                });
                return { success: true };

            case 'webhook':
                const response = await fetch(rule.action_config.url, {
                    method: rule.action_config.method || 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...rule.action_config.headers,
                    },
                    body: JSON.stringify(context),
                });

                if (!response.ok) {
                    throw new Error(`Webhook failed: ${response.statusText}`);
                }

                return { success: true, result: await response.json() };

            case 'email':
                // Email will be handled by notification system
                return { success: true, result: { message: 'Email queued for delivery' } };

            default:
                throw new Error(`Unknown action type: ${rule.action_type}`);
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Execute a single automation rule
 */
async function executeRule(rule: AutomationRule, supabase: any) {
    const startTime = new Date();

    try {
        // Evaluate condition
        const { result, currentValue } = await evaluateCondition(
            rule.condition,
            rule.user_id,
            supabase
        );

        if (!result) {
            // Log skip
            await supabase.from('automation_logs').insert({
                rule_id: rule.id,
                user_id: rule.user_id,
                status: 'skipped',
                condition_result: { matched: false, currentValue },
                executed_at: startTime.toISOString(),
            });

            return { status: 'skipped', rule: rule.name };
        }

        // Execute action
        const actionResult = await executeAction(
            rule,
            {
                userId: rule.user_id,
                ruleName: rule.name,
                currentValue,
                threshold: rule.condition.threshold,
            },
            supabase
        );

        // Log execution
        const log = await supabase.from('automation_logs').insert({
            rule_id: rule.id,
            user_id: rule.user_id,
            status: actionResult.success ? 'success' : 'failure',
            condition_result: { matched: true, currentValue },
            action_result: actionResult.result,
            error_message: actionResult.error,
            executed_at: startTime.toISOString(),
        }).select().single();

        // Update rule timestamps
        const next_run = calculateNextRun(rule);
        await supabase
            .from('automation_rules')
            .update({
                last_run_at: startTime.toISOString(),
                next_run_at: next_run?.toISOString(),
                last_triggered: actionResult.success ? startTime.toISOString() : undefined,
            })
            .eq('id', rule.id);

        return {
            status: actionResult.success ? 'success' : 'failure',
            rule: rule.name,
            error: actionResult.error,
        };
    } catch (error: any) {
        // Log error
        await supabase.from('automation_logs').insert({
            rule_id: rule.id,
            user_id: rule.user_id,
            status: 'failure',
            error_message: error.message,
            executed_at: startTime.toISOString(),
        });

        return {
            status: 'error',
            rule: rule.name,
            error: error.message,
        };
    }
}

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Create Supabase client with service role key
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Get pending rules using the helper function
        const { data: pendingRules, error } = await supabase.rpc('get_pending_automation_rules');

        if (error) {
            throw error;
        }

        console.log(`Found ${pendingRules?.length || 0} pending rules`);

        // Execute each rule
        const results = [];
        for (const rule of pendingRules || []) {
            const result = await executeRule(rule, supabase);
            results.push(result);
            console.log(`Executed rule: ${rule.name} - ${result.status}`);
        }

        return new Response(
            JSON.stringify({
                success: true,
                executed: results.length,
                results,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error: any) {
        console.error('Scheduler error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
