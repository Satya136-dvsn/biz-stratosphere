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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ScheduledReport {
    id: string;
    user_id: string;
    name: string;
    report_type: 'kpi_summary' | 'trend_analysis' | 'custom';
    schedule: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    enabled: boolean;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { reportId } = body;

        console.log("📊 Scheduled Reports processor started");

        // If reportId provided, run specific report
        if (reportId) {
            await generateAndSendReport(reportId);
            return new Response(
                JSON.stringify({ message: "Report generated successfully", reportId }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Otherwise, run all due reports
        const { data: reports, error: reportsError } = await supabase
            .from('scheduled_reports')
            .select('*')
            .eq('enabled', true);

        if (reportsError) {
            console.error("Error fetching reports:", reportsError);
            return new Response(
                JSON.stringify({ error: "Failed to fetch scheduled reports" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!reports || reports.length === 0) {
            console.log("No enabled reports found");
            return new Response(
                JSON.stringify({ message: "No enabled reports to process", processed: 0 }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Found ${reports.length} enabled scheduled reports`);

        const results = {
            processed: 0,
            sent: 0,
            failed: 0,
            details: [] as any[]
        };

        // Process each report
        for (const report of reports as ScheduledReport[]) {
            try {
                // Check if report is due
                if (await isReportDue(report)) {
                    console.log(`Generating report: ${report.name} (${report.id})`);
                    results.processed++;

                    await generateAndSendReport(report.id);
                    results.sent++;

                    results.details.push({
                        report_id: report.id,
                        report_name: report.name,
                        status: 'sent'
                    });
                }
            } catch (error) {
                console.error(`Error processing report ${report.id}:`, error);
                results.failed++;

                results.details.push({
                    report_id: report.id,
                    report_name: report.name,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        console.log(`✅ Report processing complete: ${results.sent}/${results.processed} reports sent`);

        return new Response(
            JSON.stringify(results),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Scheduled reports processor error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

/**
 * Check if a report is due to run
 */
async function isReportDue(report: ScheduledReport): Promise<boolean> {
    const now = new Date();

    // If never run or next_run is in the past, it's due
    if (!report.next_run || new Date(report.next_run) <= now) {
        return true;
    }

    return false;
}

/**
 * Generate and send a report
 */
async function generateAndSendReport(reportId: string) {
    // Fetch the report details
    const { data: report, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('id', reportId)
        .single();

    if (error || !report) {
        throw new Error(`Report not found: ${reportId}`);
    }

    console.log(`Generating ${report.report_type} report for user ${report.user_id}`);

    // Generate report data based on type
    const reportData = await generateReportData(report);

    // Update last_run and calculate next_run
    const nextRun = calculateNextRun(report.schedule);
    await supabase
        .from('scheduled_reports')
        .update({
            last_run: new Date().toISOString(),
            next_run: nextRun.toISOString()
        })
        .eq('id', reportId);

    // Send report to recipients
    await sendReportToRecipients(report, reportData);

    console.log(`✅ Report sent to ${report.recipients.length} recipients`);
}

/**
 * Generate report data based on report type
 */
async function generateReportData(report: any) {
    const { user_id, report_type } = report;

    if (report_type === 'kpi_summary') {
        // Fetch KPI data
        const { data: kpiData } = await supabase
            .from('data_points')
            .select('metric_name, metric_value, date_recorded')
            .eq('user_id', user_id)
            .order('date_recorded', { ascending: false })
            .limit(100);

        return {
            type: 'kpi_summary',
            title: 'KPI Summary Report',
            data: kpiData || [],
            generated_at: new Date().toISOString()
        };

    } else if (report_type === 'trend_analysis') {
        // Fetch trend data
        const { data: trendData } = await supabase
            .from('data_points')
            .select('metric_name, metric_value, date_recorded')
            .eq('user_id', user_id)
            .order('date_recorded', { ascending: true })
            .limit(500);

        return {
            type: 'trend_analysis',
            title: 'Trend Analysis Report',
            data: trendData || [],
            generated_at: new Date().toISOString()
        };

    } else {
        // Custom report
        return {
            type: 'custom',
            title: report.name,
            data: [],
            generated_at: new Date().toISOString()
        };
    }
}

/**
 * Calculate next run time based on schedule
 */
function calculateNextRun(schedule: string): Date {
    const now = new Date();

    switch (schedule) {
        case 'daily':
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        case 'weekly':
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        case 'monthly':
            const nextMonth = new Date(now);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            return nextMonth;
        default:
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
}

/**
 * Send report to recipients
 */
async function sendReportToRecipients(report: any, reportData: any) {
    // For now, create notifications
    // In production, you'd send emails via Resend or similar

    for (const recipient of report.recipients) {
        // Create notification
        await supabase
            .from('notifications')
            .insert({
                user_id: report.user_id,
                title: `Scheduled Report: ${report.name}`,
                message: `Your ${report.report_type} report has been generated with ${reportData.data?.length || 0} data points.`,
                type: 'report',
                read: false,
                metadata: {
                    report_id: report.id,
                    report_data: reportData
                }
            });
    }

    // TODO: Send actual emails when email service is configured
    console.log(`Would send email to: ${report.recipients.join(', ')}`);
}
