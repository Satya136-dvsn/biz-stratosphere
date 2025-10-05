-- ================================================================
-- Power BI SQL Queries for Supabase PostgreSQL
-- AI-Powered Business Intelligence Platform
-- ================================================================

-- ================================================================
-- DASHBOARD 1: REVENUE & KPI DASHBOARD
-- ================================================================

-- Query 1.1: Main Revenue Data with Company and Dataset Info
-- Use this as the primary data source for Revenue Dashboard
-- ================================================================
SELECT 
    dp.id,
    dp.date_recorded,
    dp.metric_name,
    dp.metric_value,
    dp.metric_type,
    dp.company_id,
    dp.dataset_id,
    dp.user_id,
    dp.created_at,
    c.name as company_name,
    c.subscription_tier,
    ds.name as dataset_name,
    ds.file_type,
    ds.status as dataset_status,
    ds.file_size,
    p.display_name as user_display_name,
    p.role as user_role
FROM data_points dp
LEFT JOIN companies c ON dp.company_id = c.id
LEFT JOIN datasets ds ON dp.dataset_id = ds.id
LEFT JOIN profiles p ON dp.user_id = p.user_id
WHERE dp.date_recorded >= CURRENT_DATE - INTERVAL '24 months'
ORDER BY dp.date_recorded DESC;

-- Query 1.2: Revenue Aggregations by Month
-- Use for monthly trend analysis
-- ================================================================
SELECT 
    DATE_TRUNC('month', dp.date_recorded) as month,
    dp.company_id,
    c.name as company_name,
    COUNT(DISTINCT dp.dataset_id) as dataset_count,
    COUNT(*) as data_point_count,
    SUM(dp.metric_value) as total_value,
    AVG(dp.metric_value) as avg_value,
    MIN(dp.metric_value) as min_value,
    MAX(dp.metric_value) as max_value,
    STDDEV(dp.metric_value) as stddev_value
FROM data_points dp
LEFT JOIN companies c ON dp.company_id = c.id
WHERE dp.date_recorded >= CURRENT_DATE - INTERVAL '24 months'
GROUP BY DATE_TRUNC('month', dp.date_recorded), dp.company_id, c.name
ORDER BY month DESC;

-- Query 1.3: Dataset Performance Summary
-- Use for dataset ranking table
-- ================================================================
SELECT 
    ds.id,
    ds.name as dataset_name,
    ds.file_type,
    ds.status,
    ds.file_size,
    ds.created_at,
    c.name as company_name,
    COUNT(dp.id) as data_point_count,
    SUM(dp.metric_value) as total_value,
    AVG(dp.metric_value) as avg_value,
    MAX(dp.date_recorded) as last_data_date
FROM datasets ds
LEFT JOIN data_points dp ON ds.id = dp.dataset_id
LEFT JOIN companies c ON ds.company_id = c.id
WHERE ds.status = 'processed'
GROUP BY ds.id, ds.name, ds.file_type, ds.status, ds.file_size, ds.created_at, c.name
ORDER BY total_value DESC;

-- Query 1.4: Daily Revenue Metrics
-- Use for daily granularity analysis
-- ================================================================
SELECT 
    DATE(dp.date_recorded) as date,
    dp.company_id,
    c.name as company_name,
    SUM(dp.metric_value) as daily_revenue,
    COUNT(DISTINCT dp.dataset_id) as active_datasets,
    COUNT(*) as transaction_count,
    AVG(dp.metric_value) as avg_transaction_value
FROM data_points dp
LEFT JOIN companies c ON dp.company_id = c.id
WHERE dp.date_recorded >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE(dp.date_recorded), dp.company_id, c.name
ORDER BY date DESC;

-- ================================================================
-- DASHBOARD 2: CHURN ANALYSIS DASHBOARD
-- ================================================================

-- Query 2.1: Comprehensive Churn Predictions View
-- Main data source for churn dashboard
-- ================================================================
SELECT 
    cp.customer_id,
    cp.churn_probability,
    cp.predicted_churn,
    cp.actual_churn,
    cp.contract_type,
    cp.tenure,
    cp.monthly_charges,
    cp.prediction_time,
    -- Risk Level Classification
    CASE 
        WHEN cp.churn_probability >= 0.7 THEN 'High Risk'
        WHEN cp.churn_probability >= 0.4 THEN 'Medium Risk'
        ELSE 'Low Risk'
    END as risk_level,
    -- Revenue Impact
    cp.monthly_charges * 12 as annual_value,
    CASE 
        WHEN cp.churn_probability >= 0.7 THEN cp.monthly_charges * 12
        ELSE 0
    END as revenue_at_risk,
    -- Prediction Match
    CASE 
        WHEN cp.predicted_churn = cp.actual_churn THEN 'Correct'
        WHEN cp.actual_churn IS NULL THEN 'Pending'
        ELSE 'Incorrect'
    END as prediction_accuracy
