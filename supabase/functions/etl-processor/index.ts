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

interface ETLRequest {
  dataset_id: string;
  auto_trigger?: boolean;
}

interface DataPoint {
  id: string;
  dataset_id: string;
  user_id: string;
  company_id?: string;
  metric_name: string;
  metric_value: number;
  metric_type: string;
  date_recorded: string;
  metadata: any;
  created_at: string;
}

interface DatasetInfo {
  id: string;
  name: string;
  file_name: string;
  user_id: string;
  company_id?: string;
  status: string;
  created_at: string;
}

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

    const body: ETLRequest = await req.json();
    const { dataset_id, auto_trigger = false } = body;

    if (!dataset_id) {
      return new Response(
        JSON.stringify({ error: "dataset_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get dataset information
    const { data: dataset, error: datasetError } = await supabase
      .from("datasets")
      .select("*")
      .eq("id", dataset_id)
      .single();

    if (datasetError || !dataset) {
      return new Response(
        JSON.stringify({ error: "Dataset not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user owns the dataset
    if (dataset.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if dataset is already processed
    if (dataset.status === "processed") {
      return new Response(
        JSON.stringify({ message: "Dataset already processed", dataset_id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update dataset status to processing
    const { error: updateError } = await supabase
      .from("datasets")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", dataset_id);

    if (updateError) {
      console.error("Error updating dataset status:", updateError);
    }

    // Get all data points for this dataset
    const { data: dataPoints, error: dataError } = await supabase
      .from("data_points")
      .select("*")
      .eq("dataset_id", dataset_id);

    if (dataError) {
      console.error("Error fetching data points:", dataError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch data points" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!dataPoints || dataPoints.length === 0) {
      return new Response(
        JSON.stringify({ error: "No data points found for dataset" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${dataPoints.length} data points for dataset ${dataset_id}`);

    // Process data points and create cleaned records
    const cleanedRecords = [];

    for (const dataPoint of dataPoints) {
      try {
        // Extract original row data from metadata
        const originalRow = dataPoint.metadata?.original_row;

        if (!originalRow) {
          console.warn(`No original row data found for data point ${dataPoint.id}`);
          continue;
        }

        // Create cleaned record
        const cleanedRecord = {
          original_dataset_id: dataset_id,
          user_id: dataPoint.user_id,
          company_id: dataPoint.company_id,
          metric_name: dataPoint.metric_name,
          metric_value: dataPoint.metric_value,
          metric_type: dataPoint.metric_type,
          date_recorded: dataPoint.date_recorded,
          metadata: dataPoint.metadata,

          // Extract bank churn specific fields
          customer_id: originalRow.customer_id ? parseInt(originalRow.customer_id) : null,
          credit_score: originalRow.credit_score ? parseInt(originalRow.credit_score) : null,
          country: originalRow.country || null,
          gender: originalRow.gender || null,
          age: originalRow.age ? parseInt(originalRow.age) : null,
          tenure: originalRow.tenure ? parseInt(originalRow.tenure) : null,
          balance: originalRow.balance ? parseFloat(originalRow.balance) : null,
          products_number: originalRow.products_number ? parseInt(originalRow.products_number) : null,
          credit_card: originalRow.credit_card ? parseInt(originalRow.credit_card) : null,
          active_member: originalRow.active_member ? parseInt(originalRow.active_member) : null,
          estimated_salary: originalRow.estimated_salary ? parseFloat(originalRow.estimated_salary) : null,
          churn: originalRow.churn ? parseInt(originalRow.churn) : null,

          // Derived features
          balance_salary_ratio: null,
          age_tenure_interaction: null,
          gender_male: originalRow.gender === 'Male' ? 1 : 0,
          country_france: originalRow.country === 'France' ? 1 : 0,
          country_germany: originalRow.country === 'Germany' ? 1 : 0,
          country_spain: originalRow.country === 'Spain' ? 1 : 0,

          // Data quality and timestamps
          data_quality_score: 1.0,
          cleaned_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };

        // Calculate derived features
        if (cleanedRecord.balance && cleanedRecord.estimated_salary) {
          cleanedRecord.balance_salary_ratio = cleanedRecord.balance / (cleanedRecord.estimated_salary + 1);
        }

        if (cleanedRecord.age && cleanedRecord.tenure) {
          cleanedRecord.age_tenure_interaction = cleanedRecord.age * cleanedRecord.tenure;
        }

        // Calculate data quality score (simplified)
        let qualityScore = 1.0;
        const missingFields = [
          cleanedRecord.credit_score, cleanedRecord.age, cleanedRecord.balance,
          cleanedRecord.estimated_salary, cleanedRecord.churn
        ].filter(val => val === null || val === undefined).length;

        qualityScore -= (missingFields * 0.1);
        cleanedRecord.data_quality_score = Math.max(0, qualityScore);

        cleanedRecords.push(cleanedRecord);

      } catch (error) {
        console.error(`Error processing data point ${dataPoint.id}:`, error);
        continue;
      }
    }

    if (cleanedRecords.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid records could be processed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert cleaned records in batches
    const batchSize = 1000;
    let successCount = 0;

    for (let i = 0; i < cleanedRecords.length; i += batchSize) {
      const batch = cleanedRecords.slice(i, i + batchSize);

      const { error: insertError } = await supabase
        .from("cleaned_data_points")
        .insert(batch);

      if (insertError) {
        console.error("Error inserting batch:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to save cleaned data" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      successCount += batch.length;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}, total: ${successCount}/${cleanedRecords.length}`);
    }

    // Update dataset status to processed
    const { error: finalUpdateError } = await supabase
      .from("datasets")
      .update({
        status: "processed",
        updated_at: new Date().toISOString()
      })
      .eq("id", dataset_id);

    if (finalUpdateError) {
      console.error("Error updating final dataset status:", finalUpdateError);
    }

    return new Response(
      JSON.stringify({
        message: "ETL processing completed successfully",
        dataset_id,
        original_records: dataPoints.length,
        cleaned_records: successCount,
        auto_triggered: auto_trigger
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("ETL processor error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
