// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Local Reactive In-Memory & LocalStorage Database
 * Provides 100% Zero-API PostgREST query simulation,
 * complete schema seeding, and offline persistence.
 */

export interface QueryFilter {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'is';
  value: any;
}

export interface QueryOrder {
  column: string;
  ascending: boolean;
}

export interface LocalSessionUser {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'super_admin';
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  created_at: string;
}

const STORAGE_PREFIX = 'biz_stratosphere_db_';

// Initial pre-seeded datasets & records
export const DEMO_USER: LocalSessionUser = {
  id: 'demo-user-id',
  email: 'demo@bizstratosphere.io',
  role: 'admin',
  user_metadata: {
    display_name: 'Demo Administrator',
    full_name: 'Demo Administrator',
    company: 'Biz Stratosphere Corp'
  },
  created_at: '2026-01-01T00:00:00Z'
};

const SEED_DATA: Record<string, any[]> = {
  workspaces: [
    {
      id: 'default-workspace',
      name: 'Primary Enterprise Workspace',
      owner_id: DEMO_USER.id,
      created_at: '2026-01-01T00:00:00Z'
    }
  ],
  workspace_members: [
    {
      id: 'wm-1',
      workspace_id: 'default-workspace',
      user_id: DEMO_USER.id,
      role: 'owner',
      created_at: '2026-01-01T00:00:00Z'
    }
  ],
  profiles: [
    {
      id: 'p-1',
      user_id: DEMO_USER.id,
      email: DEMO_USER.email,
      full_name: 'Demo Administrator',
      login_notifications_enabled: true,
      two_factor_enabled: false,
      created_at: '2026-01-01T00:00:00Z'
    }
  ],
  user_roles: [
    {
      id: 'ur-1',
      user_id: DEMO_USER.id,
      role: 'admin',
      created_at: '2026-01-01T00:00:00Z'
    }
  ],
  datasets: [
    {
      id: 'ds-saas-core',
      user_id: DEMO_USER.id,
      file_name: 'saas_portfolio_metrics.csv',
      file_type: 'csv',
      file_size: 15420,
      row_count: 5,
      column_count: 7,
      storage_path: 'local/saas_portfolio_metrics.csv',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      id: 'ds-churn-risk',
      user_id: DEMO_USER.id,
      file_name: 'customer_churn_analysis.csv',
      file_type: 'csv',
      file_size: 8940,
      row_count: 5,
      column_count: 7,
      storage_path: 'local/customer_churn_analysis.csv',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ],
  user_uploads: [
    {
      id: 'up-1',
      user_id: DEMO_USER.id,
      filename: 'saas_portfolio_metrics.csv',
      file_type: 'csv',
      file_size: 15420,
      upload_status: 'completed',
      storage_path: 'local/saas_portfolio_metrics.csv',
      row_count: 5,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      id: 'up-2',
      user_id: DEMO_USER.id,
      filename: 'customer_churn_analysis.csv',
      file_type: 'csv',
      file_size: 8940,
      upload_status: 'completed',
      storage_path: 'local/customer_churn_analysis.csv',
      row_count: 5,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ],
  data_points: [
    // Revenue time series
    { id: 'dp-1', user_id: DEMO_USER.id, dataset_id: 'ds-saas-core', metric_name: 'monthly_revenue', metric_value: 185000, date_recorded: '2026-05-01', category: 'financial' },
    { id: 'dp-2', user_id: DEMO_USER.id, dataset_id: 'ds-saas-core', metric_name: 'monthly_revenue', metric_value: 198000, date_recorded: '2026-06-01', category: 'financial' },
    { id: 'dp-3', user_id: DEMO_USER.id, dataset_id: 'ds-saas-core', metric_name: 'monthly_revenue', metric_value: 215000, date_recorded: '2026-07-01', category: 'financial' },
    { id: 'dp-4', user_id: DEMO_USER.id, dataset_id: 'ds-saas-core', metric_name: 'monthly_revenue', metric_value: 234700, date_recorded: '2026-08-01', category: 'financial' },
    // Customers count time series
    { id: 'dp-5', user_id: DEMO_USER.id, dataset_id: 'ds-saas-core', metric_name: 'active_customers', metric_value: 1240, date_recorded: '2026-07-01', category: 'operations' },
    { id: 'dp-6', user_id: DEMO_USER.id, dataset_id: 'ds-saas-core', metric_name: 'active_customers', metric_value: 1315, date_recorded: '2026-08-01', category: 'operations' },
    // Churn rate
    { id: 'dp-7', user_id: DEMO_USER.id, dataset_id: 'ds-saas-core', metric_name: 'churn_rate', metric_value: 1.8, date_recorded: '2026-08-01', category: 'risk' },
    // Raw CSV rows for Northstar, Cedar, Apex, Meridian, Orbit
    {
      id: 'dp-raw-1',
      user_id: DEMO_USER.id,
      dataset_id: 'ds-churn-risk',
      metric_name: 'raw_csv_row',
      metric_value: 48200,
      date_recorded: '2026-08-15',
      category: 'account',
      metadata: {
        row_data: {
          name: 'Northstar Logistics',
          revenue: 48200,
          engagement: 42,
          support_tickets: 9,
          renewal_days: 18,
          churn_risk: 84
        }
      }
    },
    {
      id: 'dp-raw-2',
      user_id: DEMO_USER.id,
      dataset_id: 'ds-churn-risk',
      metric_name: 'raw_csv_row',
      metric_value: 31700,
      date_recorded: '2026-08-15',
      category: 'account',
      metadata: {
        row_data: {
          name: 'Cedar & Co.',
          revenue: 31700,
          engagement: 58,
          support_tickets: 6,
          renewal_days: 32,
          churn_risk: 68
        }
      }
    },
    {
      id: 'dp-raw-3',
      user_id: DEMO_USER.id,
      dataset_id: 'ds-churn-risk',
      metric_name: 'raw_csv_row',
      metric_value: 76400,
      date_recorded: '2026-08-15',
      category: 'account',
      metadata: {
        row_data: {
          name: 'Apex Retail',
          revenue: 76400,
          engagement: 87,
          support_tickets: 2,
          renewal_days: 91,
          churn_risk: 18
        }
      }
    },
    {
      id: 'dp-raw-4',
      user_id: DEMO_USER.id,
      dataset_id: 'ds-churn-risk',
      metric_name: 'raw_csv_row',
      metric_value: 56300,
      date_recorded: '2026-08-15',
      category: 'account',
      metadata: {
        row_data: {
          name: 'Meridian Health',
          revenue: 56300,
          engagement: 71,
          support_tickets: 4,
          renewal_days: 64,
          churn_risk: 36
        }
      }
    },
    {
      id: 'dp-raw-5',
      user_id: DEMO_USER.id,
      dataset_id: 'ds-churn-risk',
      metric_name: 'raw_csv_row',
      metric_value: 22100,
      date_recorded: '2026-08-15',
      category: 'account',
      metadata: {
        row_data: {
          name: 'Orbit Systems',
          revenue: 22100,
          engagement: 49,
          support_tickets: 7,
          renewal_days: 25,
          churn_risk: 73
        }
      }
    }
  ],
  decision_memory: [
    {
      decision_id: 'dec-101',
      decision_type: 'ml_prediction',
      user_id: DEMO_USER.id,
      workspace_id: 'default-workspace',
      input_context: { account: 'Northstar Logistics', mrr: 48200, churnScore: 84 },
      ai_confidence_score: 0.94,
      ai_confidence_level: 'high',
      human_action: 'accepted',
      expected_outcome: 'Assign executive sponsor, schedule renewal check-in',
      actual_outcome: 'Renewal confirmed for additional 12 months with contract add-on',
      outcome_status: 'success',
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      evaluated_at: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      decision_id: 'dec-102',
      decision_type: 'ai_chat',
      user_id: DEMO_USER.id,
      workspace_id: 'default-workspace',
      input_context: { query: 'How to increase deal sizes for mid-tier SaaS accounts?' },
      ai_confidence_score: 0.88,
      ai_confidence_level: 'high',
      human_action: 'accepted',
      expected_outcome: 'Implement seat-based tiered expansion package',
      actual_outcome: 'Pending cohort quarter review',
      outcome_status: 'pending',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    }
  ],
  agent_decision_memory: [
    {
      id: 'adm-001',
      user_query: 'Evaluate churn risk for Northstar Logistics account expiring in 18 days',
      tools_used: [{ name: 'ml_predict' }, { name: 'rag_retrieve' }, { name: 'analytics_insight' }],
      ml_results: { churnProbability: 0.82, riskLevel: 'Critical', confidence: 0.82 },
      rag_context: { contract_end: '2026-09-26', open_tickets: 9, satisfaction: 42 },
      agent_reasoning: 'Account Northstar Logistics displays severe churn indicators: 9 open support tickets regarding API timeouts, low seat utilization (42%), and renewal scheduled in 18 days. The Churn Predictor v2.1 model assigns an 82% churn probability. Historical retention playbook suggests executive outreach paired with contract concessions.',
      final_decision: 'Offer 20% discount + personal call with VP of Customer Success. Dispatched priority engineering escalation for open API tickets. (Outcome: Customer retained — renewed for 12 months)',
      confidence_score: 0.82,
      status: 'approved',
      timestamp: '2026-01-15T14:32:00Z'
    },
    {
      id: 'adm-002',
      user_query: 'Forecast Q2 SaaS revenue and recommend marketing budget allocation',
      tools_used: [{ name: 'ml_predict' }, { name: 'analytics_insight' }],
      ml_results: { predicted_revenue: 124000, trend: 'positive' },
      rag_context: { historical_growth: 0.18, current_arr: 480000 },
      agent_reasoning: 'Analyzed previous 4 quarters of MRR growth and pipeline conversion velocity. Revenue Forecaster models predict $124K next quarter with 76% statistical confidence. Growth models show paid acquisition channels are yielding a 3.4x LTV/CAC ratio.',
      final_decision: 'Increase digital ad spend by 15% across LinkedIn and Google Search channels. (Outcome: Actual: $131K — +5.6% above forecast)',
      confidence_score: 0.76,
      status: 'executed',
      timestamp: '2026-01-08T10:15:00Z'
    },
    {
      id: 'adm-003',
      user_query: 'Investigate anomalous 300% spike in customer support tickets over past 48 hours',
      tools_used: [{ name: 'analytics_insight' }, { name: 'action_trigger' }],
      ml_results: { anomaly_detected: true, z_score: 4.8 },
      rag_context: { billing_errors: 47, invoice_failures: 32 },
      agent_reasoning: 'Anomaly detector identified an abnormal ticket influx originating from failed recurring invoice charge events following the v2.4 billing migration.',
      final_decision: 'Investigated and isolated billing webhook race condition. Rolled back billing microservice patch and notified affected accounts. (Outcome: Bug fixed, ticket volume down 60% in 48h)',
      confidence_score: 0.91,
      status: 'executed',
      timestamp: '2025-12-28T09:40:00Z'
    },
    {
      id: 'adm-004',
      user_query: 'Determine renewal intervention strategy for Orbit Systems',
      tools_used: [{ name: 'ml_predict' }],
      ml_results: { churnProbability: 0.67, riskLevel: 'Moderate' },
      rag_context: { renewal_days: 25, seats: 12 },
      agent_reasoning: 'Churn predictor indicates moderate risk (67%) due to low activity, but overall ACV is below high-priority tier.',
      final_decision: 'No aggressive discount taken (low tier priority). Standard automated renewal sequence dispatched. (Outcome: Customer churned — $4,200/yr lost)',
      confidence_score: 0.67,
      status: 'rejected',
      timestamp: '2025-12-20T16:20:00Z'
    },
    {
      id: 'adm-005',
      user_query: 'Score enterprise expansion probability for Apex Retail account',
      tools_used: [{ name: 'ml_predict' }, { name: 'rag_retrieve' }],
      ml_results: { upsell_probability: 0.78, estimated_expansion: 18000 },
      rag_context: { seats_limit_reached: true, engagement: 87 },
      agent_reasoning: 'Apex Retail has hit 98% seat utilization and requested custom SSO documentation. Upsell scorer indicates 78% probability of enterprise tier upgrade.',
      final_decision: 'Sent personalized upgrade proposal with tailored enterprise security package. (Outcome: Upgraded to Enterprise — $18K ARR increase)',
      confidence_score: 0.78,
      status: 'executed',
      timestamp: '2025-12-12T11:05:00Z'
    },
    {
      id: 'adm-006',
      user_query: 'Execute automated churn mitigation workflow for Cedar & Co.',
      tools_used: [{ name: 'action_trigger' }, { name: 'ml_predict' }],
      ml_results: { churnProbability: 0.68, riskLevel: 'High' },
      rag_context: { account: 'Cedar & Co.', renewal_days: 32 },
      agent_reasoning: 'Cedar & Co. renewal is in 32 days with 6 support tickets and 68% churn risk. Recommended action trigger is to credit 1 month service and schedule an onboarding review.',
      final_decision: 'Trigger automated credit of $2,600 and schedule executive check-in with customer success team.',
      confidence_score: 0.85,
      status: 'pending',
      timestamp: '2026-02-01T15:00:00Z'
    }
  ],
  automation_rules: [
    {
      id: 'rule-1',
      user_id: DEMO_USER.id,
      workspace_id: 'default-workspace',
      name: 'High Churn Alert (>75%)',
      description: 'Notify customer success lead when account churn risk exceeds 75%',
      trigger_type: 'churn_risk_threshold',
      trigger_config: { threshold: 75, condition: 'greater_than' },
      action_type: 'create_notification',
      action_config: { priority: 'urgent', channel: 'in_app' },
      is_active: true,
      last_triggered_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 10).toISOString()
    }
  ],
  automation_logs: [
    {
      id: 'log-1',
      rule_id: 'rule-1',
      status: 'success',
      result: { matched: 1, account: 'Northstar Logistics' },
      executed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ],
  audit_logs: [
    {
      id: 'aud-1',
      user_id: DEMO_USER.id,
      action: 'LOGIN_SUCCESS',
      entity_type: 'auth',
      entity_id: DEMO_USER.id,
      details: { mode: 'zero-api-standalone' },
      ip_address: '127.0.0.1 (Local)',
      created_at: new Date().toISOString()
    }
  ],
  notifications: [
    {
      id: 'notif-1',
      user_id: DEMO_USER.id,
      title: 'Zero-API Mode Active',
      message: 'Biz Stratosphere is operating in local standalone mode with 100% offline capability.',
      type: 'info',
      read: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'notif-2',
      user_id: DEMO_USER.id,
      title: 'High Risk Account Flagged',
      message: 'Northstar Logistics (84% churn risk) requires attention.',
      type: 'warning',
      read: false,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ],
  predictions_log: [
    {
      id: 'pred-1',
      user_id: DEMO_USER.id,
      model_name: 'churn_risk_v2',
      input_data: { mrr: 48200, tickets: 9, engagement: 42 },
      prediction_result: { risk: 'High', probability: 0.84 },
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  ai_insights: [],
  chart_configurations: [],
  report_configurations: [],
  chat_conversations: [
    {
      id: 'conv-sample',
      user_id: DEMO_USER.id,
      title: 'SaaS Churn Analysis & Mitigation',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date().toISOString(),
      dataset_id: 'ds-churn-risk'
    }
  ],
  chat_messages: [
    {
      id: 'msg-1',
      conversation_id: 'conv-sample',
      role: 'user',
      content: 'What accounts are currently at critical churn risk?',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: 'msg-2',
      conversation_id: 'conv-sample',
      role: 'assistant',
      content: 'Based on your customer churn analysis dataset, **Northstar Logistics** (84% churn risk, 9 support tickets) and **Orbit Systems** (73% churn risk, renewal in 25 days) require immediate executive intervention.',
      created_at: new Date(Date.now() - 86400000 * 3 + 1000).toISOString()
    }
  ]
};

class LocalDatabase {
  private memoryTables: Map<string, any[]> = new Map();
  private subscribers: Map<string, Set<(event: string, payload: any) => void>> = new Map();

  constructor() {
    this.initTables();
  }

  private initTables() {
    for (const [table, defaultRecords] of Object.entries(SEED_DATA)) {
      let stored = this.loadFromStorage(table);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        // Migration: Ensure any data_points without user_id get DEMO_USER.id
        if (table === 'data_points') {
          stored = stored.map((r: any) => {
            if (!r.user_id) {
              return { ...r, user_id: DEMO_USER.id };
            }
            return r;
          });
          // Ensure seed records exist
          for (const def of defaultRecords) {
            if (!stored.some((r: any) => r.id === def.id)) {
              stored.push(def);
            }
          }
        }
        // Ensure agent_decision_memory seed entries exist
        if (table === 'agent_decision_memory') {
          for (const def of defaultRecords) {
            if (!stored.some((r: any) => r.id === def.id)) {
              stored.push(def);
            }
          }
        }
        this.memoryTables.set(table, stored);
        this.saveToStorage(table, stored);
      } else {
        this.memoryTables.set(table, [...defaultRecords]);
        this.saveToStorage(table, defaultRecords);
      }
    }
  }

  private getStorageKey(table: string): string {
    return `${STORAGE_PREFIX}${table}`;
  }

  private loadFromStorage(table: string): any[] | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const json = window.localStorage.getItem(this.getStorageKey(table));
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }

  private saveToStorage(table: string, records: any[]) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.getStorageKey(table), JSON.stringify(records));
      }
    } catch {
      // Ignore quota/access errors in test/private browsing
    }
  }

  public getTable(table: string): any[] {
    if (!this.memoryTables.has(table)) {
      this.memoryTables.set(table, []);
    }
    return this.memoryTables.get(table)!;
  }

  public setTable(table: string, records: any[]) {
    this.memoryTables.set(table, records);
    this.saveToStorage(table, records);
  }

  public subscribe(table: string, callback: (event: string, payload: any) => void): () => void {
    if (!this.subscribers.has(table)) {
      this.subscribers.set(table, new Set());
    }
    this.subscribers.get(table)!.add(callback);
    return () => {
      this.subscribers.get(table)?.delete(callback);
    };
  }

  public notify(table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) {
    const callbacks = this.subscribers.get(table);
    if (callbacks) {
      callbacks.forEach((cb) => cb(event, payload));
    }
  }

  public insert(table: string, record: any): any {
    const records = this.getTable(table);
    const newRecord = {
      id: record.id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: record.created_at || new Date().toISOString(),
      ...record
    };
    this.setTable(table, [...records, newRecord]);
    this.notify(table, 'INSERT', newRecord);
    return newRecord;
  }
}

