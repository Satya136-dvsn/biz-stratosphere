// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export interface EmailConfig {
    to: string | string[];
    subject: string;
    body: string;
    html?: string;
    from?: string;
}

export interface EmailTemplate {
    name: string;
    subject: string;
    html: string;
}

/**
 * Send email using Resend
 */
export async function sendEmail(
    config: EmailConfig
): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        if (!import.meta.env.VITE_RESEND_API_KEY) {
            console.warn('Resend API key not configured');
            return {
                success: false,
                error: 'Email service not configured. Please set VITE_RESEND_API_KEY environment variable.'
            };
        }

        const { data, error } = await resend.emails.send({
            from: config.from || 'Biz Stratosphere <noreply@yourdomain.com>',
            to: Array.isArray(config.to) ? config.to : [config.to],
            subject: config.subject,
            html: config.html || `<p>${config.body}</p>`,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, id: data?.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Send login confirmation via Supabase Edge Function
 */
export async function sendLoginConfirmation(params: {
    userId: string;
    email: string;
    name: string;
    ipAddress: string;
    device: string;
    browser: string;
    resetUrl: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const { supabase } = await import('./supabaseClient');
        
        const { data, error } = await supabase.functions.invoke('email-sender', {
            body: {
                userId: params.userId,
                to: params.email,
                template: 'login_confirmation',
                templateVars: {
                    name: params.name,
                    timestamp: new Date().toLocaleString(),
                    ip_address: params.ipAddress,
                    device: params.device,
                    browser: params.browser,
                    reset_url: params.resetUrl
                }
            }
        });

        if (error) {
            console.error('Failed to send login confirmation:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error in sendLoginConfirmation:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Email templates for automation alerts
 */
export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
    threshold_alert: {
        name: 'Threshold Alert',
        subject: '🚨 Alert: {{rule_name}} Triggered',
        html: `
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
              <p style="margin: 10px 0 0 0; opacity: 0.9;">{{rule_name}}</p>
            </div>
            <div class="content">
              <p>Your automation rule has been triggered based on the following condition:</p>
              
              <div class="metric-card">
                <h3 style="margin-top: 0;">Metric Details</h3>
                <p><strong>Metric:</strong> {{metric}}</p>
                <p><strong>Current Value:</strong> <span class="metric-value">{{current_value}}</span></p>
                <p><strong>Threshold:</strong> {{operator}} {{threshold}}</p>
                <p><strong>Triggered At:</strong> {{triggered_at}}</p>
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

    trend_alert: {
        name: 'Trend Alert',
        subject: '📈 Trend Detected: {{rule_name}}',
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .trend-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5576c; }
            .trend-percentage { font-size: 28px; font-weight: bold; color: #f5576c; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📊 Trend Alert</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">{{rule_name}}</p>
            </div>
            <div class="content">
              <p>A significant trend has been detected in your metrics:</p>
              
              <div class="trend-card">
                <h3 style="margin-top: 0;">Trend Analysis</h3>
                <p><strong>Metric:</strong> {{metric}}</p>
                <p><strong>Direction:</strong> {{trend_direction}}</p>
                <p><strong>Change:</strong> <span class="trend-percentage">{{trend_percentage}}%</span></p>
                <p><strong>Period:</strong> Last {{period_days}} days</p>
                <p><strong>Detected At:</strong> {{detected_at}}</p>
              </div>

              <p>This trend analysis was performed automatically based on your configured rules.</p>
            </div>
            <div class="footer">
              <p>Biz Stratosphere - Advanced Analytics & Automation</p>
            </div>
          </div>
        </body>
      </html>
    `,
    },

    anomaly_alert: {
        name: 'Anomaly Alert',
        subject: '⚠️ Anomaly Detected: {{rule_name}}',
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .anomaly-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fa709a; }
            .deviation { font-size: 24px; font-weight: bold; color: #fa709a; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🚨 Anomaly Detected</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">{{rule_name}}</p>
            </div>
            <div class="content">
              <div class="warning">
                <strong>⚠️ Unusual Activity Detected</strong>
                <p style="margin: 5px 0 0 0;">An anomaly has been detected in your metrics that significantly deviates from normal patterns.</p>
              </div>
              
              <div class="anomaly-card">
                <h3 style="margin-top: 0;">Anomaly Details</h3>
                <p><strong>Metric:</strong> {{metric}}</p>
                <p><strong>Current Value:</strong> {{current_value}}</p>
                <p><strong>Average (30-day):</strong> {{avg_value}}</p>
                <p><strong>Deviation:</strong> <span class="deviation">{{deviation_score}}σ</span></p>
                <p><strong>Detected At:</strong> {{detected_at}}</p>
              </div>

              <p>This anomaly was detected using statistical analysis comparing current values against historical patterns.</p>
              <p><strong>Recommended Action:</strong> Review your data to understand the cause of this unusual activity.</p>
            </div>
            <div class="footer">
              <p>Biz Stratosphere - Intelligent Monitoring & Alerts</p>
            </div>
          </div>
        </body>
      </html>
    `,
    },

    login_confirmation: {
        name: 'Login Confirmation',
        subject: '🔐 Security Alert: New Login to Biz Stratosphere',
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a1f36; background-color: #f7fafc; margin: 0; padding: 0; }
            .wrapper { background-color: #f7fafc; padding: 40px 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 40px 30px; text-align: center; }
            .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.025em; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: #111827; }
            .security-notice { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
            .details-grid { background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 30px; }
            .detail-item { font-size: 14px; color: #4b5563; margin-bottom: 8px; }
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
                <div class="greeting">Hello, {{name}}!</div>
                <p>We detected a new login to your Biz Stratosphere account. Please review the details below to ensure it was you.</p>
                
                <div class="details-grid">
                  <div class="detail-item"><span class="detail-label">Time:</span> {{timestamp}}</div>
                  <div class="detail-item"><span class="detail-label">IP Address:</span> {{ip_address}}</div>
                  <div class="detail-item"><span class="detail-label">Device:</span> {{device}}</div>
                  <div class="detail-item"><span class="detail-label">Browser:</span> {{browser}}</div>
                </div>

                <div class="security-notice">
                  <strong style="color: #92400e; display: block; margin-bottom: 5px;">Is this you?</strong>
                  If this was you, you can safely ignore this email. No further action is required.
                </div>

                <div class="unauthorized">
                  <strong>Didn't recognize this activity?</strong><br>
                  If you don't recognize this login, your account may be compromised. Please click the button below to secure your account immediately.
                  <br>
                  <a href="{{reset_url}}" class="action-btn">Secure My Account</a>
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

/**
 * Replace template variables in HTML
 */
function replaceTemplateVars(template: string, vars: Record<string, any>): string {
    let result = template;
    Object.entries(vars).forEach(([key, value]) => {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    });
    return result;
}

/**
 * Send automation alert email
 */
export async function sendAutomationAlert(
    templateName: keyof typeof EMAIL_TEMPLATES,
    to: string | string[],
    variables: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
    const template = EMAIL_TEMPLATES[templateName];

    if (!template) {
        return { success: false, error: 'Template not found' };
    }

    const subject = replaceTemplateVars(template.subject, variables);
    const html = replaceTemplateVars(template.html, variables);

    return await sendEmail({
        to,
        subject,
        body: '', // HTML takes precedence
        html,
    });
}

/**
 * Test email configuration
 */
export async function testEmailConfig(to: string): Promise<{ success: boolean; error?: string }> {
    return await sendEmail({
        to,
        subject: 'Biz Stratosphere - Email Test',
        body: 'This is a test email from your Biz Stratosphere automation system.',
        html: `
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
    });
}
