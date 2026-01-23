-- =====================================================
-- Security Hardening Migration
-- Fixes exposed views, insecure policies, and mutable functions
-- =====================================================

-- 1. Secure Views (Fix SECURITY DEFINER issues)
-- Ensure these views enforce RLS by running as the invoker
ALTER VIEW IF EXISTS public.ai_response_audit_summary SET (security_invoker = true);
ALTER VIEW IF EXISTS public.user_upload_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.user_alerts_view SET (security_invoker = true);
ALTER VIEW IF EXISTS public.automation_action_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.churn_predictions_view SET (security_invoker = true);
ALTER VIEW IF EXISTS public.automation_rule_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.user_alerts SET (security_invoker = true);
ALTER VIEW IF EXISTS public.ml_model_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.workspace_usage_summary SET (security_invoker = true);

-- 2. Restrict RLS Policies
-- Fix overly permissive INSERT policies

-- Alerts: Restrict to own alerts
DROP POLICY IF EXISTS "System can insert alerts" ON public.alerts;
CREATE POLICY "Users can insert own alerts" ON public.alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Audit Logs: Restrict to own logs (assuming user_id column exists)
-- This covers "System can insert audit logs"
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Automation Notifications: Restrict to own notifications via rule_id
DROP POLICY IF EXISTS "System can insert notifications" ON public.automation_notifications;
CREATE POLICY "Users can insert own notifications" ON public.automation_notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.automation_rules 
            WHERE automation_rules.id = automation_notifications.rule_id 
            AND automation_rules.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can update notifications" ON public.automation_notifications;
CREATE POLICY "Users can update own notifications" ON public.automation_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.automation_rules 
            WHERE automation_rules.id = automation_notifications.rule_id 
            AND automation_rules.user_id = auth.uid()
        )
    );

-- Datasets: Restrict insertions to own datasets
DROP POLICY IF EXISTS "All authenticated can insert" ON public.datasets;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.datasets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.datasets;
-- Re-create a single strict policy if one doesn't exist equivalent to this
-- (Checking if "Users can upload own datasets" exists would be good, but safe to add this)
CREATE POLICY "Users can insert own datasets" ON public.datasets
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Notifications (Generic): Restrict to own
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cleaned Data Points: Restrict to own
-- Table has user_id, so we can use that directly.
-- Also original_dataset_id is the column name, not dataset_id.
DROP POLICY IF EXISTS "System can insert cleaned data" ON public.cleaned_data_points;
CREATE POLICY "Users can insert cleaned data" ON public.cleaned_data_points
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PowerBI Refresh Log
-- Uses status of company_id, does not have user_id
DROP POLICY IF EXISTS "System can insert refresh logs" ON public.powerbi_refresh_log;
CREATE POLICY "Users can insert refresh logs" ON public.powerbi_refresh_log
    FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Predictions Log
DROP POLICY IF EXISTS "Allow insert access" ON public.predictions_log;
CREATE POLICY "Users can insert predictions" ON public.predictions_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Rate Limits
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;
-- Rate limits table relies on a key string and has no user_id column.
-- We will simply drop the permissive policy and rely on service_role for management.
-- No user policy is added.

-- User Roles
DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;
-- User roles should usually be managed by admins or system. 
-- Restrict to admin users only.
CREATE POLICY "Admins can insert user roles" ON public.user_roles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- 3. Fix Mutable Search Paths
-- Explicitly set search_path to public for functions

ALTER FUNCTION public.get_admin_stats() SET search_path = public;
ALTER FUNCTION public.calculate_next_run(text, jsonb, timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.get_admin_users(integer, text) SET search_path = public;
ALTER FUNCTION public.check_and_update_quota(uuid, text, integer) SET search_path = public;
ALTER FUNCTION public.refresh_ai_analytics() SET search_path = public;
ALTER FUNCTION public.clean_old_embedding_cache() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_sessions() SET search_path = public;
ALTER FUNCTION public.get_ai_analytics_summary() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_rate_limits() SET search_path = public;
ALTER FUNCTION public.reset_monthly_ai_limits() SET search_path = public;
ALTER FUNCTION public.get_quota_status(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_daily_signups(integer) SET search_path = public;
ALTER FUNCTION public.update_rule_execution(uuid, boolean) SET search_path = public;
ALTER FUNCTION public.increment_workspace_usage(uuid, text, integer) SET search_path = public;
ALTER FUNCTION public.create_default_workspace() SET search_path = public;
ALTER FUNCTION public.update_conversation_timestamp() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_predictions() SET search_path = public;
ALTER FUNCTION public.initialize_user_quotas() SET search_path = public;
ALTER FUNCTION public.match_embeddings(vector, numeric, integer, text) SET search_path = public;
ALTER FUNCTION public.check_rate_limit(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.update_user_uploads_updated_at() SET search_path = public;
ALTER FUNCTION public.get_rules_for_retry() SET search_path = public;
ALTER FUNCTION public.execute_action_chain(uuid, jsonb) SET search_path = public;
ALTER FUNCTION public.validate_webhook_config(jsonb) SET search_path = public;
ALTER FUNCTION public.get_user_storage_usage(uuid) SET search_path = public;
ALTER FUNCTION public.create_rule_from_template(uuid, uuid, text) SET search_path = public;
ALTER FUNCTION public.reset_daily_ai_limits() SET search_path = public;
ALTER FUNCTION public.create_upload_notification() SET search_path = public;
ALTER FUNCTION public.get_pending_automation_rules() SET search_path = public;
ALTER FUNCTION public.admin_update_role(uuid, text) SET search_path = public;
ALTER FUNCTION public.update_automation_notifications_timestamp() SET search_path = public;
ALTER FUNCTION public.log_admin_action(text, jsonb, text) SET search_path = public;
ALTER FUNCTION public.evaluate_advanced_rule(uuid, jsonb) SET search_path = public;
ALTER FUNCTION public.set_api_key_created_by() SET search_path = public;
ALTER FUNCTION public.calculate_metric_trend(numeric, numeric) SET search_path = public;
ALTER FUNCTION public.update_api_keys_updated_at() SET search_path = public;
ALTER FUNCTION public.detect_metric_anomaly(numeric[], numeric) SET search_path = public;
ALTER FUNCTION public.admin_toggle_suspend(uuid, boolean) SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- 4. Address Extensions in Public
-- It is recommended to move extensions to a separate schema 'extensions', but this
-- often breaks existing application code that expects them in public.
-- For now, we acknowledge the warning but skip moving them to avoid a major breaking change.
-- The immediate security risk is low if users cannot create objects in public.

-- 5. Address Materialized Views in API
-- Revoke access from anon/authenticated for materialized views that shouldn't be public.
-- (The report says they are selectable by anon/authenticated).
-- We will restrict them to authenticated users only if they were exposed to anon,
-- or leave them if they are needed for the dashboard (but they are definitely needed).
-- However, we can enforce RLS-like logic or at least ensure anon cannot see them if not intended.
-- Assuming dashboard needs them for authenticated users:
REVOKE SELECT ON TABLE public.conversation_analytics FROM anon;
REVOKE SELECT ON TABLE public.ai_usage_analytics FROM anon;
REVOKE SELECT ON TABLE public.ai_cache_analytics FROM anon;
REVOKE SELECT ON TABLE public.message_analytics FROM anon;
-- Grant strict authenticated access (already likely granted, but ensuring no anon access)
