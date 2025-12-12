/**
 * PII Detection Library
 * Comprehensive detection of Personally Identifiable Information
 */

// PII Regex Patterns
export const PII_PATTERNS = {
    // Email addresses
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

    // Phone numbers (US format)
    phone: /\b(?:\+?1[-.\s]?)?(?:\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,

    // Social Security Numbers (US)
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,

    // Credit Card Numbers
    credit_card: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,

    // IP Addresses (IPv4)
    ip_address: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,

    // ZIP Codes (US)
    zip_code: /\b\d{5}(?:-\d{4})?\b/g,

    // Dates of Birth (various formats)
    date_of_birth: /\b(?:0[1-9]|1[0-2])[/-](?:0[1-9]|[12]\d|3[01])[/-](?:19|20)\d{2}\b/g,

    // Driver's License (generic pattern)
    drivers_license: /\b[A-Z]{1,2}\d{6,8}\b/g,

    // Passport Numbers (generic)
    passport: /\b[A-Z0-9]{6,9}\b/g,
} as const;

// Common PII column name keywords
export const PII_COLUMN_KEYWORDS = [
    'email',
    'phone',
    'ssn',
    'social_security',
    'credit',
    'card',
    'password',
    'pass',
    'address',
    'street',
    'ip',
    'dob',
    'birth',
    'license',
    'passport',
    'name',
    'first_name',
    'last_name',
    'full_name',
    'zip',
    'postal',
] as const;

export interface PIIDetectionResult {
    column: string;
    type: string;
    count: number;
    samples: string[];
    confidence: 'high' | 'medium' | 'low';
}

export interface PIIScanResult {
    hasPII: boolean;
    piiColumns: PIIDetectionResult[];
    totalPIICount: number;
}

/**
 * Scan data for PII
 */
export function scanDataForPII(data: any[], columns: string[]): PIIScanResult {
    const piiColumns: PIIDetectionResult[] = [];

    columns.forEach((column) => {
        const columnData = data
            .map((row) => String(row[column] || ''))
            .filter(Boolean);

        if (columnData.length === 0) return;

        // Check patterns
        Object.entries(PII_PATTERNS).forEach(([type, pattern]) => {
            const allMatches: string[] = [];
            columnData.forEach((value) => {
                const matches = value.match(pattern);
                if (matches) {
                    allMatches.push(...matches);
                }
            });

            if (allMatches.length > 0) {
                piiColumns.push({
                    column,
                    type,
                    count: allMatches.length,
                    samples: [...new Set(allMatches)].slice(0, 3),
                    confidence: 'high',
                });
            }
        });

        // Check column names for PII keywords
        const columnLower = column.toLowerCase();
        const hasKeyword = PII_COLUMN_KEYWORDS.some((keyword) =>
            columnLower.includes(keyword)
        );

        if (hasKeyword && !piiColumns.some((p) => p.column === column)) {
            piiColumns.push({
                column,
                type: 'potential_pii',
                count: columnData.length,
                samples: columnData.slice(0, 3),
                confidence: 'medium',
            });
        }
    });

    return {
        hasPII: piiColumns.length > 0,
        piiColumns,
        totalPIICount: piiColumns.reduce((sum, col) => sum + col.count, 0),
    };
}

/**
 * Mask PII value
 */
export function maskPIIValue(value: string, type: string): string {
    switch (type) {
        case 'email':
            const [local, domain] = value.split('@');
            return `${local[0]}${'*'.repeat(local.length - 1)}@${domain}`;
        case 'phone':
            return `***-***-${value.slice(-4)}`;
        case 'ssn':
            return `***-**-${value.slice(-4)}`;
        case 'credit_card':
            return `****-****-****-${value.slice(-4)}`;
        default:
            return '*'.repeat(Math.min(value.length, 10));
    }
}

/**
 * Validate if user has consented to PII processing
 */
export function validatePIIConsent(hasPII: boolean, consent: boolean): boolean {
    if (!hasPII) return true; // No PII, no consent needed
    return consent; // Must have consent if PII present
}

/**
 * Generate PII detection report
 */
export function generatePIIReport(scanResult: PIIScanResult): string {
    if (!scanResult.hasPII) {
        return 'No PII detected in the uploaded data.';
    }

    let report = `PII Detection Report\n\n`;
    report += `Total PII Columns: ${scanResult.piiColumns.length}\n`;
    report += `Total PII Values: ${scanResult.totalPIICount}\n\n`;

    report += `Detected Columns:\n`;
    scanResult.piiColumns.forEach((col) => {
        report += `- ${col.column}: ${col.type.replace(/_/g, ' ')} (${col.confidence} confidence, ${col.count} values)\n`;
    });

    return report;
}
