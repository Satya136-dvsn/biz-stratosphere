# Power BI Setup Guide - Complete Instructions

## 📊 Overview

This guide will walk you through creating 3 production-ready Power BI dashboards for the AI-Powered Business Intelligence Platform.

## 🔌 Database Connection Setup

### Step 1: Get Supabase Connection Details

Your Supabase PostgreSQL connection details:
- **Host**: `aws-0-us-east-1.pooler.supabase.com`
- **Database**: `postgres`
- **Port**: `6543`
- **Project**: `kfkllxfwyvocmnkowbyw`
- **Connection String**: Available in Supabase Dashboard → Project Settings → Database

### Step 2: Connect Power BI Desktop to Supabase

1. Open **Power BI Desktop**
2. Click **Get Data** → **More** → Search for "PostgreSQL"
3. Select **PostgreSQL database** → Click **Connect**
4. Enter connection details:
   - **Server**: `aws-0-us-east-1.pooler.supabase.com:6543`
   - **Database**: `postgres`
   - **Data Connectivity mode**: Select **DirectQuery** for live data or **Import** for better performance
5. Click **OK**
6. Enter credentials:
   - **Username**: `postgres.kfkllxfwyvocmnkowbyw`
   - **Password**: Your Supabase database password
7. Click **Connect**

### Step 3: Select Tables

Select these tables for import:
- ✅ `data_points` - Main metrics data
- ✅ `datasets` - Dataset metadata
- ✅ `churn_predictions_view` - Churn predictions
- ✅ `predictions_log` - Historical predictions
- ✅ `api_usage` - API usage metrics
- ✅ `profiles` - User information
- ✅ `companies` - Company data
- ✅ `cleaned_data_points` - Processed ML data

---

## 📈 Dashboard 1: Revenue & KPI Dashboard

### Purpose
Executive overview of business performance with key metrics and trends.

### Data Model

**Main Query** (Revenue & KPIs):
```sql
SELECT 
    dp.date_recorded,
    dp.metric_name,
    dp.metric_value,
    dp.metric_type,
    dp.company_id,
    c.name as company_name,
    ds.name as dataset_name,
    ds.status as dataset_status
FROM data_points dp
LEFT JOIN datasets ds ON dp.dataset_id = ds.id
LEFT JOIN companies c ON dp.company_id = c.id
WHERE dp.date_recorded >= CURRENT_DATE - INTERVAL '12 months'
ORDER BY dp.date_recorded DESC;
```

### DAX Measures

Create these measures in Power BI:

```dax
// Total Revenue
Total Revenue = 
SUM(data_points[metric_value])

// Revenue MTD (Month to Date)
Revenue MTD = 
TOTALMTD([Total Revenue], data_points[date_recorded])

// Revenue YTD (Year to Date)
Revenue YTD = 
TOTALYTD([Total Revenue], data_points[date_recorded])

// Revenue Previous Month
Revenue Previous Month = 
CALCULATE(
    [Total Revenue],
    DATEADD(data_points[date_recorded], -1, MONTH)
)

// Revenue Growth %
Revenue Growth % = 
DIVIDE(
    [Total Revenue] - [Revenue Previous Month],
    [Revenue Previous Month],
    0
)

// Average Daily Revenue
Avg Daily Revenue = 
AVERAGEX(
    VALUES(data_points[date_recorded]),
    [Total Revenue]
)

// Revenue Forecast (Simple Moving Average)
Revenue Forecast = 
CALCULATE(
    AVERAGE(data_points[metric_value]),
    DATESINPERIOD(
        data_points[date_recorded],
        LASTDATE(data_points[date_recorded]),
        -30,
        DAY
    )
)
```

### Visual Layout

**Page Layout:**
```
┌─────────────────────────────────────────────────────┐
│  REVENUE & KPI DASHBOARD                            │
├──────────┬──────────┬──────────┬──────────┬─────────┤
│  CARD    │  CARD    │  CARD    │  CARD    │  CARD   │
│ Total    │ MTD      │ YTD      │ Growth % │ Avg/Day │
│ Revenue  │ Revenue  │ Revenue  │          │         │
├──────────────────────────────────┬──────────────────┤
│                                  │                  │
│  LINE CHART                      │  DONUT CHART     │
│  Revenue Trend (12 months)       │  Revenue by      │
│  + Forecast Line                 │  Company         │
│                                  │                  │
├──────────────────────────────────┼──────────────────┤
│                                  │                  │
│  COLUMN CHART                    │  TABLE           │
│  Monthly Revenue Comparison      │  Top Datasets    │
│  (This Year vs Last Year)        │  by Revenue      │
│                                  │                  │
└──────────────────────────────────┴──────────────────┘
```

