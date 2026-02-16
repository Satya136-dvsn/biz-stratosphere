// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * CSV Parser for ML Training Data
 * Validates and converts CSV files to training data format
 */

export interface TrainingDataRow {
    features: number[];
    label: number;
}

export interface CSVParseResult {
    success: boolean;
    data?: TrainingDataRow[];
    errors?: string[];
    stats?: {
        totalRows: number;
        validRows: number;
        invalidRows: number;
    };
}

/**
 * Parse churn model CSV
 * Expected format: usage_frequency,support_tickets,tenure_months,monthly_spend,feature_usage_pct,churned
 */
export function parseChurnCSV(csvText: string): CSVParseResult {
    const errors: string[] = [];
    const data: TrainingDataRow[] = [];

    try {
        const lines = csvText.trim().split('\n');

        if (lines.length < 2) {
            return {
                success: false,
                errors: ['CSV file must contain at least a header row and one data row'],
            };
        }

        // Parse header
        const header = lines[0].toLowerCase().split(',').map(h => h.trim());
        const requiredColumns = [
            'usage_frequency',
            'support_tickets',
            'tenure_months',
            'monthly_spend',
            'feature_usage_pct',
            'churned'
        ];

        // Validate header
        const missingColumns = requiredColumns.filter(col => !header.includes(col));
        if (missingColumns.length > 0) {
            return {
                success: false,
                errors: [`Missing required columns: ${missingColumns.join(', ')}`],
            };
        }

        // Get column indices
        const indices = {
            usage_frequency: header.indexOf('usage_frequency'),
            support_tickets: header.indexOf('support_tickets'),
            tenure_months: header.indexOf('tenure_months'),
            monthly_spend: header.indexOf('monthly_spend'),
            feature_usage_pct: header.indexOf('feature_usage_pct'),
            churned: header.indexOf('churned'),
        };

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Skip empty lines

            const values = line.split(',').map(v => v.trim());

            if (values.length !== header.length) {
                errors.push(`Row ${i + 1}: Expected ${header.length} columns, got ${values.length}`);
                continue;
            }

            try {
                const usageFreq = parseFloat(values[indices.usage_frequency]);
                const supportTickets = parseFloat(values[indices.support_tickets]);
                const tenureMonths = parseFloat(values[indices.tenure_months]);
                const monthlySpend = parseFloat(values[indices.monthly_spend]);
                const featureUsage = parseFloat(values[indices.feature_usage_pct]);
                const churned = parseFloat(values[indices.churned]);

                // Validate ranges with specific error messages
                if (isNaN(usageFreq)) {
                    errors.push(`Row ${i + 1}: usage_frequency must be a number (got: "${values[indices.usage_frequency]}")`);
                    continue;
                }
                if (usageFreq < 0 || usageFreq > 100) {
                    errors.push(`Row ${i + 1}: usage_frequency must be 0-100 (got: ${usageFreq})`);
                    continue;
                }

                if (isNaN(supportTickets)) {
                    errors.push(`Row ${i + 1}: support_tickets must be a number (got: "${values[indices.support_tickets]}")`);
                    continue;
                }
                if (supportTickets < 0) {
                    errors.push(`Row ${i + 1}: support_tickets must be >= 0 (got: ${supportTickets})`);
                    continue;
                }

                if (isNaN(tenureMonths)) {
                    errors.push(`Row ${i + 1}: tenure_months must be a number (got: "${values[indices.tenure_months]}")`);
                    continue;
                }
                if (tenureMonths < 0) {
                    errors.push(`Row ${i + 1}: tenure_months must be >= 0 (got: ${tenureMonths})`);
                    continue;
                }

                if (isNaN(monthlySpend)) {
                    errors.push(`Row ${i + 1}: monthly_spend must be a number (got: "${values[indices.monthly_spend]}")`);
                    continue;
                }
                if (monthlySpend < 0) {
                    errors.push(`Row ${i + 1}: monthly_spend must be >= 0 (got: ${monthlySpend})`);
                    continue;
                }

                if (isNaN(featureUsage)) {
                    errors.push(`Row ${i + 1}: feature_usage_pct must be a number (got: "${values[indices.feature_usage_pct]}")`);
                    continue;
                }
                if (featureUsage < 0 || featureUsage > 100) {
                    errors.push(`Row ${i + 1}: feature_usage_pct must be 0-100 (got: ${featureUsage})`);
                    continue;
                }

                if (isNaN(churned)) {
                    errors.push(`Row ${i + 1}: churned must be 0 or 1 (got: "${values[indices.churned]}")`);
                    continue;
                }
                if (churned !== 0 && churned !== 1) {
                    errors.push(`Row ${i + 1}: churned must be exactly 0 (stayed) or 1 (churned) (got: ${churned})`);
                    continue;
                }

                data.push({
                    features: [usageFreq, supportTickets, tenureMonths, monthlySpend, featureUsage],
                    label: churned,
                });
            } catch (error) {
                errors.push(`Row ${i + 1}: Failed to parse row - check all values are numbers in correct format`);
            }
        }

        return {
            success: data.length > 0,
            data,
            errors: errors.length > 0 ? errors : undefined,
            stats: {
                totalRows: lines.length - 1,
                validRows: data.length,
                invalidRows: lines.length - 1 - data.length,
            },
        };
    } catch (error: any) {
        return {
            success: false,
            errors: [`Failed to parse CSV: ${error.message}`],
        };
    }
}

