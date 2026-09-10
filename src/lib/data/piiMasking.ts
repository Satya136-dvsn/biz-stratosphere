// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * PII Masking Utilities
 * High-performance regex-based PII scrubbing for emails and phone numbers.
 * Masks email addresses to d***@***.com and phone numbers to +1-***-***-8841 format.
 */

// Regex patterns for detecting and matching PII
export const EMAIL_PATTERN = /\b([a-zA-Z0-9_.+-])[a-zA-Z0-9_.+-]*@(?:[a-zA-Z0-9-]+\.)*([a-zA-Z]{2,})\b/g;
export const PHONE_PATTERN = /(?:\+(\d{1,3})[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?(\d{4})\b/g;

const EMAIL_TEST_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
const PHONE_TEST_REGEX = /^(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/;

/**
 * Check if a string is an email address
 */
export function isEmail(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  return EMAIL_TEST_REGEX.test(val.trim());
}

/**
 * Check if a string is a phone number
 */
export function isPhone(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  const cleaned = val.trim();
  if (cleaned.includes('***')) return false;
  return PHONE_TEST_REGEX.test(cleaned);
}

/**
 * Mask an email address to standard format: d***@***.com
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return email;
  const trimmed = email.trim();
  if (trimmed.includes('***@***')) return trimmed; // Already masked

  return trimmed.replace(EMAIL_PATTERN, (_match, firstChar: string, tld: string) => {
    return `${firstChar.toLowerCase()}***@***.${tld.toLowerCase()}`;
  });
}

/**
 * Mask a phone number to standard format: +1-***-***-8841
 */
export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return phone;
  const trimmed = phone.trim();
  if (trimmed.includes('***-***-')) return trimmed; // Already masked

  return trimmed.replace(PHONE_PATTERN, (_match, countryCode: string | undefined, last4: string) => {
    const prefix = countryCode ? `+${countryCode}-` : '+1-';
    return `${prefix}***-***-${last4}`;
  });
}

/**
 * Mask any PII found in free text (emails and phone numbers)
 */
export function maskPIIText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return maskPhone(maskEmail(text));
}

/**
 * Mask PII fields within a single record/row object
 */
export function maskRowPII<T extends Record<string, any>>(row: T): T {
  if (!row || typeof row !== 'object') return row;
  const masked: Record<string, any> = Array.isArray(row) ? [...row] : { ...row };

  for (const [key, val] of Object.entries(masked)) {
    if (typeof val === 'string') {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('email') || lowerKey === 'mail') {
        masked[key] = maskEmail(val);
      } else if (
        lowerKey.includes('phone') ||
        lowerKey.includes('mobile') ||
        lowerKey.includes('tel') ||
        lowerKey.includes('cell')
      ) {
        masked[key] = maskPhone(val);
      } else {
        if (isEmail(val)) {
          masked[key] = maskEmail(val);
        } else if (isPhone(val)) {
          masked[key] = maskPhone(val);
        }
      }
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      masked[key] = maskRowPII(val);
    }
  }

  return masked as T;
}

/**
 * Mask PII across an array of row objects
 */
export function maskRowsPII<T extends Record<string, any>>(rows: T[]): T[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => maskRowPII(row));
}
