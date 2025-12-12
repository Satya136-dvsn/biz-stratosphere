/**
 * PII Detection Library
 * Detects Personally Identifiable Information in data uploads
 */

export interface PIIDetectionResult {
    columnName: string;
    piiTypes: PIIType[];
    confidence: 'high' | 'medium' | 'low';
    sampleValues: string[];
}

export type PIIType =
    | 'email'
    | 'phone'
    | 'ssn'
    | 'credit_card'
    | 'ip_address'
    | 'name'
    | 'address'
    | 'date_of_birth';

// Regular expressions for common PII patterns
const PII_PATTERNS = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    ssn: /^\d{3}-\d{2}-\d{4}$/,
    credit_card: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})$/,
    ip_address: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    date_of_birth: /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/,
};

// Common PII column name patterns
const PII_COLUMN_NAMES = {
    email: ['email', 'e-mail', 'email_address', 'mail'],
    phone: ['phone', 'telephone', 'mobile', 'cell', 'phone_number'],
    ssn: ['ssn', 'social_security', 'social_security_number'],
    credit_card: ['credit_card', 'card_number', 'cc', 'card'],
    name: ['name', 'first_name', 'last_name', 'full_name', 'firstname', 'lastname'],
    address: ['address', 'street', 'city', 'state', 'zip', 'postal', 'location'],
    date_of_birth: ['dob', 'birth_date', 'birthdate', 'date_of_birth'],
};

/**
 * Detect PII in a dataset
 * @param data - Array of data objects
 * @returns Array of PII detection results
 */
export function detectPII(data: Record<string, any>[]): PIIDetectionResult[] {
    if (!data || data.length === 0) return [];

    const results: PIIDetectionResult[] = [];
    const columns = Object.keys(data[0] || {});

    for (const column of columns) {
        const detectedTypes: PIIType[] = [];
        const sampleValues: string[] = [];

        // Check column name first
        const columnLower = column.toLowerCase().replace(/[_\s-]/g, '');

        for (const [piiType, patterns] of Object.entries(PII_COLUMN_NAMES)) {
            if (patterns.some(pattern => columnLower.includes(pattern.replace(/[_\s-]/g, '')))) {
                detectedTypes.push(piiType as PIIType);
            }
        }

        // Check sample values (first 10 non-null values)
        const sampleData = data
            .slice(0, 100)
            .map(row => row[column])
            .filter(val => val != null && val !== '')
            .slice(0, 10);

        for (const value of sampleData) {
            const strValue = String(value).trim();
            sampleValues.push(strValue);

            // Test against PII patterns
            if (PII_PATTERNS.email.test(strValue) && !detectedTypes.includes('email')) {
                detectedTypes.push('email');
            }
            if (PII_PATTERNS.phone.test(strValue) && !detectedTypes.includes('phone')) {
                detectedTypes.push('phone');
            }
            if (PII_PATTERNS.ssn.test(strValue) && !detectedTypes.includes('ssn')) {
                detectedTypes.push('ssn');
            }
            if (PII_PATTERNS.credit_card.test(strValue.replace(/\s/g, '')) && !detectedTypes.includes('credit_card')) {
                detectedTypes.push('credit_card');
            }
            if (PII_PATTERNS.ip_address.test(strValue) && !detectedTypes.includes('ip_address')) {
                detectedTypes.push('ip_address');
            }
            if (PII_PATTERNS.date_of_birth.test(strValue) && !detectedTypes.includes('date_of_birth')) {
                detectedTypes.push('date_of_birth');
            }
        }

        // If PII detected, add to results
        if (detectedTypes.length > 0) {
            const confidence = calculateConfidence(detectedTypes, sampleValues, columnLower);

            results.push({
                columnName: column,
                piiTypes: detectedTypes,
                confidence,
                sampleValues: sampleValues.slice(0, 3), // Only store first 3 for display
            });
        }
    }

    return results;
}

/**
 * Calculate confidence level for PII detection
 */
function calculateConfidence(
    detectedTypes: PIIType[],
    sampleValues: string[],
    columnName: string
): 'high' | 'medium' | 'low' {
    // High confidence if multiple types detected or column name matches
    if (detectedTypes.length >= 2) return 'high';

    // Check if column name strongly suggests PII
    const strongMatches = ['email', 'phone', 'ssn', 'credit_card'];
    if (strongMatches.some(type => columnName.includes(type))) return 'high';

    // Medium confidence if values match patterns
    const matchPercentage = sampleValues.length / 10; // Simplified
    if (matchPercentage > 0.7) return 'high';
    if (matchPercentage > 0.4) return 'medium';

    return 'low';
}

/**
 * Mask PII values for display
 * @param value - Original value
 * @param piiType - Type of PII
 * @returns Masked value
 */
export function maskPII(value: string, piiType: PIIType): string {
    switch (piiType) {
        case 'email':
            const [local, domain] = value.split('@');
            if (!domain) return value;
            return `${local[0]}***@${domain}`;

        case 'phone':
            return value.replace(/\d(?=\d{4})/g, '*');

        case 'ssn':
            return '***-**-' + value.slice(-4);

        case 'credit_card':
            return '**** **** **** ' + value.slice(-4);

        case 'ip_address':
            const parts = value.split('.');
            return `${parts[0]}.***.***.${parts[3]}`;

        default:
            return value.slice(0, 2) + '*'.repeat(Math.max(0, value.length - 2));
    }
}

/**
 * Get PII type display name
 */
export function getPIITypeLabel(piiType: PIIType): string {
    const labels: Record<PIIType, string> = {
        email: 'Email Address',
        phone: 'Phone Number',
        ssn: 'Social Security Number',
        credit_card: 'Credit Card',
        ip_address: 'IP Address',
        name: 'Name',
        address: 'Address',
        date_of_birth: 'Date of Birth',
    };

    return labels[piiType] || piiType;
}

/**
 * Get severity level for PII type
 */
export function getPIISeverity(piiType: PIIType): 'critical' | 'high' | 'medium' {
    const critical: PIIType[] = ['ssn', 'credit_card'];
    const high: PIIType[] = ['email', 'phone', 'date_of_birth'];

    if (critical.includes(piiType)) return 'critical';
    if (high.includes(piiType)) return 'high';
    return 'medium';
}
