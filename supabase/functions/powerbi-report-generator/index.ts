import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReportRequest {
  report_type: 'summary' | 'detailed' | 'trend_analysis';
  company_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
  metrics?: string[];
  format?: 'json' | 'csv';
}

interface ReportData {
  id: string;
  company_id: string;
  report_type: string;
  generated_at: string;
  data: any;
  summary: {
    total_records: number;
    date_range: string;
    key_metrics: Record<string, number>;
  };
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

    // Get authenticated user
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

    const requestData = await req.json() as ReportRequest;
    const { report_type, date_range, metrics, format = 'json' } = requestData;

    console.log(`Generating ${report_type} report for company ${profile.company_id}`);

    // Generate report based on type
    let reportData: any = {};
    let summary: any = {};

    const startDate = date_range?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = date_range?.end || new Date().toISOString();

    switch (report_type) {
      case 'summary':
        // Get summary metrics
        const { data: dataPoints } = await supabase
          .from('data_points')
          .select('*')
          .eq('company_id', profile.company_id)
          .gte('date_recorded', startDate)
          .lte('date_recorded', endDate);

        const { data: datasets } = await supabase
          .from('datasets')
          .select('*')
          .eq('company_id', profile.company_id)
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const { data: insights } = await supabase
          .from('ai_insights')
          .select('*')
          .eq('company_id', profile.company_id)
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        reportData = {
          data_points: dataPoints || [],
          datasets: datasets || [],
          insights: insights || []
        };

        summary = {
          total_records: (dataPoints?.length || 0) + (datasets?.length || 0) + (insights?.length || 0),
          date_range: `${startDate.split('T')[0]} to ${endDate.split('T')[0]}`,
          key_metrics: {
            data_points_count: dataPoints?.length || 0,
            datasets_count: datasets?.length || 0,
            insights_count: insights?.length || 0,
            avg_metric_value: dataPoints?.reduce((sum: number, dp: any) => sum + (parseFloat(dp.metric_value) || 0), 0) / (dataPoints?.length || 1) || 0
          }
        };
        break;

      case 'detailed':
        // Get detailed data with all related information
        const { data: detailedData } = await supabase
          .from('data_points')
          .select(`
            *,
            datasets (name, file_type, status)
          `)
          .eq('company_id', profile.company_id)
          .gte('date_recorded', startDate)
          .lte('date_recorded', endDate)
          .order('date_recorded', { ascending: false });

        reportData = detailedData || [];
        summary = {
          total_records: detailedData?.length || 0,
          date_range: `${startDate.split('T')[0]} to ${endDate.split('T')[0]}`,
          key_metrics: {
            unique_metrics: [...new Set(detailedData?.map((dp: any) => dp.metric_name) || [])].length,
            date_range_days: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
          }
        };
        break;

      case 'trend_analysis':
        // Get trend analysis data
        const { data: trendData } = await supabase
          .from('data_points')
          .select('metric_name, metric_value, date_recorded')
          .eq('company_id', profile.company_id)
          .gte('date_recorded', startDate)
          .lte('date_recorded', endDate)
          .order('date_recorded', { ascending: true });

        // Group by metric name and calculate trends
        const groupedData = (trendData || []).reduce((acc: any, dp: any) => {
          if (!acc[dp.metric_name]) {
            acc[dp.metric_name] = [];
          }
          acc[dp.metric_name].push({
            value: parseFloat(dp.metric_value),
            date: dp.date_recorded
          });
          return acc;
        }, {});

        reportData = Object.entries(groupedData).map(([metric, values]: [string, any]) => ({
          metric_name: metric,
          data_points: values,
          trend: values.length > 1 ? 
            (values[values.length - 1].value - values[0].value) / values[0].value * 100 : 0
        }));

        summary = {
          total_records: trendData?.length || 0,
          date_range: `${startDate.split('T')[0]} to ${endDate.split('T')[0]}`,
          key_metrics: {
            metrics_analyzed: Object.keys(groupedData).length,
            avg_trend: reportData.reduce((sum: number, item: any) => sum + item.trend, 0) / reportData.length || 0
          }
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid report type' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    const report: ReportData = {
      id: crypto.randomUUID(),
      company_id: profile.company_id,
      report_type,
      generated_at: new Date().toISOString(),
      data: reportData,
      summary
    };

    console.log(`Report generated: ${report.id}, ${summary.total_records} records`);

    // Return report in requested format
    if (format === 'csv' && Array.isArray(reportData)) {
      // Convert to CSV format
      const csvHeaders = Object.keys(reportData[0] || {}).join(',');
      const csvRows = reportData.map((row: any) => 
        Object.values(row).map((value: any) => 
          typeof value === 'string' ? `"${value}"` : value
        ).join(',')
      );
      const csvContent = [csvHeaders, ...csvRows].join('\n');

      return new Response(csvContent, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${report_type}_report_${Date.now()}.csv"`
        }
      });
    }

    return new Response(
      JSON.stringify(report), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Report generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate report' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});