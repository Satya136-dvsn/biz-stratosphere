// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

// Email Sender Edge Function for Biz Stratosphere
// Sends emails via Resend API for automation alerts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { checkRateLimit } from "../_shared/rate-limiter.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email templates
const EMAIL_TEMPLATES: Record<string, { subject: (vars: Record<string, any>) => string; html: (vars: Record<string, any>) => string }> = {
    threshold_alert: {
        subject: (vars) => `🚨 Alert: ${vars.rule_name} Triggered`,
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
        subject: (vars) => `⚠️ Anomaly Detected: ${vars.rule_name}`,
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
        subject: () => 'Biz Stratosphere - Email Test',
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
    login_confirmation: {
        subject: () => '🔐 Security Alert: New Login to Biz Stratosphere',
        html: (vars) => `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a1f36; background-color: #f7fafc; margin: 0; padding: 0; }
                    .wrapper { background-color: #f7fafc; padding: 40px 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
                    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 40px 30px; text-align: center; }
                    .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.025em; margin-bottom: 10px; }
                    .content { padding: 40px 30px; }
                    .greeting { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: #111827; }
                    .security-notice { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
                    .details-grid { display: grid; grid-template-columns: 1fr; gap: 12px; background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 30px; }
                    .detail-item { font-size: 14px; color: #4b5563; }
                    .detail-label { font-weight: 600; color: #1f2937; width: 100px; display: inline-block; }
                    .action-btn { display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 10px; }
                    .footer { text-align: center; padding: 30px; color: #9ca3af; font-size: 13px; }
                    .unauthorized { margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="header">
                            <div class="logo">BIZ STRATOSPHERE</div>
                            <h1 style="margin: 0; font-size: 22px; opacity: 0.9;">Security Notification</h1>
                        </div>
                        <div class="content">
                            <div class="greeting">Hello, ${vars.name}!</div>
                            <p>We detected a new login to your Biz Stratosphere account. Please review the details below to ensure it was you.</p>
                            
                            <div class="details-grid">
                                <div class="detail-item"><span class="detail-label">Time:</span> ${vars.timestamp}</div>
                                <div class="detail-item"><span class="detail-label">IP Address:</span> ${vars.ip_address}</div>
                                <div class="detail-item"><span class="detail-label">Device:</span> ${vars.device}</div>
                                <div class="detail-item"><span class="detail-label">Browser:</span> ${vars.browser}</div>
                            </div>

                            <div class="security-notice">
                                <strong style="color: #92400e; display: block; margin-bottom: 5px;">Is this you?</strong>
                                If this was you, you can safely ignore this email. No further action is required.
                            </div>

                            <div class="unauthorized">
                                <strong>Didn't recognize this activity?</strong><br>
                                If you don't recognize this login, your account may be compromised. Please click the button below to secure your account immediately.
                                <br>
                                <a href="${vars.reset_url}" class="action-btn">Secure My Account</a>
                            </div>
                        </div>
                        <div class="footer">
                            <p>© 2026 Biz Stratosphere. All rights reserved.</p>
                            <p>This is an automated security notification. For your protection, we send these whenever a login occurs from a new device or location.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
    },
};



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

        const { to, template, templateVars, subject: customSubject, html: customHtml, userId } = await req.json();

        // Apply rate limiting if userId is provided
        if (userId) {
            const rateLimit = await checkRateLimit(req, 'email-sender', userId);
            if (!rateLimit.allowed) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Rate limit exceeded. Please try again later.',
                    retryAfter: new Date(rateLimit.resetTime).toISOString()
                }), {
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        if (!to) {
            return new Response(JSON.stringify({ success: false, error: 'Missing "to" field' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        let subject = customSubject;
        let html = customHtml;

        if (template && EMAIL_TEMPLATES[template]) {
            const tpl = EMAIL_TEMPLATES[template];
            subject = tpl.subject(templateVars || {});
            html = tpl.html(templateVars || {});
        }

        if (!subject || !html) {
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