FROM churn_predictions_view cp
WHERE cp.prediction_time >= CURRENT_DATE - INTERVAL '6 months'
ORDER BY cp.churn_probability DESC;

-- Query 2.2: Churn Predictions with ML Log Data
-- Detailed prediction history
-- ================================================================
SELECT 
    pl.customer_id,
    pl.predicted_probability,
    pl.predicted_label,
    pl.actual_outcome,
    pl.confidence_score,
    pl.model_version,
    pl.prediction_time,
    pl.company_id,
    c.name as company_name,
    pl.input_features,
    -- Extract key features from JSON
    (pl.input_features->>'tenure')::numeric as tenure,
    (pl.input_features->>'monthly_charges')::numeric as monthly_charges,
    (pl.input_features->>'contract_type')::text as contract_type,
    -- Calculate days since prediction
    CURRENT_DATE - DATE(pl.prediction_time) as days_since_prediction
FROM predictions_log pl
LEFT JOIN companies c ON pl.company_id = c.id
WHERE pl.prediction_type = 'churn'
  AND pl.prediction_time >= CURRENT_DATE - INTERVAL '12 months'
ORDER BY pl.prediction_time DESC;

-- Query 2.3: Churn Risk Aggregations
-- Summary statistics by risk level
-- ================================================================
SELECT 
    CASE 
        WHEN cd.monthly_charges * 
             (SELECT AVG(predicted_probability) 
              FROM predictions_log 
              WHERE customer_id = cd.customer_id 
                AND prediction_type = 'churn') >= 0.7 THEN 'High Risk'
        WHEN cd.monthly_charges * 
             (SELECT AVG(predicted_probability) 
              FROM predictions_log 
              WHERE customer_id = cd.customer_id 
                AND prediction_type = 'churn') >= 0.4 THEN 'Medium Risk'
        ELSE 'Low Risk'
    END as risk_level,
    cd.contract_type,
    COUNT(DISTINCT cd.customer_id) as customer_count,
    AVG(cd.monthly_charges) as avg_monthly_charges,
    SUM(cd.monthly_charges * 12) as total_annual_value,
    AVG(cd.tenure) as avg_tenure,
    COUNT(CASE WHEN cd.label = true THEN 1 END) as actual_churned,
    CAST(COUNT(CASE WHEN cd.label = true THEN 1 END) AS DECIMAL) / 
        NULLIF(COUNT(DISTINCT cd.customer_id), 0) * 100 as actual_churn_rate
FROM churn_data cd
WHERE cd.created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY risk_level, cd.contract_type
ORDER BY total_annual_value DESC;

-- Query 2.4: Churn Factors Analysis
-- Analysis of churn drivers
-- ================================================================
SELECT 
    cd.contract_type,
    cd.internet_service,
    cd.payment_method,
    cd.senior_citizen,
    COUNT(*) as customer_count,
    AVG(CASE WHEN cd.label THEN 1 ELSE 0 END) as churn_rate,
    AVG(cd.monthly_charges) as avg_monthly_charges,
    AVG(cd.tenure) as avg_tenure,
    SUM(cd.total_charges) as total_revenue
FROM churn_data cd
WHERE cd.created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY cd.contract_type, cd.internet_service, cd.payment_method, cd.senior_citizen
ORDER BY churn_rate DESC;

-- ================================================================
-- DASHBOARD 3: ML MODEL PERFORMANCE DASHBOARD
-- ================================================================

