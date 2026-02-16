// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TriggerRequest {
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    id: string;
    user_id: string;
    status: string;
  };
}

// This function is designed to be called by Supabase Database Webhooks
// or can be called manually to trigger ETL processing
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: TriggerRequest = await req.json();
    const { action, table, record } = body;

    console.log(`ETL trigger received: ${action} on ${table} for record ${record.id}`);

    // Only process INSERT actions on datasets table
    if (action !== 'INSERT' || table !== 'datasets') {
      return new Response(
        JSON.stringify({ message: "Trigger ignored", reason: "Not an INSERT on datasets table" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the dataset has data points to process
    const { data: dataPoints, error: dataError } = await supabase
      .from("data_points")
      .select("id", { count: 'exact' })
      .eq("dataset_id", record.id);

    if (dataError) {
      console.error("Error checking data points:", dataError);
      return new Response(
        JSON.stringify({ error: "Failed to check data points" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only process if there are data points
    if (!dataPoints || dataPoints.length === 0) {
      console.log(`No data points found for dataset ${record.id}, skipping ETL`);
      return new Response(
        JSON.stringify({ message: "No data points to process" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${dataPoints.length} data points, triggering ETL processing`);

    // Call the ETL processor function
    const etlResponse = await supabase.functions.invoke('etl-processor', {
      body: {
        dataset_id: record.id,
        auto_trigger: true
      }
    });

    if (etlResponse.error) {
      console.error("ETL processor error:", etlResponse.error);
      return new Response(
        JSON.stringify({ error: "ETL processing failed", details: etlResponse.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Auto-ETL trigger completed successfully",
        dataset_id: record.id,
        data_points_count: dataPoints.length,
        etl_result: etlResponse.data
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Auto-ETL trigger error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