### Visual Configuration

1. **KPI Cards** (Top Row):
   - Total Revenue: `[Total Revenue]`, format as currency
   - MTD Revenue: `[Revenue MTD]`, format as currency
   - YTD Revenue: `[Revenue YTD]`, format as currency
   - Growth %: `[Revenue Growth %]`, format as percentage with up/down indicator
   - Avg/Day: `[Avg Daily Revenue]`, format as currency

2. **Revenue Trend Line Chart**:
   - X-axis: `date_recorded` (Month)
   - Y-axis: `[Total Revenue]`
   - Add second line: `[Revenue Forecast]` (dashed line)
   - Add trend line
   - Color: Use gradient based on growth

3. **Revenue by Company Donut Chart**:
   - Values: `[Total Revenue]`
   - Legend: `company_name`
   - Show data labels with percentages

4. **Monthly Comparison Column Chart**:
   - X-axis: Month names
   - Y-axis: Revenue
   - Series: Current Year vs Previous Year
   - Add data labels on top of columns

5. **Top Datasets Table**:
   - Columns: Dataset Name, Revenue, Status, Last Updated
   - Sort by Revenue (descending)
   - Conditional formatting on Status column

---

## 🔴 Dashboard 2: Churn Analysis Dashboard

### Purpose
Deep dive into customer churn predictions, risk levels, and factors.

### Data Model

**Main Query** (Churn Predictions):
```sql
SELECT 
    cp.customer_id,
    cp.churn_probability,
    cp.predicted_churn,
    cp.actual_churn,
    cp.contract_type,
    cp.tenure,
    cp.monthly_charges,
    cp.prediction_time,
    pl.predicted_probability,
    pl.confidence_score,
    pl.input_features,
    c.name as company_name
FROM churn_predictions_view cp
LEFT JOIN predictions_log pl ON cp.customer_id = pl.customer_id
LEFT JOIN companies c ON pl.company_id = c.id
WHERE cp.prediction_time >= CURRENT_DATE - INTERVAL '6 months'
ORDER BY cp.churn_probability DESC;
```

### DAX Measures

```dax
// Total Customers
Total Customers = 
DISTINCTCOUNT(churn_predictions_view[customer_id])

// High Risk Customers (Churn Probability > 0.7)
High Risk Customers = 
CALCULATE(
    [Total Customers],
    churn_predictions_view[churn_probability] > 0.7
)

// Medium Risk Customers (0.4 - 0.7)
Medium Risk Customers = 
CALCULATE(
    [Total Customers],
    churn_predictions_view[churn_probability] > 0.4,
    churn_predictions_view[churn_probability] <= 0.7
)

// Low Risk Customers (< 0.4)
Low Risk Customers = 
CALCULATE(
    [Total Customers],
    churn_predictions_view[churn_probability] <= 0.4
)

// Average Churn Probability
Avg Churn Probability = 
AVERAGE(churn_predictions_view[churn_probability])

// Churn Rate %
Churn Rate = 
DIVIDE(
    COUNTROWS(FILTER(churn_predictions_view, churn_predictions_view[actual_churn] = "Yes")),
    [Total Customers],
    0
)

// Revenue at Risk
Revenue at Risk = 
SUMX(
    FILTER(churn_predictions_view, churn_predictions_view[churn_probability] > 0.7),
    churn_predictions_view[monthly_charges] * 12
)

// Prediction Accuracy
Prediction Accuracy = 
VAR CorrectPredictions = 
    COUNTROWS(
        FILTER(
            churn_predictions_view,
            (churn_predictions_view[predicted_churn] = "Yes" && churn_predictions_view[actual_churn] = "Yes") ||
            (churn_predictions_view[predicted_churn] = "No" && churn_predictions_view[actual_churn] = "No")
        )
    )
RETURN
    DIVIDE(CorrectPredictions, [Total Customers], 0)
```

