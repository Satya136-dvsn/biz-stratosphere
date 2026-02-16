// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Test data factories for creating mock objects
 */

export const createMockDataset = (overrides = {}) => ({
    id: 'dataset-123',
    user_id: 'user-123',
    name: 'Test Dataset',
    file_name: 'test-data.csv',
    file_size: 1024,
    row_count: 100,
    column_count: 5,
    created_at: new Date().toISOString(),
    metadata: {
        quality: {
            totalRows: 100,
            totalColumns: 5,
            completeness: 0.95,
        },
    },
    ...overrides,
});

export const createMockDataPoint = (overrides = {}) => ({
    id: 'point-123',
    user_id: 'user-123',
    dataset_id: 'dataset-123',
    metric_name: 'Revenue',
    metric_value: '1000.50',
    date_recorded: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
});

export const createMockEmbedding = (overrides = {}) => ({
    id: 'embedding-123',
    user_id: 'user-123',
    dataset_id: 'dataset-123',
    content: 'Revenue: 1000 (recorded on 2024-01-01)',
    metadata: {
        metric_name: 'Revenue',
        metric_value: '1000',
        date_recorded: '2024-01-01',
    },
    embedding: new Array(768).fill(0.1),
    created_at: new Date().toISOString(),
    ...overrides,
});

export const createMockConversation = (overrides = {}) => ({
    id: 'conv-123',
    user_id: 'user-123',
    title: 'Test Conversation',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
});

export const createMockChatMessage = (overrides = {}) => ({
    id: 'message-123',
    conversation_id: 'conv-123',
    role: 'user' as const,
    content: 'Test message',
    sources: [],
    created_at: new Date().toISOString(),
    ...overrides,
});

export const createMockChartConfiguration = (overrides = {}) => ({
    id: 'chart-123',
    user_id: 'user-123',
    name: 'Test Chart',
    chart_type: 'bar' as const,
    dataset_id: 'dataset-123',
    x_column: 'date',
    y_column: 'value',
    filters: {},
    customization: {
        title: 'Test Chart',
        showLegend: true,
        showGrid: true,
        showTooltip: true,
        primaryColor: '#8884d8',
        secondaryColor: '#82ca9d',
        width: 600,
        height: 400,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
});

export const createMockReportConfiguration = (overrides = {}) => ({
    id: 'report-123',
    user_id: 'user-123',
    name: 'Test Report',
    report_type: 'kpi_summary' as const,
    date_range_start: '2024-01-01',
    date_range_end: '2024-12-31',
    selected_metrics: ['revenue', 'customers'],
    selected_dimensions: ['date', 'region'],
    filters: {},
    dataset_id: 'dataset-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
});

export const createMockMLModel = (overrides = {}) => ({
    name: 'churn_model',
    source: 'local' as const,
    path: '/models/churn_model.pkl',
    ...overrides,
});

export const createMockPrediction = (overrides = {}) => ({
    prediction: 0,
    probability: 0.23,
    confidence: 0.77,
    model: 'churn_model',
    ...overrides,
});

export const createMockSHAPExplanation = (overrides = {}) => ({
    shap_values: {
        usage_frequency: 0.15,
        support_tickets: -0.08,
        tenure_months: 0.12,
        monthly_spend: -0.05,
        feature_usage_pct: 0.10,
    },
    base_value: 0.3,
    feature_names: ['usage_frequency', 'support_tickets', 'tenure_months', 'monthly_spend', 'feature_usage_pct'],
    top_features: ['usage_frequency', 'tenure_months', 'feature_usage_pct'],
    prediction: 0,
    visualizations: {
        waterfall_plot: 'data:image/png;base64,mock',
        summary_plot: 'data:image/png;base64,mock',
    },
    ...overrides,
});

export const createMockUser = (overrides = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    ...overrides,
});

// Helper to create multiple items
export const createMockList = <T>(factory: (overrides?: any) => T, count: number, overrides = {}): T[] => {
    return Array.from({ length: count }, (_, i) => factory({ id: `item-${i}`, ...overrides }));
};
