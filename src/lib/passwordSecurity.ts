/**
 * Password Security Utilities
 * 
 * Provides password strength validation, hashing, and security best practices
 * for user authentication.
 */

import zxcvbn from 'zxcvbn';

/**
 * Password strength result
 */
export interface PasswordStrength {
    score: number; // 0-4 (0: very weak, 4: very strong)
    feedback: string[];
    isStrong: boolean;
    estimatedCrackTime: string;
}

/**
 * Password requirements configuration
 */
export const PASSWORD_REQUIREMENTS = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    minScore: 3, // Minimum zxcvbn score (0-4)
    commonPasswords: [
        'password',
        '123456',
        'qwerty',
        'admin',
        'letmein',
        'welcome',
    ],
} as const;

/**
 * Validate password strength using zxcvbn
 * 
 * @param password - Password to validate
 * @param userInputs - Additional user data to check against (email, name, etc.)
 * @returns Password strength assessment
 */
export function validatePasswordStrength(
    password: string,
    userInputs: string[] = []
): PasswordStrength {
    const result = zxcvbn(password, userInputs);
    const feedback: string[] = [];

    // Check basic requirements
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
        feedback.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
    }

    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
        feedback.push('Password must contain at least one uppercase letter');
    }

    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
        feedback.push('Password must contain at least one lowercase letter');
    }

    if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
        feedback.push('Password must contain at least one number');
    }

    if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        feedback.push('Password must contain at least one special character');
    }

    // Check against common passwords
    if (PASSWORD_REQUIREMENTS.commonPasswords.some(common =>
        password.toLowerCase().includes(common)
    )) {
        feedback.push('Password contains common words - please use a more unique password');
    }

    // Add zxcvbn feedback
    if (result.feedback.warning) {
        feedback.push(result.feedback.warning);
    }
    if (result.feedback.suggestions) {
        feedback.push(...result.feedback.suggestions);
    }

    // Format crack time estimate
    const crackTime = formatCrackTime(result.crack_times_display.offline_slow_hashing_1e4_per_second);

    return {
        score: result.score,
        feedback,
        isStrong: result.score >= PASSWORD_REQUIREMENTS.minScore && feedback.length === 0,
        estimatedCrackTime: crackTime,
    };
}

/**
 * Generate a secure random password
 * 
 * @param length - Password length (default: 16)
 * @returns Secure random password
 */
export function generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = uppercase + lowercase + numbers + special;

    // Ensure at least one of each required type
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill remaining length
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check if password has been pwned (appears in data breaches)
 * Uses Have I Been Pwned API with k-anonymity
 * 
 * @param password - Password to check
 * @returns True if password appears in breaches
 */
export async function checkPasswordPwned(password: string): Promise<boolean> {
    try {
        // Hash password with SHA-1
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

        // Use k-anonymity: only send first 5 characters
        const prefix = hashHex.substring(0, 5);
        const suffix = hashHex.substring(5);

        // Query HIBP API
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        if (!response.ok) {
            // If API fails, don't block user but log warning
            console.warn('Failed to check password against breaches');
            return false;
        }

        const data = await response.text();

        // Check if our hash suffix appears in results
        return data.includes(suffix);
    } catch (error) {
        console.error('Error checking password:', error);
        return false;
    }
}

/**
 * Format crack time estimate readably
 */
function formatCrackTime(time: string): string {
    return time.replace('less than ', '< ').replace(' seconds', 's');
}

/**
 * Password strength color mapping
 */
export function getPasswordStrengthColor(score: number): string {
    const colors = {
        0: '#ef4444', // red
        1: '#f97316', // orange
        2: '#f59e0b', // amber
        3: '#22c55e', // green
        4: '#10b981', // emerald
    };
    return colors[score as keyof typeof colors] || colors[0];
}

/**
 * Password strength label mapping
 */
export function getPasswordStrengthLabel(score: number): string {
    const labels = {
        0: 'Very Weak',
        1: 'Weak',
        2: 'Fair',
        3: 'Strong',
        4: 'Very Strong',
    };
    return labels[score as keyof typeof labels] || 'Unknown';
}

/**
 * Check if two passwords match
 */
export function passwordsMatch(password: string, confirmation: string): boolean {
    return password === confirmation && password.length > 0;
}

/**
 * Sanitize password (remove leading/trailing whitespace)
 */
export function sanitizePassword(password: string): string {
    return password.trim();
}