### Visual Layout

```
┌─────────────────────────────────────────────────────┐
│  CHURN ANALYSIS DASHBOARD                           │
├──────────┬──────────┬──────────┬──────────┬─────────┤
│  CARD    │  CARD    │  CARD    │  CARD    │  CARD   │
│ Total    │ High     │ Medium   │ Low      │ Revenue │
│Customers │ Risk     │ Risk     │ Risk     │ at Risk │
├──────────┴──────────┴──────────┴──────────┴─────────┤
│                                                      │
│  GAUGE CHART - Average Churn Probability            │
│  (0-100% with Red/Yellow/Green zones)               │
│                                                      │
├──────────────────────────────────┬──────────────────┤
│                                  │                  │
│  FUNNEL CHART                    │  SCATTER PLOT    │
│  Churn Risk Distribution         │  Tenure vs       │
│  (High → Medium → Low)           │  Monthly Charges │
│                                  │  (Size = Risk)   │
├──────────────────────────────────┼──────────────────┤
│                                  │                  │
│  BAR CHART                       │  TABLE           │
│  Churn by Contract Type          │  High Risk       │
│                                  │  Customer List   │
└──────────────────────────────────┴──────────────────┘
```

### Visual Configuration

1. **KPI Cards**:
   - Total Customers: `[Total Customers]`
   - High Risk: `[High Risk Customers]` (red background)
   - Medium Risk: `[Medium Risk Customers]` (yellow background)
   - Low Risk: `[Low Risk Customers]` (green background)
   - Revenue at Risk: `[Revenue at Risk]` (format as currency)

2. **Gauge Chart**:
   - Value: `[Avg Churn Probability]`
   - Zones: 0-40% (Green), 40-70% (Yellow), 70-100% (Red)
   - Target: 30%

3. **Funnel Chart**:
   - Values: `[High Risk Customers]`, `[Medium Risk Customers]`, `[Low Risk Customers]`
   - Show data labels with percentages

4. **Scatter Plot**:
   - X-axis: `tenure`
   - Y-axis: `monthly_charges`
   - Size: `churn_probability`
   - Color: Risk level (Red/Yellow/Green)
   - Add clustering

5. **Churn by Contract Type Bar Chart**:
   - X-axis: `contract_type`
   - Y-axis: `[Avg Churn Probability]`
   - Sort descending
   - Add target line at 50%

6. **High Risk Customer Table**:
   - Columns: Customer ID, Churn %, Monthly Charges, Tenure, Contract Type
   - Filter: `churn_probability > 0.7`
   - Sort by Churn % (descending)
   - Conditional formatting on Churn % column (red gradient)

---

## 🤖 Dashboard 3: ML Model Performance Dashboard

### Purpose
Track ML model performance, prediction accuracy, and insights generation.

### Data Model

**Main Query** (Model Performance):
```sql
SELECT 
    pl.prediction_type,
    pl.predicted_probability,
    pl.predicted_label,
    pl.actual_outcome,
    pl.confidence_score,
    pl.model_version,
    pl.prediction_time,
    pl.company_id,
    c.name as company_name,
    ai.insight_type,
    ai.confidence_score as insight_confidence,
    ai.created_at as insight_created_at
FROM predictions_log pl
LEFT JOIN companies c ON pl.company_id = c.id
LEFT JOIN ai_insights ai ON pl.company_id = ai.company_id 
    AND DATE(pl.prediction_time) = DATE(ai.created_at)
WHERE pl.prediction_time >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY pl.prediction_time DESC;
```

### DAX Measures