-- Query 3.1: Model Performance Metrics
-- Main data source for ML performance dashboard
-- ================================================================
SELECT 
    pl.id,
    pl.prediction_type,
    pl.predicted_probability,
    pl.predicted_label,
    pl.actual_outcome,
    pl.confidence_score,
    pl.model_version,
    pl.prediction_time,
    pl.company_id,
    c.name as company_name,
    pl.customer_id,
    -- Accuracy calculation
    CASE 
        WHEN pl.actual_outcome IS NULL THEN NULL
        WHEN pl.predicted_label = pl.actual_outcome THEN true
        ELSE false
    END as is_correct,
    -- Confusion matrix components
    CASE 
        WHEN pl.predicted_label = true AND pl.actual_outcome = true THEN 'True Positive'
        WHEN pl.predicted_label = true AND pl.actual_outcome = false THEN 'False Positive'
        WHEN pl.predicted_label = false AND pl.actual_outcome = false THEN 'True Negative'
        WHEN pl.predicted_label = false AND pl.actual_outcome = true THEN 'False Negative'
        ELSE 'Unknown'
    END as prediction_category,
    -- Time groupings
    DATE_TRUNC('day', pl.prediction_time) as prediction_date,
    DATE_TRUNC('week', pl.prediction_time) as prediction_week,
    DATE_TRUNC('month', pl.prediction_time) as prediction_month
FROM predictions_log pl
LEFT JOIN companies c ON pl.company_id = c.id
WHERE pl.prediction_time >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY pl.prediction_time DESC;

-- Query 3.2: Model Accuracy Over Time
-- Track model performance trends
-- ================================================================
SELECT 
    DATE_TRUNC('week', pl.prediction_time) as week,
    pl.model_version,
    pl.prediction_type,
    COUNT(*) as total_predictions,
    COUNT(CASE WHEN pl.actual_outcome IS NOT NULL THEN 1 END) as predictions_with_actuals,
    COUNT(CASE WHEN pl.predicted_label = pl.actual_outcome THEN 1 END) as correct_predictions,
    CAST(COUNT(CASE WHEN pl.predicted_label = pl.actual_outcome THEN 1 END) AS DECIMAL) / 
        NULLIF(COUNT(CASE WHEN pl.actual_outcome IS NOT NULL THEN 1 END), 0) as accuracy,
    AVG(pl.confidence_score) as avg_confidence,
    AVG(pl.predicted_probability) as avg_predicted_probability
FROM predictions_log pl
WHERE pl.prediction_time >= CURRENT_DATE - INTERVAL '90 days'
  AND pl.actual_outcome IS NOT NULL
GROUP BY DATE_TRUNC('week', pl.prediction_time), pl.model_version, pl.prediction_type
ORDER BY week DESC;

-- Query 3.3: Confusion Matrix Data
-- For confusion matrix visualization
-- ================================================================
SELECT 
    pl.model_version,
    COUNT(CASE WHEN pl.predicted_label = true AND pl.actual_outcome = true THEN 1 END) as true_positive,
    COUNT(CASE WHEN pl.predicted_label = true AND pl.actual_outcome = false THEN 1 END) as false_positive,
    COUNT(CASE WHEN pl.predicted_label = false AND pl.actual_outcome = true THEN 1 END) as false_negative,
    COUNT(CASE WHEN pl.predicted_label = false AND pl.actual_outcome = false THEN 1 END) as true_negative,
    -- Calculate metrics
    CAST(COUNT(CASE WHEN pl.predicted_label = true AND pl.actual_outcome = true THEN 1 END) AS DECIMAL) /
        NULLIF(COUNT(CASE WHEN pl.predicted_label = true AND pl.actual_outcome = true THEN 1 END) + 
               COUNT(CASE WHEN pl.predicted_label = true AND pl.actual_outcome = false THEN 1 END), 0) as precision,
    CAST(COUNT(CASE WHEN pl.predicted_label = true AND pl.actual_outcome = true THEN 1 END) AS DECIMAL) /
        NULLIF(COUNT(CASE WHEN pl.predicted_label = true AND pl.actual_outcome = true THEN 1 END) + 
               COUNT(CASE WHEN pl.predicted_label = false AND pl.actual_outcome = true THEN 1 END), 0) as recall
FROM predictions_log pl
WHERE pl.prediction_time >= CURRENT_DATE - INTERVAL '90 days'
  AND pl.actual_outcome IS NOT NULL
GROUP BY pl.model_version;

-- Query 3.4: API Usage Analytics
-- Track API performance and usage
-- ================================================================
SELECT 
    au.endpoint,
    au.method,
    au.company_id,
    c.name as company_name,
    DATE(au.created_at) as date,
    COUNT(*) as call_count,
    AVG(au.response_time_ms) as avg_response_time,
    MIN(au.response_time_ms) as min_response_time,
    MAX(au.response_time_ms) as max_response_time,
    COUNT(CASE WHEN au.status_code = 200 THEN 1 END) as success_count,
    COUNT(CASE WHEN au.status_code >= 400 THEN 1 END) as error_count,
    CAST(COUNT(CASE WHEN au.status_code = 200 THEN 1 END) AS DECIMAL) / 
        NULLIF(COUNT(*), 0) * 100 as success_rate