/**
 * Parse revenue model CSV
 * Expected format: num_customers,avg_deal_size,marketing_spend,sales_team_size,market_growth_pct,revenue
 */
export function parseRevenueCSV(csvText: string): CSVParseResult {
    const errors: string[] = [];
    const data: TrainingDataRow[] = [];

    try {
        const lines = csvText.trim().split('\n');

        if (lines.length < 2) {
            return {
                success: false,
                errors: ['CSV file must contain at least a header row and one data row'],
            };
        }

        // Parse header
        const header = lines[0].toLowerCase().split(',').map(h => h.trim());
        const requiredColumns = [
            'num_customers',
            'avg_deal_size',
            'marketing_spend',
            'sales_team_size',
            'market_growth_pct',
            'revenue'
        ];

        // Validate header
        const missingColumns = requiredColumns.filter(col => !header.includes(col));
        if (missingColumns.length > 0) {
            return {
                success: false,
                errors: [`Missing required columns: ${missingColumns.join(', ')}`],
            };
        }

        // Get column indices
        const indices = {
            num_customers: header.indexOf('num_customers'),
            avg_deal_size: header.indexOf('avg_deal_size'),
            marketing_spend: header.indexOf('marketing_spend'),
            sales_team_size: header.indexOf('sales_team_size'),
            market_growth_pct: header.indexOf('market_growth_pct'),
            revenue: header.indexOf('revenue'),
        };

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map(v => v.trim());

            if (values.length !== header.length) {
                errors.push(`Row ${i + 1}: Expected ${header.length} columns, got ${values.length}`);
                continue;
            }

            try {
                const numCustomers = parseFloat(values[indices.num_customers]);
                const avgDealSize = parseFloat(values[indices.avg_deal_size]);
                const marketingSpend = parseFloat(values[indices.marketing_spend]);
                const salesTeamSize = parseFloat(values[indices.sales_team_size]);
                const marketGrowth = parseFloat(values[indices.market_growth_pct]);
                const revenue = parseFloat(values[indices.revenue]);

                // Validate data with specific error messages
                if (isNaN(numCustomers)) {
                    errors.push(`Row ${i + 1}: num_customers must be a number (got: "${values[indices.num_customers]}")`);
                    continue;
                }
                if (numCustomers < 0) {
                    errors.push(`Row ${i + 1}: num_customers must be >= 0 (got: ${numCustomers})`);
                    continue;
                }

                if (isNaN(avgDealSize)) {
                    errors.push(`Row ${i + 1}: avg_deal_size must be a number (got: "${values[indices.avg_deal_size]}")`);
                    continue;
                }
                if (avgDealSize < 0) {
                    errors.push(`Row ${i + 1}: avg_deal_size must be >= 0 (got: ${avgDealSize})`);
                    continue;
                }

                if (isNaN(marketingSpend)) {
                    errors.push(`Row ${i + 1}: marketing_spend must be a number (got: "${values[indices.marketing_spend]}")`);
                    continue;
                }
                if (marketingSpend < 0) {
                    errors.push(`Row ${i + 1}: marketing_spend must be >= 0 (got: ${marketingSpend})`);
                    continue;
                }

                if (isNaN(salesTeamSize)) {
                    errors.push(`Row ${i + 1}: sales_team_size must be a number (got: "${values[indices.sales_team_size]}")`);
                    continue;
                }
                if (salesTeamSize < 0) {
                    errors.push(`Row ${i + 1}: sales_team_size must be >= 0 (got: ${salesTeamSize})`);
                    continue;
                }

                if (isNaN(marketGrowth)) {
                    errors.push(`Row ${i + 1}: market_growth_pct must be a number (got: "${values[indices.market_growth_pct]}")`);
                    continue;
                }

                if (isNaN(revenue)) {
                    errors.push(`Row ${i + 1}: revenue must be a number (got: "${values[indices.revenue]}")`);
                    continue;
                }
                if (revenue < 0) {
                    errors.push(`Row ${i + 1}: revenue must be >= 0 (got: ${revenue})`);
                    continue;
                }

                // Convert revenue to thousands for model training
                const revenueInThousands = revenue / 1000;

                data.push({
                    features: [numCustomers, avgDealSize, marketingSpend, salesTeamSize, marketGrowth],
                    label: revenueInThousands,
                });
            } catch (error) {
                errors.push(`Row ${i + 1}: Failed to parse row - check all values are numbers in correct format`);
            }
        }

        return {
            success: data.length > 0,
            data,
            errors: errors.length > 0 ? errors : undefined,
            stats: {
                totalRows: lines.length - 1,
                validRows: data.length,
                invalidRows: lines.length - 1 - data.length,
            },
        };
    } catch (error: any) {
        return {
            success: false,
            errors: [`Failed to parse CSV: ${error.message}`],
        };
    }
}

/**
 * Generate CSV template for download
 */
export function generateChurnTemplate(): string {
    return `usage_frequency,support_tickets,tenure_months,monthly_spend,feature_usage_pct,churned
75,2,24,250,80,0
30,8,6,80,35,1
90,1,48,400,95,0
45,5,12,150,60,1`;
}

export function generateRevenueTemplate(): string {
    return `num_customers,avg_deal_size,marketing_spend,sales_team_size,market_growth_pct,revenue
250,2500,15000,10,5,1500000
100,5000,8000,5,3,800000
500,1500,25000,20,8,2500000
150,3000,12000,8,4,1200000`;
}
