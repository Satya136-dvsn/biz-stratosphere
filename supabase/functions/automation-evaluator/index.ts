import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AutomationRule {
    id: string;
    user_id: string;
    name: string;
    trigger_type: 'threshold' | 'schedule' | 'data_change';
    condition: any;
    action_type: 'email' | 'webhook' | 'notification';
    action_config: any;
    enabled: boolean;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log("🤖 Automation Evaluator started");

        // Fetch all enabled automation rules
        const { data: rules, error: rulesError } = await supabase
            .from('automation_rules')
            .select('*')
            .eq('enabled', true);

        if (rulesError) {
            console.error("Error fetching rules:", rulesError);
            return new Response(
                JSON.stringify({ error: "Failed to fetch automation rules" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!rules || rules.length === 0) {
            console.log("No enabled rules found");
            return new Response(
                JSON.stringify({ message: "No enabled rules to evaluate", evaluated: 0 }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Found ${rules.length} enabled automation rules`);

        const results = {
            evaluated: 0,
            triggered: 0,
            failed: 0,
            details: [] as any[]
        };

        // Evaluate each rule
        for (const rule of rules as AutomationRule[]) {
            try {
                console.log(`Evaluating rule: ${rule.name} (${rule.id})`);
                results.evaluated++;

                const triggered = await evaluateRule(rule);

                if (triggered) {
                    results.triggered++;
                    console.log(`✅ Rule triggered: ${rule.name}`);

                    // Execute the action
                    await executeAction(rule);

                    // Update last_triggered timestamp
                    await supabase
                        .from('automation_rules')
                        .update({ last_triggered: new Date().toISOString() })
                        .eq('id', rule.id);

                    // Log the trigger
                    await supabase
                        .from('automation_logs')
                        .insert({
                            rule_id: rule.id,
                            user_id: rule.user_id,
                            status: 'success',
                            executed_at: new Date().toISOString(),
                            details: { message: `Rule "${rule.name}" triggered successfully` }
                        });

                    results.details.push({
                        rule_id: rule.id,
                        rule_name: rule.name,
                        status: 'triggered'
                    });
                } else {
                    results.details.push({
                        rule_id: rule.id,
                        rule_name: rule.name,
                        status: 'not_triggered'
                    });
                }

            } catch (error) {
                console.error(`Error evaluating rule ${rule.id}:`, error);
                results.failed++;

                // Log the failure
                await supabase
                    .from('automation_logs')
                    .insert({
                        rule_id: rule.id,
                        user_id: rule.user_id,
                        status: 'error',
                        executed_at: new Date().toISOString(),
                        details: { error: error instanceof Error ? error.message : 'Unknown error' }
                    });

                results.details.push({
                    rule_id: rule.id,
                    rule_name: rule.name,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        console.log(`✅ Automation evaluation complete: ${results.triggered}/${results.evaluated} rules triggered`);

        return new Response(
            JSON.stringify(results),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Automation evaluator error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

/**
 * Evaluate if a rule's condition is met
 */
async function evaluateRule(rule: AutomationRule): Promise<boolean> {
    if (rule.trigger_type === 'threshold') {
        return await evaluateThresholdCondition(rule);
    } else if (rule.trigger_type === 'schedule') {
        return evaluateScheduleCondition(rule);
    } else if (rule.trigger_type === 'data_change') {
        return await evaluateDataChangeCondition(rule);
    }

    return false;
}

/**
 * Evaluate threshold-based conditions
 */
async function evaluateThresholdCondition(rule: AutomationRule): Promise<boolean> {
    const { metric, operator, threshold } = rule.condition;

    // Fetch the latest value for the metric
    const { data, error } = await supabase
        .from('data_points')
        .select('metric_value')
        .eq('metric_name', metric)
        .eq('user_id', rule.user_id)
        .order('date_recorded', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !data) {
        console.log(`No data found for metric: ${metric}`);
        return false;
    }

    const currentValue = data.metric_value;
    console.log(`Metric ${metric}: ${currentValue} ${operator} ${threshold}`);

    // Evaluate the condition
    switch (operator) {
        case '>':
            return currentValue > threshold;
        case '<':
            return currentValue < threshold;
        case '=':
            return currentValue === threshold;
        case '>=':
            return currentValue >= threshold;
        case '<=':
            return currentValue <= threshold;
        default:
            return false;
    }
}

/**
 * Evaluate schedule-based conditions
 */
function evaluateScheduleCondition(rule: AutomationRule): boolean {
    // For schedule-based rules, check if it's time to trigger
    // This is a simple implementation - just trigger on every evaluation
    // In production, you'd check the schedule config
    return true;
}

/**
 * Evaluate data change conditions
 */
async function evaluateDataChangeCondition(rule: AutomationRule): Promise<boolean> {
    // Check if new data was uploaded recently (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('datasets')
        .select('id')
        .eq('user_id', rule.user_id)
        .gte('created_at', fiveMinutesAgo)
        .limit(1);

    return !error && data && data.length > 0;
}

/**
 * Execute the rule's action
 */
async function executeAction(rule: AutomationRule) {
    console.log(`Executing action: ${rule.action_type} for rule: ${rule.name}`);

    if (rule.action_type === 'notification') {
        // Create in-app notification
        const message = rule.action_config.message || `Alert: Rule "${rule.name}" was triggered`;

        await supabase
            .from('notifications')
            .insert({
                user_id: rule.user_id,
                title: `Automation Alert: ${rule.name}`,
                message: message,
                type: 'automation',
                read: false
            });

        console.log(`Notification created for user ${rule.user_id}`);

    } else if (rule.action_type === 'email') {
        // TODO: Implement email sending via Resend or similar service
        console.log(`Email action not yet implemented for rule: ${rule.name}`);

    } else if (rule.action_type === 'webhook') {
        // TODO: Implement webhook calling
        console.log(`Webhook action not yet implemented for rule: ${rule.name}`);
    }
}