FROM api_usage au
LEFT JOIN companies c ON au.company_id = c.id
WHERE au.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY au.endpoint, au.method, au.company_id, c.name, DATE(au.created_at)
ORDER BY date DESC, call_count DESC;

-- Query 3.5: AI Insights Performance
-- Track AI insights generation
-- ================================================================
SELECT 
    ai.insight_type,
    ai.company_id,
    c.name as company_name,
    DATE_TRUNC('day', ai.created_at) as date,
    COUNT(*) as insight_count,
    AVG(ai.confidence_score) as avg_confidence,
    COUNT(DISTINCT ai.user_id) as unique_users,
    COUNT(DISTINCT ai.dataset_id) as datasets_analyzed
FROM ai_insights ai
LEFT JOIN companies c ON ai.company_id = c.id
WHERE ai.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY ai.insight_type, ai.company_id, c.name, DATE_TRUNC('day', ai.created_at)
ORDER BY date DESC;

-- ================================================================
-- SUPPLEMENTARY QUERIES
-- ================================================================

-- Query S.1: Company Overview
-- Company-level summary statistics
-- ================================================================
SELECT 
    c.id,
    c.name,
    c.subscription_tier,
    c.max_users,
    c.created_at,
    COUNT(DISTINCT p.user_id) as user_count,
    COUNT(DISTINCT ds.id) as dataset_count,
    COUNT(DISTINCT dp.id) as data_point_count,
    COUNT(DISTINCT pl.id) as prediction_count,
    MAX(dp.date_recorded) as last_data_date
FROM companies c
LEFT JOIN profiles p ON c.id = p.company_id
LEFT JOIN datasets ds ON c.id = ds.company_id
LEFT JOIN data_points dp ON c.id = dp.company_id
LEFT JOIN predictions_log pl ON c.id = pl.company_id
GROUP BY c.id, c.name, c.subscription_tier, c.max_users, c.created_at
ORDER BY c.name;

-- Query S.2: User Activity Summary
-- Track user engagement
-- ================================================================
SELECT 
    p.user_id,
    p.display_name,
    p.role,
    p.company_id,
    c.name as company_name,
    COUNT(DISTINCT ds.id) as datasets_created,
    COUNT(DISTINCT dp.id) as data_points_created,
    MAX(ds.created_at) as last_dataset_upload,
    MAX(dp.created_at) as last_data_point_created
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN datasets ds ON p.user_id = ds.user_id
LEFT JOIN data_points dp ON p.user_id = dp.user_id
GROUP BY p.user_id, p.display_name, p.role, p.company_id, c.name
ORDER BY datasets_created DESC;

-- Query S.3: Data Quality Metrics
-- Monitor data quality over time
-- ================================================================
SELECT 
    DATE(cdp.cleaned_at) as date,
    cdp.company_id,
    COUNT(*) as cleaned_record_count,
    AVG(cdp.data_quality_score) as avg_quality_score,
    COUNT(CASE WHEN cdp.data_quality_score >= 0.9 THEN 1 END) as high_quality_count,
    COUNT(CASE WHEN cdp.data_quality_score < 0.7 THEN 1 END) as low_quality_count,
    CAST(COUNT(CASE WHEN cdp.data_quality_score >= 0.9 THEN 1 END) AS DECIMAL) / 
        NULLIF(COUNT(*), 0) * 100 as high_quality_percentage
FROM cleaned_data_points cdp
WHERE cdp.cleaned_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(cdp.cleaned_at), cdp.company_id
ORDER BY date DESC;

-- ================================================================
-- NOTES FOR POWER BI USERS
-- ================================================================
-- 
-- 1. When importing these queries into Power BI:
--    - Use "Get Data" > "PostgreSQL database"
--    - Enter your Supabase connection details
--    - Paste the desired query in the "Advanced options" > "SQL statement"
--
-- 2. For better performance:
--    - Use DirectQuery for real-time data requirements
--    - Use Import mode for better performance with scheduled refresh
--    - Add date filters to limit data volume
--
-- 3. Recommended approach:
--    - Import historical data (older than 90 days)
--    - Use DirectQuery for recent data (last 90 days)
--    - Create composite models combining both
--
-- 4. Security:
--    - Row-Level Security (RLS) is enforced at the database level
--    - Users will only see data for their company_id
--    - Ensure proper authentication when connecting
--
-- ================================================================
