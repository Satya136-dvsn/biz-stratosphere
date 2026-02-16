// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface PowerBIDataRequest {
  table: string;
  company_id?: string;
  date_from?: string;
  date_to?: string;
  filters?: Record<string, any>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key for Power BI access
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate API key against company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('settings->powerbi_api_key', apiKey)
      .single();

    if (companyError || !company) {
      console.error('Invalid API key:', companyError);
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { table, date_from, date_to, filters } = await req.json() as PowerBIDataRequest;
    
    if (!table) {
      return new Response(
        JSON.stringify({ error: 'Table parameter required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let query = supabase.from(table).select('*');

    // Add company filter for multi-tenant data
    if (table !== 'companies') {
      query = query.eq('company_id', company.id);
    }

    // Apply date filters if provided
    if (date_from && table === 'data_points') {
      query = query.gte('date_recorded', date_from);
    }
    if (date_to && table === 'data_points') {
      query = query.lte('date_recorded', date_to);
    }

    // Apply additional filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Limit results for performance
    query = query.limit(10000);

    const { data, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      return new Response(
        JSON.stringify({ error: 'Database query failed' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Format data for Power BI consumption
    const formattedData = {
      table: table,
      company: company.name,
      timestamp: new Date().toISOString(),
      count: data?.length || 0,
      data: data || []
    };

    console.log(`Power BI data request for ${table}: ${data?.length || 0} records`);

    return new Response(
      JSON.stringify(formattedData), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Power BI data endpoint error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});