// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Default to 90 days retention if not specified
        const { retentionDays = 90 } = await req.json().catch(() => ({}));

        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - retentionDays);
        const isoThreshold = dateThreshold.toISOString();

        console.log(`Running cleanup for records older than ${isoThreshold} (${retentionDays} days)`);

        const results = {
            automation_logs: 0,
            errors: [] as any[]
        };

        // 1. Clean Automation Logs
        // Note: 'count' option in delete is not always reliable in all client versions, using select first or just assume success if no error
        const { error: logError, count: logCount } = await supabase
            .from('automation_logs')
            .delete({ count: 'exact' })
            .lt('created_at', isoThreshold);

        if (logError) {
            console.error('Error cleaning automation_logs:', logError);
            results.errors.push({ table: 'automation_logs', error: logError });
        } else {
            results.automation_logs = logCount || 0;
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Cleanup completed. Logs deleted: ${results.automation_logs}`,
                details: results
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Retention cleanup failed:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
