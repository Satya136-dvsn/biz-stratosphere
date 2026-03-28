// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { Resend } from 'resend';
import { createLogger } from './logger';

const log = createLogger('EmailService');

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export interface EmailConfig {
    to: string | string[];
    subject: string;
    body?: string;
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
            log.warn('Resend API key not configured');
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
            log.error('Resend email error', error);
            return { success: false, error: error.message };
        }

        return { success: true, id: data?.id };
    } catch (error: unknown) {
        log.error('Send email attempt failed', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
            log.error('Edge function email failure', error, { userId: params.userId });
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: unknown) {
        log.error('sendLoginConfirmation caught error', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Email templates for automation alerts
 */
export const AUTOMATION_TEMPLATES: Record<string, EmailTemplate> = {
    CHURN_ALERT: {
        name: 'churn_alert',
        subject: 'High Risk Customer Churn Detected',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #d32f2f;">High Churn Risk Warning</h2>
                <p>Hello,</p>
                <p>Biz Stratosphere AI has detected a customer segment with a very high churn probability (>80%).</p>
                <div style="background-color: #ffebee; padding: 15px; border-radius: 4px; border-left: 4px solid #f44336; margin: 20px 0;">
                    <strong>Details:</strong> {{details}}
                </div>
                <p>Please check your <a href="{{action_url}}">Churn Dashboard</a> to take immediate action.</p>
                <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;"/>
                <p style="font-size: 12px; color: #9e9e9e;">This is an automated operational alert from Biz Stratosphere.</p>
            </div>
        `
    },
    REVENUE_ANOMALY: {
        name: 'revenue_anomaly',
        subject: 'Significant Revenue Deviation Detected',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #1976d2;">Revenue Anomaly Detected</h2>
                <p>Hello,</p>
                <p>Biz Stratosphere AI has identified a sharp deviation in your revenue trends compared to model predictions.</p>
                <div style="background-color: #e3f2fd; padding: 15px; border-radius: 4px; border-left: 4px solid #2196f3; margin: 20px 0;">
                    <strong>Deviation:</strong> {{details}}
                </div>
                <p>Visit your <a href="{{action_url}}">Financial Intelligence Center</a> for deeper analysis.</p>
                <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;"/>
                <p style="font-size: 12px; color: #9e9e9e;">This is an automated operational alert from Biz Stratosphere.</p>
            </div>
        `
    }
};

/**
 * Handle automation rule actions (sending emails)
 */
export async function executeAutomationEmail(
    userId: string,
    email: string,
    templateKey: string,
    data: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
    try {
        const template = AUTOMATION_TEMPLATES[templateKey];
        if (!template) {
            throw new Error(`Template not found: ${templateKey}`);
        }

        // Simple template replacement
        let html = template.html;
        Object.keys(data).forEach(key => {
            html = html.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
        });

        return await sendEmail({
            to: email,
            subject: template.subject,
            html,
            from: 'Biz Stratosphere Alerts <alerts@yourdomain.com>'
        });
    } catch (error: unknown) {
        log.error('executeAutomationEmail failed', error, { userId, templateKey });
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
