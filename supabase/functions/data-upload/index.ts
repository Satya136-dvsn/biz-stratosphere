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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header missing" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { datasets, data_points } = body;

    if (!Array.isArray(datasets) || !Array.isArray(data_points)) {
      return new Response(
        JSON.stringify({ error: "Invalid payload format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic ETL processing - clean and validate data
    const cleanedDatasets = datasets.map(dataset => ({
      ...dataset,
      status: 'processed',
      metadata: {
        ...dataset.metadata,
        processed_at: new Date().toISOString(),
        record_count: data_points.length
      }
    }));

    // Insert datasets first and get the inserted records with IDs
    const { data: insertedDatasets, error: insertError } = await supabase
      .from("datasets")
      .insert(cleanedDatasets)
      .select();

    if (insertError) {
      console.error("Dataset insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to insert datasets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Link data_points to the inserted datasets
    const dataPointsWithDatasetIds = data_points.map((dp, index) => ({
      ...dp,
      dataset_id: insertedDatasets[index]?.id
    }));

    // Insert data_points with dataset relationships
    const { error: dataPointsError } = await supabase
      .from("data_points")
      .insert(dataPointsWithDatasetIds)
      .select();

    if (dataPointsError) {
      console.error("Data points insert error:", dataPointsError);
      return new Response(
        JSON.stringify({ error: "Failed to insert data points" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-trigger ETL processing for each dataset
    for (const dataset of insertedDatasets) {
      try {
        console.log(`Auto-triggering ETL processing for dataset ${dataset.id}`);

        const etlResponse = await supabase.functions.invoke('etl-processor', {
          body: {
            dataset_id: dataset.id,
            auto_trigger: true
          }
        });

        if (etlResponse.error) {
          console.error(`ETL processing failed for dataset ${dataset.id}:`, etlResponse.error);
          // Don't fail the entire upload if ETL fails
        } else {
          console.log(`ETL processing completed for dataset ${dataset.id}:`, etlResponse.data);
        }
      } catch (error) {
        console.error(`Error triggering ETL for dataset ${dataset.id}:`, error);
        // Continue with other datasets even if one fails
      }
    }

    return new Response(
      JSON.stringify({
        message: "Data uploaded and ETL processing initiated successfully",
        datasets_processed: insertedDatasets.length,
        data_points_processed: dataPointsWithDatasetIds.length,
        etl_triggered: true
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Upload function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