```dax
// Total Predictions
Total Predictions = 
COUNTROWS(predictions_log)

// Predictions This Month
Predictions This Month = 
CALCULATE(
    [Total Predictions],
    DATESMTD(predictions_log[prediction_time])
)

// Model Accuracy
Model Accuracy = 
VAR CorrectPredictions = 
    COUNTROWS(
        FILTER(
            predictions_log,
            (predictions_log[predicted_label] = TRUE && predictions_log[actual_outcome] = TRUE) ||
            (predictions_log[predicted_label] = FALSE && predictions_log[actual_outcome] = FALSE)
        )
    )
VAR TotalWithActuals = 
    COUNTROWS(FILTER(predictions_log, NOT(ISBLANK(predictions_log[actual_outcome]))))
RETURN
    DIVIDE(CorrectPredictions, TotalWithActuals, 0)

// Precision
Model Precision = 
VAR TruePositives = 
    COUNTROWS(
        FILTER(
            predictions_log,
            predictions_log[predicted_label] = TRUE && predictions_log[actual_outcome] = TRUE
        )
    )
VAR FalsePositives = 
    COUNTROWS(
        FILTER(
            predictions_log,
            predictions_log[predicted_label] = TRUE && predictions_log[actual_outcome] = FALSE
        )
    )
RETURN
    DIVIDE(TruePositives, TruePositives + FalsePositives, 0)

// Recall
Model Recall = 
VAR TruePositives = 
    COUNTROWS(
        FILTER(
            predictions_log,
            predictions_log[predicted_label] = TRUE && predictions_log[actual_outcome] = TRUE
        )
    )
VAR FalseNegatives = 
    COUNTROWS(
        FILTER(
            predictions_log,
            predictions_log[predicted_label] = FALSE && predictions_log[actual_outcome] = TRUE
        )
    )
RETURN
    DIVIDE(TruePositives, TruePositives + FalseNegatives, 0)

// F1 Score
F1 Score = 
DIVIDE(
    2 * [Model Precision] * [Model Recall],
    [Model Precision] + [Model Recall],
    0
)

// Average Confidence Score
Avg Confidence = 
AVERAGE(predictions_log[confidence_score])

// API Calls (from api_usage table)
Total API Calls = 
COUNTROWS(api_usage)

// Average Response Time
Avg Response Time = 
AVERAGE(api_usage[response_time_ms])
```

### Visual Layout

```
┌─────────────────────────────────────────────────────┐
│  ML MODEL PERFORMANCE DASHBOARD                     │
├──────────┬──────────┬──────────┬──────────┬─────────┤
│  CARD    │  CARD    │  CARD    │  CARD    │  CARD   │
│ Total    │ Accuracy │Precision │ Recall   │ F1      │
│Predictions│         │          │          │ Score   │
├──────────────────────────────────┬──────────────────┤
│                                  │                  │
│  LINE CHART                      │  PIE CHART       │
│  Predictions Over Time           │  Prediction Type │
│  (Daily/Weekly/Monthly)          │  Distribution    │
│                                  │                  │
├──────────────────────────────────┼──────────────────┤
│                                  │                  │
│  COLUMN CHART                    │  LINE CHART      │
│  Confusion Matrix Heatmap        │  Model Accuracy  │
│  (Predicted vs Actual)           │  Trend Over Time │
│                                  │                  │
├──────────────────────────────────┼──────────────────┤
│                                  │                  │
│  BAR CHART                       │  TABLE           │
│  API Usage by Endpoint           │  Recent          │
│  (Top 10)                        │  Predictions Log │
└──────────────────────────────────┴──────────────────┘
```

### Visual Configuration

1. **KPI Cards**:
   - Total Predictions: `[Total Predictions]`
   - Accuracy: `[Model Accuracy]` (format as %, green if > 80%)
   - Precision: `[Model Precision]` (format as %)
   - Recall: `[Model Recall]` (format as %)
   - F1 Score: `[F1 Score]` (format as %)

2. **Predictions Over Time Line Chart**:
   - X-axis: `prediction_time` (auto date hierarchy)
   - Y-axis: `[Total Predictions]`
   - Add trend line
   - Enable drill-down (Year → Quarter → Month → Day)

3. **Prediction Type Pie Chart**:
   - Values: `[Total Predictions]`
   - Legend: `prediction_type`
   - Show percentages and labels

4. **Confusion Matrix** (Matrix Visual):
   - Rows: `actual_outcome`
   - Columns: `predicted_label`
   - Values: Count of predictions
   - Conditional formatting: Gradient from white to dark blue

5. **Model Accuracy Trend**:
   - X-axis: `prediction_time` (by week)
   - Y-axis: `[Model Accuracy]`
   - Add target line at 80%
   - Show confidence bands

