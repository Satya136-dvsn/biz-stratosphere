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
