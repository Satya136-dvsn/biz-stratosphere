import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

/* 
  Automation Evaluator Edge Function 
  
  Logic:
  1. Fetch enabled automation rules from 'automation_rules'
  2. For each rule:
     a. Fetch relevant data (latest data point or aggregated metric)
     b. Evaluate condition (>, <, =, etc.)
     c. If met, trigger action (log, email stub)
     d. Update 'last_triggered' and insert log entry
*/

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 2. Fetch Active Rules
        const { data: rules, error: rulesError } = await supabase
            .from('automation_rules')
            .select('*')
            .eq('enabled', true);

        if (rulesError) throw rulesError;

        const results = [];

        // 3. Evaluate Each Rule
        for (const rule of rules) {
            try {
                const { condition, user_id, id: rule_id, name } = rule;

                let currentValue = 0;
                let evalError = null;

                // Determine value based on aggregation type
                if (condition.aggregation && condition.aggregation !== 'none') {
                    // Aggregation Query
                    // We need to use rpc or raw query for aggregations in Supabase JS usually, 
                    // but for simplicity in this edge function we might fetch a range and aggregate in JS 
                    // (assuming data volume isn't massive for this MVP check)
                    // OR use a specific RPC if we had one.
                    // Let's implement JS aggregation for the "latest N records" or "last X days"

                    // Default limit to 100 for aggregation safety if not specified
                    const limit = condition.limit || 100;

                    const { data: points, error: aggError } = await supabase
                        .from('data_points')
                        .select('*')
                        .eq('user_id', user_id)
                        .order('date_recorded', { ascending: false })
                        .limit(limit);

                    if (aggError) {
                        evalError = aggError.message;
                    } else if (points && points.length > 0) {
                        const values = points.map((p: any) => p[condition.metric] || 0);

                        switch (condition.aggregation) {
                            case 'sum': currentValue = values.reduce((a: number, b: number) => a + b, 0); break;
                            case 'avg': currentValue = values.reduce((a: number, b: number) => a + b, 0) / values.length; break;
                            case 'min': currentValue = Math.min(...values); break;
                            case 'max': currentValue = Math.max(...values); break;
                            case 'count': currentValue = values.length; break;
                            default: currentValue = values[0];
                        }
                    }
                } else {
                    // Default: Latest Value
                    const { data: latestData, error: dataError } = await supabase
                        .from('data_points')
                        .select('*')
                        .eq('user_id', user_id)
                        .order('date_recorded', { ascending: false })
                        .limit(1)
                        .single();

                    if (dataError && dataError.code !== 'PGRST116') {
                        evalError = dataError.message;
                    } else if (latestData && condition) {
                        currentValue = latestData[condition.metric] || 0;
                    }
                }

                // Evaluate Threshold
                let triggered = false;
                if (!evalError) {
                    const threshold = condition.threshold;
                    switch (condition.operator) {
                        case '>': triggered = currentValue > threshold; break;
                        case '<': triggered = currentValue < threshold; break;
                        case '=': triggered = currentValue === threshold; break;
                        case '>=': triggered = currentValue >= threshold; break;
                        case '<=': triggered = currentValue <= threshold; break;
                    }
                }

                // 4. Execute Action if Triggered
                if (triggered) {
                    // A. Log Trigger
                    const { error: logError } = await supabase
                        .from('automation_logs')
                        .insert({
                            rule_id,
                            user_id,
                            status: 'success',
                            condition_result: { matched: true, currentValue, threshold: condition.threshold },
                            action_result: { type: rule.action_type, sent: true },
                            message: `Triggered: ${name} (${Number(currentValue)} ${condition.operator} ${condition.threshold})`
                        });

                    // B. Update Last Triggered
                    await supabase
                        .from('automation_rules')
                        .update({ last_triggered: new Date().toISOString() })
                        .eq('id', rule_id);

                    // C. Send Notification
                    await sendNotification(supabase, rule, {
                        userId: user_id,
                        ruleName: name,
                        value: currentValue,
                        threshold: condition.threshold,
                        operator: condition.operator
                    });

                    results.push({ rule_id, triggered: true, value: currentValue });
                } else {
                    results.push({ rule_id, triggered: false, value: currentValue, error: evalError });
                }

            } catch (innerErr) {
                console.error(`Error processing rule ${rule.id}:`, innerErr);
                results.push({ rule_id: rule.id, error: innerErr.message });
            }
        }

        return new Response(JSON.stringify({ success: true, processed: rules.length, results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});

async function sendNotification(supabase: any, rule: any, context: any) {
    const { action_type, action_config } = rule;
    const message = `Alert: ${context.ruleName} triggered! Value ${context.value} ${context.operator} ${context.threshold}`;

    try {
        switch (action_type) {
            case 'email':
                // Call the email-sender edge function
                const emailTo = action_config?.email || 'admin@example.com';
                try {
                    const { data: emailResult, error: emailError } = await supabase.functions.invoke('email-sender', {
                        body: {
                            to: emailTo,
                            template: 'threshold_alert',
                            templateVars: {
                                rule_name: context.ruleName,
                                metric: context.metric || 'Value',
                                current_value: context.value,
                                operator: context.operator,
                                threshold: context.threshold,
                                triggered_at: new Date().toISOString(),
                            }
                        }
                    });

                    if (emailError) {
                        console.warn(`[Email] Failed to send to ${emailTo}:`, emailError);
                        // Fallback to in-app notification
                        await supabase.from('notifications').insert({
                            user_id: context.userId,
                            title: `Email Alert Failed: ${context.ruleName}`,
                            message: `${message} (Email to ${emailTo} failed - check email configuration)`,
                            type: 'alert'
                        });
                    } else {
                        console.log(`[Email] Successfully sent to ${emailTo}:`, emailResult?.id);
                    }
                } catch (emailCatchError) {
                    console.error(`[Email] Error calling email-sender:`, emailCatchError);
                }
                break;

            case 'slack':
                if (action_config?.webhook_url) {
                    await fetch(action_config.webhook_url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: message })
                    });
                }
                break;

            case 'in_app':
            default:
                await supabase.from('notifications').insert({
                    user_id: context.userId,
                    title: `Automation Alert: ${context.ruleName}`,
                    message: message,
                    type: 'alert'
                });
                break;
        }
    } catch (err) {
        console.error(`Failed to send ${action_type} notification:`, err);
    }
}
