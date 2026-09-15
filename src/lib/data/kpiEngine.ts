// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * KPI Engine
 * Dynamic KPI aggregation for enterprise customer churn metrics.
 * Computes MRR, active accounts, avg deal size, at-risk ARR (>80% risk), and churn rate.
 */

export interface ChurnRow {
  customer_id?: string;
  account_name?: string;
  contact_email?: string;
  contact_phone?: string;
  mrr?: number | string;
  MRR?: number | string;
  monthly_revenue?: number | string;
  revenue?: number | string;
  contract_length_months?: number | string;
  support_tickets_open?: number | string;
  usage_frequency_score?: number | string;
  days_to_renewal?: number | string;
  satisfaction_score?: number | string;
  churn_risk_score?: number | string;
  churn_risk?: number | string;
  churn_rate?: number | string;
  churnRate?: number | string;
  industry?: string;
  tier?: string;
  [key: string]: unknown;
}

export interface ChurnKPIs {
  totalMRR: number;
  activeAccounts: number;
  avgDealSize: number;
  atRiskARR: number;
  churnRate: number;
  atRiskMRR?: number;
  highRiskCount?: number;
  highRiskRate?: number;
  churnCount?: number;
  avgChurnRisk?: number;
}

/**
 * Extract numerical MRR from a row record
 */
function extractMRR(row: Record<string, unknown>): number {
  const possibleFields = ['mrr', 'MRR', 'monthly_revenue', 'Monthly_Revenue', 'revenue', 'value', 'amount'];
  for (const field of possibleFields) {
    if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
      const val = Number(row[field]);
      if (!isNaN(val)) return val;
    }
  }
  return 0;
}

/**
 * Extract normalized churn risk score [0, 1] from a row record
 */
function extractRiskScore(row: Record<string, unknown>): number {
  const possibleFields = [
    'churn_risk_score',
    'churn_risk',
    'churn_risk_pct',
    'churn_score',
    'risk_score',
    'risk',
    'churn_rate',
    'churnRate',
    'churn',
  ];

  for (const field of possibleFields) {
    if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
      const val = Number(row[field]);
      if (!isNaN(val)) {
        // If value is like 84 or 88 (percentage > 1), normalize to 0.84, 0.88
        return val > 1 ? val / 100 : val;
      }
    }
  }
  return 0;
}

/**
 * Compute Churn KPIs for a set of enterprise accounts
 *
 * @param rows Array of account rows with MRR and churn risk scores
 * @returns ChurnKPIs object containing totalMRR, activeAccounts, avgDealSize, atRiskARR (>80% risk), and churnRate
 */
export function computeChurnKPIs(rows: Record<string, unknown>[]): ChurnKPIs {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      totalMRR: 0,
      activeAccounts: 0,
      avgDealSize: 0,
      atRiskARR: 0,
      churnRate: 0,
      atRiskMRR: 0,
      highRiskCount: 0,
      highRiskRate: 0,
      churnCount: 0,
      avgChurnRisk: 0,
    };
  }

  // Filter out any empty rows
  const validRows = rows.filter((r) => r && typeof r === 'object' && Object.keys(r).length > 0);
  const activeAccounts = validRows.length;

  if (activeAccounts === 0) {
    return {
      totalMRR: 0,
      activeAccounts: 0,
      avgDealSize: 0,
      atRiskARR: 0,
      churnRate: 0,
      atRiskMRR: 0,
      highRiskCount: 0,
      highRiskRate: 0,
      churnCount: 0,
      avgChurnRisk: 0,
    };
  }

  let totalMRR = 0;
  let atRiskARR = 0;
  let atRiskMRR = 0;
  let highRiskCount = 0;
  let churnCount = 0;
  let totalRisk = 0;

  validRows.forEach((row) => {
    const mrr = extractMRR(row);
    const risk = extractRiskScore(row);

    totalMRR += mrr;
    totalRisk += risk;

    // Accounts with > 80% churn risk (0.80)
    if (risk > 0.80) {
      highRiskCount += 1;
      atRiskMRR += mrr;
      atRiskARR += mrr * 12; // Annual Recurring Revenue at risk
    }

    // Accounts classified as churning (risk >= 0.50)
    if (risk >= 0.50) {
      churnCount += 1;
    }
  });

  const avgDealSize = activeAccounts > 0 ? Math.round((totalMRR / activeAccounts) * 100) / 100 : 0;
  const churnRate = activeAccounts > 0 ? Number(((churnCount / activeAccounts) * 100).toFixed(1)) : 0;
  const highRiskRate = activeAccounts > 0 ? Number(((highRiskCount / activeAccounts) * 100).toFixed(1)) : 0;
  const avgChurnRisk = activeAccounts > 0 ? Number(((totalRisk / activeAccounts) * 100).toFixed(1)) : 0;

  return {
    totalMRR: Math.round(totalMRR * 100) / 100,
    activeAccounts,
    avgDealSize,
    atRiskARR: Math.round(atRiskARR * 100) / 100,
    churnRate,
    atRiskMRR: Math.round(atRiskMRR * 100) / 100,
    highRiskCount,
    highRiskRate,
    churnCount,
    avgChurnRisk,
  };
}