export const localDb = new LocalDatabase();

/**
 * Fluent Query Builder simulating Supabase PostgREST
 */
export class LocalQueryBuilder<T = any> implements PromiseLike<{ data: T | null; error: any; count?: number }> {
  private table: string;
  private selectedColumns = '*';
  private filters: QueryFilter[] = [];
  private orders: QueryOrder[] = [];
  private limitCount?: number;
  private rangeOffset?: number;
  private rangeTo?: number;
  private isSingle = false;
  private isMaybeSingle = false;
  private countMode?: 'exact' | 'planned' | 'estimated';

  private pendingOperation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private pendingPayload: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*', options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
    if (this.pendingOperation !== 'insert' && this.pendingOperation !== 'update' && this.pendingOperation !== 'delete') {
      this.pendingOperation = 'select';
    }
    this.selectedColumns = columns;
    if (options?.count) this.countMode = options.count;
    return this;
  }

  insert(values: any | any[]) {
    this.pendingOperation = 'insert';
    this.pendingPayload = values;
    return this;
  }

  upsert(values: any | any[]) {
    this.pendingOperation = 'insert';
    this.pendingPayload = values;
    return this;
  }

  update(values: any) {
    this.pendingOperation = 'update';
    this.pendingPayload = values;
    return this;
  }

  delete() {
    this.pendingOperation = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ column, operator: 'gt', value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  is(column: string, value: any) {
    this.filters.push({ column, operator: 'is', value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.rangeOffset = from;
    this.rangeTo = to;
    return this;
  }

  single(): this {
    this.isSingle = true;
    return this;
  }

  maybeSingle(): this {
    this.isMaybeSingle = true;
    return this;
  }

  private applyFilters(records: any[]): any[] {
    return records.filter((item) => {
      return this.filters.every((f) => {
        const val = item[f.column];
        switch (f.operator) {
          case 'eq':
            return val === f.value;
          case 'neq':
            return val !== f.value;
          case 'gt':
            return val > f.value;
          case 'gte':
            return val >= f.value;
          case 'lt':
            return val < f.value;
          case 'lte':
            return val <= f.value;
          case 'in':
            return Array.isArray(f.value) && f.value.includes(val);
          case 'is':
            return val === f.value;
          default:
            return true;
        }
      });
    });
  }

  private applySorting(records: any[]): any[] {
    if (!this.orders.length) return records;
    return [...records].sort((a, b) => {
      for (const ord of this.orders) {
        const valA = a[ord.column];
        const valB = b[ord.column];
        if (valA < valB) return ord.ascending ? -1 : 1;
        if (valA > valB) return ord.ascending ? 1 : -1;
      }
      return 0;
    });
  }

  public async execute(): Promise<{ data: any; error: any; count?: number }> {
    const tableRecords = localDb.getTable(this.table);

    if (this.pendingOperation === 'insert') {
      const payload = Array.isArray(this.pendingPayload) ? this.pendingPayload : [this.pendingPayload];
      const inserted = payload.map((row) => ({
        id: row.id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        created_at: row.created_at || new Date().toISOString(),
        ...row
      }));
      localDb.setTable(this.table, [...tableRecords, ...inserted]);
      inserted.forEach((item) => localDb.notify(this.table, 'INSERT', item));
      const resData = (this.isSingle || !Array.isArray(this.pendingPayload)) ? inserted[0] : inserted;
      return { data: resData, error: null, count: inserted.length };
    }

    if (this.pendingOperation === 'update') {
      let updatedCount = 0;
      let lastUpdated: any = null;
      const updated = tableRecords.map((item) => {
        const matches = this.filters.every((f) => {
          if (f.operator === 'eq') return item[f.column] === f.value;
          return true;
        });
        if (matches) {
          updatedCount++;
          lastUpdated = { ...item, ...this.pendingPayload, updated_at: new Date().toISOString() };
          return lastUpdated;
        }
        return item;
      });
      localDb.setTable(this.table, updated);
      if (lastUpdated) localDb.notify(this.table, 'UPDATE', lastUpdated);
      return { data: this.isSingle ? lastUpdated : (lastUpdated ? [lastUpdated] : []), error: null, count: updatedCount };
    }

    if (this.pendingOperation === 'delete') {
      let deletedCount = 0;
      const remaining = tableRecords.filter((item) => {
        const matches = this.filters.every((f) => {
          if (f.operator === 'eq') return item[f.column] === f.value;
          return true;
        });
        if (matches) deletedCount++;
        return !matches;
      });
      localDb.setTable(this.table, remaining);
      localDb.notify(this.table, 'DELETE', { count: deletedCount });
      return { data: null, error: null, count: deletedCount };
    }

    // SELECT
    let result = this.applyFilters(tableRecords);
    const totalCount = result.length;
    result = this.applySorting(result);

    if (this.rangeOffset !== undefined && this.rangeTo !== undefined) {
      result = result.slice(this.rangeOffset, this.rangeTo + 1);
    } else if (this.limitCount !== undefined) {
      result = result.slice(0, this.limitCount);
    }

    if (this.isSingle) {
      return { data: result[0] || null, error: result.length ? null : { message: 'Row not found' }, count: totalCount };
    }

    if (this.isMaybeSingle) {
      return { data: result[0] || null, error: null, count: totalCount };
    }

    return { data: result, error: null, count: totalCount };
  }

  then<TResult1 = { data: T | null; error: any; count?: number }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: any; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected);
  }
}