6. **API Usage Bar Chart**:
   - X-axis: `endpoint` (from api_usage table)
   - Y-axis: `[Total API Calls]`
   - Sort descending
   - Top 10 only

7. **Recent Predictions Table**:
   - Columns: Time, Customer ID, Prediction, Probability, Confidence, Actual, Match
   - Sort by Time (descending)
   - Top 50 rows
   - Conditional formatting: Green check for correct, Red X for incorrect

---

## 🔄 Setting Up Scheduled Refresh

### Power BI Service (Online)

1. Publish your reports to Power BI Service
2. Go to your workspace
3. Find your dataset → Click **⋯** → **Settings**
4. Under **Scheduled refresh**:
   - Enable: ✅ **Keep your data up to date**
   - Frequency: **Daily** or **Hourly** (Pro required for hourly)
   - Time: Select off-peak hours (e.g., 2 AM, 6 AM, 10 AM)
   - Time zone: Your local time zone
5. Configure gateway connection if using DirectQuery
6. Click **Apply**

### Using Power BI API (Automated)

Your project already has automated refresh endpoints:
- `supabase/functions/powerbi-scheduled-refresh/index.ts`
- `supabase/functions/powerbi-data-endpoint/index.ts`

To use them:
1. Generate an API key in your company settings
2. Set up a cron job or scheduled task:
   ```bash
   curl -X POST https://kfkllxfwyvocmnkowbyw.supabase.co/functions/v1/powerbi-scheduled-refresh \
     -H "x-scheduled: true" \
     -H "Content-Type: application/json"
   ```

---

## 🎨 Design Best Practices

### Color Scheme
Use consistent colors across all dashboards:
- **Primary**: #0078D4 (Microsoft Blue)
- **Success/Low Risk**: #107C10 (Green)
- **Warning/Medium Risk**: #FFB900 (Amber)
- **Danger/High Risk**: #D13438 (Red)
- **Neutral**: #605E5C (Gray)

### Typography
- **Titles**: Segoe UI Bold, 16-18pt
- **Headers**: Segoe UI Semibold, 12-14pt
- **Body**: Segoe UI Regular, 10-11pt

### Layout
- Consistent spacing: 10px padding between visuals
- Align visuals to grid
- Use white space effectively
- Group related metrics

### Interactivity
- Enable cross-filtering between visuals
- Add slicers for: Date Range, Company, Dataset
- Add drill-through pages for detailed analysis
- Enable tooltips with additional context

---

## 🐛 Troubleshooting

### Connection Issues
- **"Can't connect to database"**: Check firewall rules, ensure IP whitelisting in Supabase
- **"Authentication failed"**: Verify username format: `postgres.kfkllxfwyvocmnkowbyw`
- **"Timeout error"**: Switch to Import mode instead of DirectQuery

### Performance Issues
- Use DirectQuery only for real-time requirements
- Create aggregations for large tables
- Use query folding where possible
- Limit row count with WHERE clauses

### Data Issues
- **"No data showing"**: Check RLS policies in Supabase
- **"Incorrect totals"**: Verify DAX measure logic and relationships
- **"Dates not working"**: Ensure date columns are formatted as Date type

---

## 📚 Additional Resources

- [Power BI Documentation](https://docs.microsoft.com/power-bi/)
- [DAX Function Reference](https://dax.guide/)
- [Supabase + Power BI Integration](https://supabase.com/docs/guides/integrations/powerbi)
- Project Edge Functions: `/supabase/functions/powerbi-*`

---

## ✅ Completion Checklist

- [ ] Connected Power BI Desktop to Supabase PostgreSQL
- [ ] Imported all required tables
- [ ] Created Revenue & KPI Dashboard (Page 1)
- [ ] Created Churn Analysis Dashboard (Page 2)
- [ ] Created ML Model Performance Dashboard (Page 3)
- [ ] Configured all DAX measures
- [ ] Applied consistent color scheme and design
- [ ] Published to Power BI Service
- [ ] Configured scheduled refresh
- [ ] Tested all interactivity and cross-filtering
- [ ] Saved .pbix files to `powerbi/dashboards/` folder
- [ ] Documented dashboard usage in README

**Estimated Time**: 4-6 hours for all 3 dashboards
