/**
 * Standard Enterprise Mitigation Playbooks (PB-001 to PB-004)
 * Deterministic in-memory knowledge store for Zero-API RAG retrieval.
 */

export interface StandardPlaybook {
    id: string;
    code: string;
    title: string;
    category: string;
    trigger: string;
    targetRisk: string;
    owner: string;
    slaHours: number;
    summary: string;
    actionSteps: string[];
    concessions: string[];
    expectedOutcome: string;
}

export const STANDARD_PLAYBOOKS: StandardPlaybook[] = [
    {
        id: 'PB-001',
        code: 'PB-001',
        title: 'Executive Escalation & C-Level Alignment',
        category: 'Executive Retention',
        trigger: 'Account churn risk > 80% with ARR > $100k or executive disengagement',
        targetRisk: 'Critical (>80%)',
        owner: 'VP of Customer Success & Executive Sponsor',
        slaHours: 24,
        summary: 'Establish direct C-suite alignment, schedule emergency executive briefing, and formulate a joint recovery roadmap within 24 hours.',
        actionSteps: [
            'Assign VP or C-level executive sponsor within 4 hours of critical risk flag.',
            'Convene cross-functional briefing with Account Director and Engineering leads.',
            'Schedule emergency alignment call with client C-suite / VP sponsor within 24 hours.',
            'Establish joint 30-day recovery milestones and weekly executive cadence.'
        ],
        concessions: [
            'Dedicated technical account manager (TAM) allocation at zero cost',
            'Advisory board seat for product roadmap co-design'
        ],
        expectedOutcome: 'De-escalate immediate termination risk and restore executive partnership confidence.'
    },
    {
        id: 'PB-002',
        code: 'PB-002',
        title: 'Proactive Customer Outreach & Commercial Concession',
        category: 'Commercial Mitigation',
        trigger: 'Contract renewal within 30 days, churn risk > 80%, or pricing dispute',
        targetRisk: 'Critical / Elevated (>80%)',
        owner: 'Commercial Director & Renewals Manager',
        slaHours: 48,
        summary: 'Deliver structured commercial concessions, flexible billing terms, and demonstrated value packaging to secure renewal commitment.',
        actionSteps: [
            'Audit current contract terms, seat utilization, and historical billing friction.',
            'Prepare restructured renewal proposal with flexible payment schedules or 15-20% multi-year discount.',
            'Present customized commercial package to client decision-makers within 48 hours.',
            'Execute contract amendment or renewal bridge agreement.'
        ],
        concessions: [
            '15-20% renewal incentive discount on 2-year commitment',
            'Quarterly billing flexibility in lieu of annual upfront payment',
            'Unused seat credits rolled into platform add-ons and premium support'
        ],
        expectedOutcome: 'Contract renewal preservation and ARR risk mitigation.'
    },
    {
        id: 'PB-003',
        code: 'PB-003',
        title: 'Technical Architecture Review & SLA Remediation',
        category: 'Technical Recovery',
        trigger: 'Recurring API timeouts, latency spikes, or >5 unresolved P1/P2 support tickets',
        targetRisk: 'High Technical Risk (>80%)',
        owner: 'Lead Solutions Architect & Engineering On-Call',
        slaHours: 24,
        summary: 'Deploy dedicated technical architecture team, diagnose infrastructure bottlenecks, and deliver formal root cause analysis (RCA) with SLA credits.',
        actionSteps: [
            'Dispatch Principal Solutions Architect to audit client integration endpoints within 6 hours.',
            'Establish dedicated priority Slack/Teams bridge with client engineering leads.',
            'Deploy targeted infrastructure optimization or latency mitigation patch within 24 hours.',
            'Deliver signed RCA document and issue contractual SLA service credits.'
        ],
        concessions: [
            'Contractual 99.99% uptime SLA guarantee with enhanced rebate credits',
            '24/7 dedicated engineering escalation line for 90 days'
        ],
        expectedOutcome: 'Full technical stabilization and elimination of performance-induced churn.'
    },
    {
        id: 'PB-004',
        code: 'PB-004',
        title: 'Contract Restructuring & Multi-Year Renewal Incentive',
        category: 'Contractual Optimization',
        trigger: 'Budget compression, M&A organizational restructuring, or seat rightsizing',
        targetRisk: 'Elevated Risk (>75%)',
        owner: 'VP of Sales & Legal Counsel',
        slaHours: 72,
        summary: 'Restructure master service agreement into consumption-based or phased milestone tier with long-term retention lock.',
        actionSteps: [
            'Analyze true active seat usage vs licensed entitlement.',
            'Model blended pricing tier matching verified organizational headcount.',
            'Draft mutual addendum within 72 hours.',
            'Lock in 24-month or 36-month minimum term with price stability lock.'
        ],
        concessions: [
            'Transition from fixed per-seat to hybrid consumption tier',
            'Waived implementation and onboarding fees for new subsidiaries'
        ],
        expectedOutcome: 'Retain client within ecosystem while safeguarding recurring base baseline.'
    }
];

export function searchStandardPlaybooks(query: string, topK = 3): StandardPlaybook[] {
    const q = (query || '').toLowerCase();
    const scored = STANDARD_PLAYBOOKS.map(pb => {
        let score = 0;
        const text = `${pb.id} ${pb.title} ${pb.category} ${pb.trigger} ${pb.summary} ${pb.actionSteps.join(' ')}`.toLowerCase();

        // Exact code match
        if (q.includes(pb.id.toLowerCase())) score += 10;

        // Specific domain keywords
        if ((q.includes('sla') || q.includes('technical') || q.includes('timeout') || q.includes('latency') || q.includes('architecture')) && pb.id === 'PB-003') score += 6;
        if ((q.includes('executive') || q.includes('c-level') || q.includes('escalat') || q.includes('sponsor')) && pb.id === 'PB-001') score += 6;
        if ((q.includes('commercial') || q.includes('concession') || q.includes('price') || q.includes('discount') || q.includes('outreach')) && pb.id === 'PB-002') score += 6;
        if ((q.includes('restructur') || q.includes('incentive') || q.includes('multi-year') || q.includes('contract')) && pb.id === 'PB-004') score += 5;
        if (q.includes('high-risk') || q.includes('churn') || q.includes('mitigat') || q.includes('strategy')) score += 3;

        const words = q.split(/\s+/).filter(w => w.length > 2);
        for (const word of words) {
            if (text.includes(word)) score += 1;
        }

        return { pb, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(s => s.pb);
}
