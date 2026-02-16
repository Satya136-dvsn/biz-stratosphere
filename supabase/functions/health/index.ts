// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

/* 
  Health Check Edge Function
  Returns status of core services:
  - Database (connectable)
  - Edge Functions (itself)
  - External APIs (optional)
*/

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const start = performance.now();
    const checks: Record<string, any> = {
        uptime: true,
        timestamp: new Date().toISOString(),
    };

    try {
        // 1. Check Database connection
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data, error } = await supabase.from('automation_rules').select('count').limit(1).single();

        // PGRST116 is "The result contains 0 rows" which is fine for connection check, 
        // but .single() expects exactly 1. .limit(1) might return 0 rows if empty.
        // If table exists, we are good.
        const dbOk = !error || error.code === 'PGRST116';

        checks.database = {
            status: dbOk ? 'healthy' : 'degraded',
            latency_ms: performance.now() - start,
            error: dbOk ? null : error.message
        };

        // 2. Check Storage (Optional, check if bucket exists)
        // const { data: buckets } = await supabase.storage.listBuckets();
        // checks.storage = { status: buckets ? 'healthy' : 'unknown' };

        const status = checks.database.status === 'healthy' ? 200 : 503;

        return new Response(JSON.stringify(checks), {
            status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err) {
        return new Response(JSON.stringify({
            status: 'critical_failure',
            error: err.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
