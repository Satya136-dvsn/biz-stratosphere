// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PowerBIRefreshRequest {
  dataset_id: string;
  workspace_id?: string;
  company_id?: string;
}

interface RefreshStatus {
  refresh_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // This function can be called via cron or manually
    const isScheduledCall = req.headers.get('x-scheduled') === 'true';
    
    if (isScheduledCall) {
      console.log('Scheduled Power BI refresh initiated');
      
      // Get all companies with Power BI integration enabled
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .not('settings->powerbi_workspace_id', 'is', null)
        .not('settings->powerbi_access_token', 'is', null);

      if (!companies || companies.length === 0) {
        console.log('No companies with Power BI integration found');
        return new Response(
          JSON.stringify({ message: 'No Power BI integrations to refresh' }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const refreshResults = [];

      for (const company of companies) {
        try {
          const refreshResult = await refreshPowerBIDataset(company);
          refreshResults.push({
            company_id: company.id,
            company_name: company.name,
            ...refreshResult
          });
        } catch (error) {
          console.error(`Failed to refresh Power BI for company ${company.id}:`, error);
          refreshResults.push({
            company_id: company.id,
            company_name: company.name,
            status: 'failed',
            error: error.message
          });
        }
      }

      return new Response(
        JSON.stringify({ 
          message: 'Scheduled refresh completed',
          results: refreshResults 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Manual refresh request
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }), 
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authorization' }), 
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Get user's company
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) {
        return new Response(
          JSON.stringify({ error: 'User not associated with a company' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      if (!company) {
        return new Response(
          JSON.stringify({ error: 'Company not found' }), 
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const refreshResult = await refreshPowerBIDataset(company);

      return new Response(
        JSON.stringify(refreshResult), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Power BI refresh error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to refresh Power BI dataset' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function refreshPowerBIDataset(company: any): Promise<RefreshStatus> {
  const workspaceId = company.settings?.powerbi_workspace_id;
  const datasetId = company.settings?.powerbi_dataset_id;
  const accessToken = company.settings?.powerbi_access_token;

  if (!workspaceId || !datasetId || !accessToken) {
    throw new Error('Missing Power BI configuration');
  }

  const refreshId = crypto.randomUUID();
  const startTime = new Date().toISOString();

  try {
    console.log(`Starting Power BI refresh for company ${company.name} (${company.id})`);

    // Call Power BI REST API to refresh dataset
    const powerBIUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/refreshes`;
    
    const response = await fetch(powerBIUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notifyOption: 'MailOnFailure'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Power BI API error: ${response.status} - ${errorText}`);
    }

    console.log(`Power BI refresh initiated successfully for company ${company.name}`);

    // Log the refresh attempt
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase
      .from('api_usage')
      .insert({
        company_id: company.id,
        endpoint: '/powerbi-refresh',
        method: 'POST',
        status_code: 200,
        user_agent: 'PowerBI-Scheduler',
        ip_address: '127.0.0.1'
      });

    return {
      refresh_id: refreshId,
      status: 'completed',
      started_at: startTime,
      completed_at: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Power BI refresh failed for company ${company.name}:`, error);
    
    return {
      refresh_id: refreshId,
      status: 'failed',
      started_at: startTime,
      completed_at: new Date().toISOString(),
      error_message: error.message
    };
  }
}