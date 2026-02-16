// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Security utilities for headers, CSRF protection, and other security features
 */

// Security headers configuration
export const securityHeaders = {
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://www.googletagmanager.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            connectSrc: ["'self'", 'https://generativelanguage.googleapis.com', 'https://*.supabase.co'],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },

    // Other security headers
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
        camera: ['()'],
        microphone: ['()'],
        geolocation: ['()'],
    },
};

// Generate CSP header string
export function generateCSPHeader(): string {
    const { directives } = securityHeaders.contentSecurityPolicy;
    return Object.entries(directives)
        .map(([key, values]) => {
            const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            return values.length > 0 ? `${directive} ${values.join(' ')}` : directive;
        })
        .join('; ');
}

// CSRF Token Management
const CSRF_TOKEN_KEY = 'csrf_token';

export function generateCSRFToken(): string {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
    return token;
}

export function getCSRFToken(): string | null {
    return sessionStorage.getItem(CSRF_TOKEN_KEY);
}

export function validateCSRFToken(token: string): boolean {
    const storedToken = getCSRFToken();
    return storedToken === token;
}

// Rate Limiting (client-side)
class RateLimiter {
    private requests: Map<string, number[]> = new Map();

    canMakeRequest(key: string, maxRequests: number, windowMs: number): boolean {
        const now = Date.now();
        const windowStart = now - windowMs;

        // Get existing requests for this key
        let timestamps = this.requests.get(key) || [];

        // Filter out old requests
        timestamps = timestamps.filter(ts => ts > windowStart);

        // Check if we're under the limit
        if (timestamps.length >= maxRequests) {
            return false;
        }

        // Add this request
        timestamps.push(now);
        this.requests.set(key, timestamps);

        return true;
    }

    getRemainingRequests(key: string, maxRequests: number, windowMs: number): number {
        const now = Date.now();
        const windowStart = now - windowMs;

        const timestamps = (this.requests.get(key) || []).filter(ts => ts > windowStart);
        return Math.max(0, maxRequests - timestamps.length);
    }
}

export const rateLimiter = new RateLimiter();

// IP Validation
export function isValidIP(ip: string): boolean {
    // IPv4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
        const parts = ip.split('.');
        return parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
    }

    // IPv6 (basic check)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
    return ipv6Regex.test(ip);
}

// Input Sanitization
export function sanitizeInput(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
}

export function sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

// Session Security
export function validateSessionAge(createdAt: Date, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
    const age = Date.now() - createdAt.getTime();
    return age < maxAgeMs;
}

export function detectSuspiciousActivity(events: any[]): boolean {
    // Simple heuristics for suspicious activity
    const rapidRequests = events.filter(e => {
        const age = Date.now() - new Date(e.timestamp).getTime();
        return age < 60000; // Last minute
    }).length > 50;

    const failedLogins = events.filter(e =>
        e.action === 'login_failure' &&
        Date.now() - new Date(e.timestamp).getTime() < 300000 // Last 5 minutes
    ).length > 5;

    return rapidRequests || failedLogins;
}

// Password Strength Checker
export function checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
} {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push('Password should be at least 8 characters');

    if (password.length >= 12) score++;

    if (/[a-z]/.test(password)) score++;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Add uppercase letters');

    if (/[0-9]/.test(password)) score++;
    else feedback.push('Add numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score++;
    else feedback.push('Add special characters');

    return { score, feedback };
}

// Export all utilities
export const security = {
    generateCSRFToken,
    getCSRFToken,
    validateCSRFToken,
    isValidIP,
    sanitizeInput,
    sanitizeHTML,
    validateSessionAge,
    detectSuspiciousActivity,
    checkPasswordStrength,
    rateLimiter,
    headers: securityHeaders,
    generateCSPHeader,
};

export default security;
