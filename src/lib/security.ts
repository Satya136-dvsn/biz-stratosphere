// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Security utilities — headers, CSRF, rate limiting, session management,
 * input sanitization, and suspicious-activity detection.
 *
 * ⚠️  This module is security-critical. All changes MUST be reviewed.
 */

// ─── Security Headers ────────────────────────────────────────────
export const securityHeaders = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://www.googletagmanager.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            connectSrc: [
                "'self'",
                'https://generativelanguage.googleapis.com',
                'https://*.supabase.co',
                'wss://*.supabase.co',
                'https://api.pwnedpasswords.com',
            ],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: [],
        },
    },
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
        camera: ['()'],
        microphone: ['()'],
        geolocation: ['()'],
        payment: ['()'],
        usb: ['()'],
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

// ─── CSRF Token Management ───────────────────────────────────────
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

/**
 * Timing-safe CSRF token comparison.
 * Prevents timing side-channel attacks that could leak token bytes.
 */
export function validateCSRFToken(token: string): boolean {
    const storedToken = getCSRFToken();
    if (!storedToken || storedToken.length !== token.length) return false;
    return timingSafeEqual(storedToken, token);
}

// ─── Timing-Safe Comparison ──────────────────────────────────────
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
}

// ─── Rate Limiting (Client-Side) ─────────────────────────────────
class RateLimiter {
    private requests: Map<string, number[]> = new Map();

    canMakeRequest(key: string, maxRequests: number, windowMs: number): boolean {
        const now = Date.now();
        const windowStart = now - windowMs;
        let timestamps = this.requests.get(key) || [];
        timestamps = timestamps.filter(ts => ts > windowStart);

        if (timestamps.length >= maxRequests) {
            return false;
        }

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

    reset(key: string): void {
        this.requests.delete(key);
    }
}

export const rateLimiter = new RateLimiter();

// ─── Auth Attempt Rate Limiter ───────────────────────────────────
const AUTH_RATE_LIMIT = { maxAttempts: 5, windowMs: 15 * 60 * 1000 }; // 5 per 15min

export function canAttemptLogin(): boolean {
    return rateLimiter.canMakeRequest('auth_login', AUTH_RATE_LIMIT.maxAttempts, AUTH_RATE_LIMIT.windowMs);
}

export function getRemainingLoginAttempts(): number {
    return rateLimiter.getRemainingRequests('auth_login', AUTH_RATE_LIMIT.maxAttempts, AUTH_RATE_LIMIT.windowMs);
}

// ─── Session Idle Timeout ────────────────────────────────────────
const SESSION_IDLE_KEY = 'biz_last_activity';
const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function updateLastActivity(): void {
    sessionStorage.setItem(SESSION_IDLE_KEY, Date.now().toString());
}

export function isSessionIdle(): boolean {
    const lastActivity = sessionStorage.getItem(SESSION_IDLE_KEY);
    if (!lastActivity) return false; // first load, not idle
    const elapsed = Date.now() - parseInt(lastActivity, 10);
    return elapsed > SESSION_IDLE_TIMEOUT_MS;
}

export function clearIdleTimer(): void {
    sessionStorage.removeItem(SESSION_IDLE_KEY);
}

// ─── IP Validation ───────────────────────────────────────────────
export function isValidIP(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
        return ip.split('.').every(part => {
            const n = parseInt(part);
            return n >= 0 && n <= 255;
        });
    }
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
    return ipv6Regex.test(ip);
}

// ─── Input Sanitization ─────────────────────────────────────────
export function sanitizeInput(input: string): string {
    return input
        .replace(/[<>]/g, '')             // Strip angle brackets (XSS)
        .replace(/javascript:/gi, '')     // Strip javascript: protocol
        .replace(/on\w+\s*=/gi, '')       // Strip event handlers (onclick=, etc.)
        .replace(/data:/gi, '')           // Strip data: URIs
        .replace(/vbscript:/gi, '')       // Strip vbscript: protocol
        .replace(/__proto__/gi, '')       // Prototype pollution prevention
        .replace(/constructor\s*\[/gi, '') // Prototype pollution via constructor
        .trim();
}

export function sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

/**
 * Sanitize object keys to prevent prototype pollution.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const dangerous = ['__proto__', 'constructor', 'prototype'];
    const clean = { ...obj };
    for (const key of Object.keys(clean)) {
        if (dangerous.includes(key)) {
            delete clean[key];
        }
    }
    return clean;
}

// ─── Session Security ────────────────────────────────────────────
export function validateSessionAge(createdAt: Date, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
    const age = Date.now() - createdAt.getTime();
    return age < maxAgeMs;
}

export function detectSuspiciousActivity(events: Array<{ timestamp: string; action: string }>): boolean {
    const now = Date.now();

    const rapidRequests = events.filter(e => {
        const age = now - new Date(e.timestamp).getTime();
        return age < 60000; // Last minute
    }).length > 50;

    const failedLogins = events.filter(e =>
        e.action === 'login_failure' &&
        now - new Date(e.timestamp).getTime() < 300000 // Last 5 minutes
    ).length > 5;

    return rapidRequests || failedLogins;
}

// ─── Secure Nonce Generator ─────────────────────────────────────
export function generateNonce(length: number = 16): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(length)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// ─── Password Strength Checker ──────────────────────────────────
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

// ─── Exports ─────────────────────────────────────────────────────
export const security = {
    generateCSRFToken,
    getCSRFToken,
    validateCSRFToken,
    isValidIP,
    sanitizeInput,
    sanitizeHTML,
    sanitizeObject,
    validateSessionAge,
    detectSuspiciousActivity,
    checkPasswordStrength,
    canAttemptLogin,
    getRemainingLoginAttempts,
    updateLastActivity,
    isSessionIdle,
    clearIdleTimer,
    generateNonce,
    rateLimiter,
    headers: securityHeaders,
    generateCSPHeader,
};

export default security;
