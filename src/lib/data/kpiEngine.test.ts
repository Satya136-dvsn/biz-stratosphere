import { describe, it, expect } from 'vitest';
import { computeChurnKPIs } from './kpiEngine';

describe('KPI Engine Module', () => {
  const sampleAccounts = [
    { account_name: 'Northstar Logistics', mrr: 48200, churn_risk_score: 0.84, support_tickets_open: 9, days_to_renewal: 18 },
    { account_name: 'Cascade Global', mrr: 62500, churn_risk_score: 0.88, support_tickets_open: 12, usage_frequency_score: 35 },
    { account_name: 'Orbit Systems', mrr: 22100, churn_risk_score: 0.73, support_tickets_open: 7 },
    { account_name: 'Apex Retail', mrr: 76400, churn_risk_score: 0.18, support_tickets_open: 2 },
    { account_name: 'Meridian Health', mrr: 56300, churn_risk_score: 0.36, support_tickets_open: 3 },
    { account_name: 'Vanguard Dynamics', mrr: 34900, churn_risk_score: 0.81, support_tickets_open: 8, usage_frequency_score: 38 },
    { account_name: 'Helios Energy', mrr: 41000, churn_risk_score: 0.42, support_tickets_open: 4 },
    { account_name: 'Synthetix Media', mrr: 18500, churn_risk_score: 0.68, support_tickets_open: 6 },
  ];

  it('computes accurate churn KPIs for the 8 enterprise accounts', () => {
    const kpis = computeChurnKPIs(sampleAccounts);

    expect(kpis.totalMRR).toBe(359900);
    expect(kpis.activeAccounts).toBe(8);
    expect(kpis.avgDealSize).toBe(44987.5);
    // At-risk accounts (>80% risk): Northstar ($48,200), Cascade ($62,500), Vanguard ($34,900)
    // ARR = ($48,200 + $62,500 + $34,900) * 12 = $145,600 * 12 = $1,747,200
    expect(kpis.atRiskARR).toBe(1747200);
    expect(kpis.churnRate).toBe(62.5);
  });

  it('handles empty rows gracefully', () => {
    const kpis = computeChurnKPIs([]);
    expect(kpis.totalMRR).toBe(0);
    expect(kpis.activeAccounts).toBe(0);
    expect(kpis.avgDealSize).toBe(0);
    expect(kpis.atRiskARR).toBe(0);
    expect(kpis.churnRate).toBe(0);
  });

  it('handles percentage risk scores > 1 (e.g. 84 instead of 0.84)', () => {
    const rows = [
      { account_name: 'Account A', mrr: 10000, churn_risk: 85 }, // >80% risk
      { account_name: 'Account B', mrr: 5000, churn_risk: 20 },
    ];
    const kpis = computeChurnKPIs(rows);
    expect(kpis.totalMRR).toBe(15000);
    expect(kpis.activeAccounts).toBe(2);
    expect(kpis.avgDealSize).toBe(7500);
    expect(kpis.atRiskARR).toBe(120000); // 10000 * 12
    expect(kpis.churnRate).toBe(50);
  });
});
