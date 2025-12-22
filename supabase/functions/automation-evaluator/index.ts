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

                    // C. Send Notification (Stub for email/slack)
                    if (rule.action_type === 'email') {
                        console.log(`[Mock Email] To User ${user_id}: Alert ${name} triggered!`);
                    }

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
