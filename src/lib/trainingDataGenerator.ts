// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import * as tf from '@tensorflow/tfjs';

/**
 * Generate realistic customer churn training data
 * Creates correlations that make business sense
 */
export function generateChurnTrainingData(numSamples: number = 1000) {
    const data: { features: number[]; label: number }[] = [];

    for (let i = 0; i < numSamples; i++) {
        // Generate base features with realistic ranges
        const usageFrequency = Math.random() * 100; // 0-100
        const supportTickets = Math.floor(Math.random() * 21); // 0-20
        const tenureMonths = Math.floor(Math.random() * 60) + 1; // 1-60
        const monthlySpend = 10 + Math.random() * 490; // $10-500
        const featureUsagePct = Math.random() * 100; // 0-100%

        // Calculate churn probability based on realistic business logic
        // High tickets + low usage + short tenure + low spend = HIGH churn risk
        let churnScore = 0;

        // Low usage is a strong churn indicator
        churnScore += (100 - usageFrequency) * 0.35;

        // Many support tickets indicate problems
        churnScore += supportTickets * 3;

        // Short tenure means not established customer
        churnScore += (60 - tenureMonths) * 0.4;

        // Low spend suggests low value/engagement
        churnScore += (500 - monthlySpend) * 0.08;

        // Low feature usage shows disengagement  
        churnScore += (100 - featureUsagePct) * 0.25;

        // Add some randomness (real world isn't perfect)
        churnScore += (Math.random() - 0.5) * 30;

        // Determine churn (threshold tuned for ~40% churn rate)
        const churned = churnScore > 140 ? 1 : 0;

        data.push({
            features: [usageFrequency, supportTickets, tenureMonths, monthlySpend, featureUsagePct],
            label: churned,
        });
    }

    // Shuffle data for better training
    return shuffleArray(data);
}

/**
 * Generate realistic revenue forecasting training data
 * Creates correlations between business metrics and revenue
 */
export function generateRevenueTrainingData(numSamples: number = 1000) {
    const data: { features: number[]; label: number }[] = [];

    for (let i = 0; i < numSamples; i++) {
        // Generate base business metrics
        const numCustomers = 10 + Math.floor(Math.random() * 990); // 10-1000
        const avgDealSize = 100 + Math.random() * 9900; // $100-10,000
        const marketingSpend = 1000 + Math.random() * 49000; // $1k-50k
        const salesTeamSize = 1 + Math.floor(Math.random() * 50); // 1-50
        const marketGrowthPct = -10 + Math.random() * 40; // -10% to 30%

        // Calculate revenue with realistic business logic
        // Revenue = (customers × deal size) with various modifiers
        let baseRevenue = numCustomers * avgDealSize;

        // Marketing spend increases revenue (diminishing returns)
        const marketingMultiplier = 1 + (Math.sqrt(marketingSpend) / 1000) * 0.1;
        baseRevenue *= marketingMultiplier;

        // Sales team size helps (but with diminishing returns)
        const salesMultiplier = 1 + (Math.sqrt(salesTeamSize) / 10) * 0.15;
        baseRevenue *= salesMultiplier;

        // Market growth affects revenue linearly
        const growthMultiplier = 1 + (marketGrowthPct / 100);
        baseRevenue *= growthMultiplier;

        // Add some realistic variance (±20%)
        const variance = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        const revenue = baseRevenue * variance;

        // Store revenue in thousands (easier for model to learn)
        // Range will be roughly 1-15000 (representing $1K-$15M)
        const revenueInThousands = revenue / 1000;

        data.push({
            features: [numCustomers, avgDealSize, marketingSpend, salesTeamSize, marketGrowthPct],
            label: revenueInThousands,
        });
    }

    return shuffleArray(data);
}

/**
 * Shuffle array for better training distribution
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Split data into training and validation sets
 */
export function splitTrainTest<T>(
    data: T[],
    trainRatio: number = 0.8
): { train: T[]; test: T[] } {
    const trainSize = Math.floor(data.length * trainRatio);
    return {
        train: data.slice(0, trainSize),
        test: data.slice(trainSize),
    };
}

/**
 * Get statistics about generated data
 */
export function getDataStats(data: { features: number[]; label: number }[]) {
    const labels = data.map(d => d.label);
    const sum = labels.reduce((a, b) => a + b, 0);
    const mean = sum / labels.length;

    // For binary classification (churn)
    if (labels.every(l => l === 0 || l === 1)) {
        const positiveCount = labels.filter(l => l === 1).length;
        return {
            totalSamples: data.length,
            positiveRate: (positiveCount / data.length * 100).toFixed(1) + '%',
            type: 'classification',
        };
    }

    // For regression (revenue)
    const min = Math.min(...labels);
    const max = Math.max(...labels);
    return {
        totalSamples: data.length,
        mean: mean.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        type: 'regression',
    };
}
