// Email Sender Edge Function for Biz Stratosphere
// Sends emails via Resend API for automation alerts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email templates
const EMAIL_TEMPLATES: Record<string, { subject: string; html: (vars: Record<string, any>) => string }> = {
    threshold_alert: {
        subject: '🚨 Alert: {{rule_name}} Triggered',
        html: (vars) => `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .metric-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .metric-value { font-size: 32px; font-weight: bold; color: #667eea; }
                    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0;">⚠️ Automation Alert</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">${vars.rule_name}</p>
                    </div>
                    <div class="content">
                        <p>Your automation rule has been triggered based on the following condition:</p>
                        
                        <div class="metric-card">
                            <h3 style="margin-top: 0;">Metric Details</h3>
                            <p><strong>Metric:</strong> ${vars.metric}</p>
                            <p><strong>Current Value:</strong> <span class="metric-value">${vars.current_value}</span></p>
                            <p><strong>Threshold:</strong> ${vars.operator} ${vars.threshold}</p>
                            <p><strong>Triggered At:</strong> ${vars.triggered_at}</p>
                        </div>

                        <p>This automation was configured to notify you when this condition is met.</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from Biz Stratosphere Automation System</p>
                        <p>To manage your automation rules, visit your dashboard</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    },
    anomaly_alert: {
        subject: '⚠️ Anomaly Detected: {{rule_name}}',
        html: (vars) => `
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>🚨 Anomaly Detected</h2>
                <p><strong>Rule:</strong> ${vars.rule_name}</p>
                <p><strong>Metric:</strong> ${vars.metric}</p>
                <p><strong>Current Value:</strong> ${vars.current_value}</p>
                <p><strong>Detected At:</strong> ${vars.triggered_at}</p>
                <hr>
                <p style="color: #6b7280; font-size: 12px;">Biz Stratosphere - Business Intelligence Platform</p>
            </body>
            </html>
        `,
    },
    test: {
        subject: 'Biz Stratosphere - Email Test',
        html: () => `
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>✅ Email Configuration Test</h2>
                <p>This is a test email from your Biz Stratosphere automation system.</p>
                <p>If you received this email, your email configuration is working correctly!</p>
                <hr>
                <p style="color: #6b7280; font-size: 12px;">Biz Stratosphere - Business Intelligence Platform</p>
            </body>
            </html>
        `,
    },
};

function replaceTemplateVars(template: string, vars: Record<string, any>): string {
    let result = template;
    Object.entries(vars).forEach(([key, value]) => {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    });
    return result;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

        if (!RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not configured - email will be logged only');
            return new Response(JSON.stringify({
                success: false,
                error: 'Email service not configured. Please set RESEND_API_KEY in Supabase secrets.',
                logged: true
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const { to, template, templateVars, subject: customSubject, html: customHtml } = await req.json();

        if (!to) {
            return new Response(JSON.stringify({ success: false, error: 'Missing "to" field' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        let subject: string;
        let html: string;

        if (template && EMAIL_TEMPLATES[template]) {
            const tmpl = EMAIL_TEMPLATES[template];
            subject = replaceTemplateVars(tmpl.subject, templateVars || {});
            html = tmpl.html(templateVars || {});
        } else if (customSubject && customHtml) {
            subject = customSubject;
            html = customHtml;
        } else {
            return new Response(JSON.stringify({
                success: false,
                error: 'Either "template" with "templateVars" or "subject" with "html" is required'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Send email via Resend API
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Biz Stratosphere <noreply@biz-stratosphere.com>',
                to: Array.isArray(to) ? to : [to],
                subject,
                html,
            }),
        });

        const resendData = await resendResponse.json();

        if (!resendResponse.ok) {
            console.error('Resend API error:', resendData);
            return new Response(JSON.stringify({
                success: false,
                error: resendData.message || 'Failed to send email',
                details: resendData
            }), {
                status: resendResponse.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log('Email sent successfully:', resendData.id);
        return new Response(JSON.stringify({
            success: true,
            id: resendData.id,
            to: Array.isArray(to) ? to : [to]
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err) {
        console.error('Email sender error:', err);
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
