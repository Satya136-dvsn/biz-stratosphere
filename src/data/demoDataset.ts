/**
 * Preloaded SaaS Demo Dataset
 *
 * Realistic sample data for demonstrating the platform.
 * Used when no user data is uploaded yet to give a rich first impression.
 */

export interface DemoKPIData {
    totalRevenue: number;
    activeCustomers: number;
    churnRate: number;
    averageDealSize: number;
    conversionRate: number;
    growthRate: number;
    revenueChange: number;
    customersChange: number;
    churnChange: number;
    dealSizeChange: number;
    conversionChange: number;
    growthChange: number;
}

export interface DemoChartPoint {
    month: string;
    revenue: number;
    target: number;
    customers: number;
    churn: number;
}

export interface DemoDecision {
    id: string;
    model: string;
    prediction: string;
    confidence: number;
    action: string;
    outcome: string;
    date: string;
}

// ─── KPI Data ──────────────────────────────────────────
export const DEMO_KPI_DATA: DemoKPIData = {
    totalRevenue: 2_847_500,
    activeCustomers: 1_284,
    churnRate: 3.2,
    averageDealSize: 4_850,
    conversionRate: 24.7,
    growthRate: 18.3,
    revenueChange: 12.4,
    customersChange: 8.7,
    churnChange: -1.1,
    dealSizeChange: 5.2,
    conversionChange: 3.8,
    growthChange: 2.1,
};

// ─── 12-month Revenue Chart Data ───────────────────────
export const DEMO_CHART_DATA: DemoChartPoint[] = [
    { month: 'Jan', revenue: 185000, target: 180000, customers: 980, churn: 31 },
    { month: 'Feb', revenue: 198000, target: 190000, customers: 1010, churn: 28 },
    { month: 'Mar', revenue: 215000, target: 200000, customers: 1045, churn: 34 },
    { month: 'Apr', revenue: 207000, target: 210000, customers: 1062, churn: 42 },
    { month: 'May', revenue: 231000, target: 220000, customers: 1098, churn: 26 },
    { month: 'Jun', revenue: 242000, target: 230000, customers: 1130, churn: 29 },
    { month: 'Jul', revenue: 238000, target: 240000, customers: 1155, churn: 38 },
    { month: 'Aug', revenue: 256000, target: 250000, customers: 1190, churn: 25 },
    { month: 'Sep', revenue: 271000, target: 260000, customers: 1218, churn: 33 },
    { month: 'Oct', revenue: 265000, target: 270000, customers: 1240, churn: 41 },
    { month: 'Nov', revenue: 289000, target: 280000, customers: 1265, churn: 27 },
    { month: 'Dec', revenue: 310000, target: 290000, customers: 1284, churn: 30 },
];

// ─── Decision Memory™ Sample Entries ───────────────────
export const DEMO_DECISIONS: DemoDecision[] = [
    {
        id: 'dm-001',
        model: 'Churn Predictor v2.1',
        prediction: '82% likely to churn',
        confidence: 82,
        action: 'Offered 20% discount + personal call',
        outcome: 'Customer retained — renewed for 12 months',
        date: '2026-01-15',
    },
    {
        id: 'dm-002',
        model: 'Revenue Forecaster',
        prediction: '$124K next quarter',
        confidence: 76,
        action: 'Increased ad spend by 15%',
        outcome: 'Actual: $131K (+5.6% above forecast)',
        date: '2026-01-08',
    },
    {
        id: 'dm-003',
        model: 'Anomaly Detector',
        prediction: 'Spike in support tickets detected',
        confidence: 91,
        action: 'Investigated — found billing bug',
        outcome: 'Bug fixed, ticket volume down 60% in 48h',
        date: '2025-12-28',
    },
    {
        id: 'dm-004',
        model: 'Churn Predictor v2.1',
        prediction: '67% likely to churn',
        confidence: 67,
        action: 'No action taken (low priority)',
        outcome: 'Customer churned — $4,200/yr lost',
        date: '2025-12-20',
    },
    {
        id: 'dm-005',
        model: 'Upsell Scorer',
        prediction: '78% upsell probability',
        confidence: 78,
        action: 'Sent personalized upgrade offer',
        outcome: 'Upgraded to Enterprise — $18K ARR increase',
        date: '2025-12-12',
    },
];

// ─── Recent Activity (Demo) ───────────────────────────
export const DEMO_ACTIVITIES = [
    { type: 'prediction' as const, title: 'Churn Analysis Complete', description: '3 at-risk customers identified', timestamp: '2 min ago', trend: 'up' as const },
    { type: 'upload' as const, title: 'Q4 Revenue Data Uploaded', description: 'revenue_q4_2025.csv — 12,847 rows', timestamp: '15 min ago' },
    { type: 'decision' as const, title: 'Decision logged', description: 'Accepted churn mitigation recommendation', timestamp: '1 hour ago', trend: 'up' as const, amount: 4200 },
    { type: 'alert' as const, title: 'Anomaly Detected', description: 'Support ticket spike — investigating', timestamp: '3 hours ago', trend: 'down' as const },
    { type: 'report' as const, title: 'Weekly Report Generated', description: 'Executive summary exported as PDF', timestamp: '1 day ago' },
];
