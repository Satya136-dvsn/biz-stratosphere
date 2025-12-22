
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

        // Get user from Auth header manually or trust the body payload for admin purpose (better to use auth context)
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const userId = user.id;
        console.log(`Exporting data for user: ${userId}`);

        // Fetch user data from various tables
        const [profile, rules, logs] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', userId).single(),
            supabase.from('automation_rules').select('*').eq('user_id', userId),
            supabase.from('automation_logs').select('*').eq('user_id', userId).limit(1000) // cap size
        ]);

        const exportData = {
            generated_at: new Date().toISOString(),
            user_id: userId,
            profile: profile.data,
            automation_rules: rules.data,
            recent_logs: logs.data,
            compliance_note: "This export contains personal data associated with your account."
        };

        return new Response(
            JSON.stringify(exportData, null, 2),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="gdpr_export_${userId}.json"`
                }
            }
        )

    } catch (error) {
        console.error('GDPR export failed:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
