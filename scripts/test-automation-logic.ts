
/**
 * Test script to verify automation logic (Aggregations, Thresholds)
 * mimicking the Edge Function behavior.
 * 
 * Run with: npx ts-node scripts/test-automation-logic.ts
 */

const mockRules = [
    {
        id: 'rule-sum',
        name: 'Revenue Sum Check',
        enabled: true,
        condition: { metric: 'revenue', operator: '>', threshold: 1000, aggregation: 'sum', limit: 3 }
    },
    {
        id: 'rule-avg',
        name: 'Churn Avg Check',
        enabled: true,
        condition: { metric: 'churn', operator: '<', threshold: 0.05, aggregation: 'avg', limit: 5 }
    },
    {
        id: 'rule-latest',
        name: 'Latest Value Check',
        enabled: true,
        condition: { metric: 'active_users', operator: '>=', threshold: 500 } // No aggregation = latest
    }
];

const mockDataPoints = [
    { revenue: 500, churn: 0.02, active_users: 600, date: '2023-01-03' },
    { revenue: 400, churn: 0.08, active_users: 450, date: '2023-01-02' },
    { revenue: 200, churn: 0.01, active_users: 400, date: '2023-01-01' },
    { revenue: 100, churn: 0.05, active_users: 300, date: '2022-12-31' }, // Should be ignored by limit 3 in revenue sum
];

function evaluate(rule: any, data: any[]) {
    const { condition } = rule;
    let currentValue = 0;

    // Sort data descending by date (proxy: index 0 is latest for this mock)
    // Assume input mockDataPoints is already sorted or we perform sort
    const sortedData = [...data]; // Assume pre-sorted for simplicity

    if (condition.aggregation && condition.aggregation !== 'none') {
        const limit = condition.limit || 100;
        const relevantPoints = sortedData.slice(0, limit);
        const values = relevantPoints.map((p: any) => p[condition.metric] || 0);

        if (values.length > 0) {
            switch (condition.aggregation) {
                case 'sum': currentValue = values.reduce((a, b) => a + b, 0); break;
                case 'avg': currentValue = values.reduce((a, b) => a + b, 0) / values.length; break;
                case 'min': currentValue = Math.min(...values); break;
                case 'max': currentValue = Math.max(...values); break;
                case 'count': currentValue = values.length; break;
                default: currentValue = values[0];
            }
        }
    } else {
        // Latest
        currentValue = sortedData[0][condition.metric] || 0;
    }

    let triggered = false;
    const { threshold, operator } = condition;

    switch (operator) {
        case '>': triggered = currentValue > threshold; break;
        case '<': triggered = currentValue < threshold; break;
        case '=': triggered = currentValue === threshold; break;
        case '>=': triggered = currentValue >= threshold; break;
        case '<=': triggered = currentValue <= threshold; break;
    }

    return { rule: rule.name, triggered, currentValue, threshold, operator };
}

console.log('--- Starting Automation Logic Simulation ---');

mockRules.forEach(rule => {
    const result = evaluate(rule, mockDataPoints);
    console.log(`Evaluating "${result.rule}":`);
    console.log(`  Value: ${result.currentValue} ${result.operator} ${result.threshold}`);
    console.log(`  Triggered: ${result.triggered ? 'YES ✅' : 'NO ❌'}`);
    console.log('---');
});

// Verification assertions
const results = mockRules.map(r => evaluate(r, mockDataPoints));

const sumCheck = results.find(r => r.rule === 'Revenue Sum Check');
// Sum of latest 3 revenues: 500+400+200 = 1100. Threshold > 1000. Should be YES.
if (sumCheck?.currentValue !== 1100 || !sumCheck.triggered) {
    console.error('FAILED: Sum Check incorrect');
    process.exit(1);
}

const avgCheck = results.find(r => r.rule === 'Churn Avg Check');
// Avg of latest 5 (mapped to available 4): (0.02+0.08+0.01+0.05)/4 = 0.16/4 = 0.04. Threshold < 0.05. Should be YES.
// Wait, limit is 5, we have 4 points.
if (avgCheck?.currentValue !== 0.04 || !avgCheck.triggered) {
    console.error('FAILED: Avg Check incorrect');
    process.exit(1);
}

const latestCheck = results.find(r => r.rule === 'Latest Value Check');
// Latest active_users: 600. Threshold >= 500. Should be YES.
if (latestCheck?.currentValue !== 600 || !latestCheck.triggered) {
    console.error('FAILED: Latest Check incorrect');
    process.exit(1);
}

console.log('✅ ALL LOGIC TESTS PASSED');
