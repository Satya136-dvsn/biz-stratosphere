// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Tests for password security utilities
 * 
 * Tests password strength validation, breach checking,
 * and secure password generation.
 */

import { describe, it, expect, vi } from 'vitest';
import {
    validatePasswordStrength,
    generateSecurePassword,
    checkPasswordPwned,
    getPasswordStrengthColor,
    getPasswordStrengthLabel,
    passwordsMatch,
    sanitizePassword,
    PASSWORD_REQUIREMENTS,
} from './passwordSecurity';

describe('Password Security', () => {
    describe('Password Strength Validation', () => {
        it('should reject passwords that are too short', () => {
            const result = validatePasswordStrength('Short1!');

            expect(result.isStrong).toBe(false);
            expect(result.feedback).toEqual(
                expect.arrayContaining([expect.stringContaining('at least 12 characters')])
            );
        });

        it('should reject passwords without uppercase letters', () => {
            const result = validatePasswordStrength('nocapitals123!');

            expect(result.isStrong).toBe(false);
            expect(result.feedback).toEqual(
                expect.arrayContaining([expect.stringContaining('uppercase letter')])
            );
        });

        it('should reject passwords without lowercase letters', () => {
            const result = validatePasswordStrength('NOLOWERCASE123!');

            expect(result.isStrong).toBe(false);
            expect(result.feedback).toEqual(
                expect.arrayContaining([expect.stringContaining('lowercase letter')])
            );
        });

        it('should reject passwords without numbers', () => {
            const result = validatePasswordStrength('NoNumbers!@#$');

            expect(result.isStrong).toBe(false);
            expect(result.feedback).toEqual(
                expect.arrayContaining([expect.stringContaining('number')])
            );
        });

        it('should reject passwords without special characters', () => {
            const result = validatePasswordStrength('NoSpecialChars123');

            expect(result.isStrong).toBe(false);
            expect(result.feedback).toEqual(
                expect.arrayContaining([expect.stringContaining('special character')])
            );
        });

        it('should reject common passwords', () => {
            const result = validatePasswordStrength('Password123!');

            expect(result.isStrong).toBe(false);
            expect(result.feedback).toEqual(
                expect.arrayContaining([expect.stringContaining('common')])
            );
        });

        it('should accept strong passwords', () => {
            const result = validatePasswordStrength('MyS3cur3P@ssw0rd!2024');

            expect(result.score).toBeGreaterThanOrEqual(3);
            expect(result.isStrong).toBe(true);
        });

        it('should provide feedback array', () => {
            const result = validatePasswordStrength('weak');

            expect(Array.isArray(result.feedback)).toBe(true);
            expect(result.feedback.length).toBeGreaterThan(0);
        });

        it('should include crack time estimate', () => {
            const result = validatePasswordStrength('MyS3cur3P@ssw0rd!');

            expect(result.estimatedCrackTime).toBeDefined();
            expect(typeof result.estimatedCrackTime).toBe('string');
        });

        it('should score passwords from 0-4', () => {
            const weak = validatePasswordStrength('123456');
            const strong = validatePasswordStrength('MyVeryS3cur3P@ssw0rd!2024#Complex');

            expect(weak.score).toBeGreaterThanOrEqual(0);
            expect(weak.score).toBeLessThanOrEqual(4);
            expect(strong.score).toBeGreaterThanOrEqual(0);
            expect(strong.score).toBeLessThanOrEqual(4);
            expect(strong.score).toBeGreaterThan(weak.score);
        });

        it('should check against user inputs', () => {
            const userInputs = ['john', 'doe', 'john@example.com'];
            const result = validatePasswordStrength('JohnDoe123!', userInputs);

            // Password containing user's name should score lower
            expect(result.score).toBeLessThan(4);
        });
    });

    describe('Secure Password Generation', () => {
        it('should generate password of correct length', () => {
            const password = generateSecurePassword(16);

            expect(password.length).toBe(16);
        });

        it('should generate password with default length', () => {
            const password = generateSecurePassword();

            expect(password.length).toBe(16); // Default length
        });

        it('should include uppercase letters', () => {
            const password = generateSecurePassword(20);

            expect(password).toMatch(/[A-Z]/);
        });

        it('should include lowercase letters', () => {
            const password = generateSecurePassword(20);

            expect(password).toMatch(/[a-z]/);
        });

        it('should include numbers', () => {
            const password = generateSecurePassword(20);

            expect(password).toMatch(/[0-9]/);
        });

        it('should include special characters', () => {
            const password = generateSecurePassword(20);

            expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
        });

        it('should generate unique passwords', () => {
            const password1 = generateSecurePassword();
            const password2 = generateSecurePassword();

            expect(password1).not.toBe(password2);
        });

        it('should generate strong passwords', () => {
            const password = generateSecurePassword(16);
            const result = validatePasswordStrength(password);

            expect(result.score).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Password Breach Checking', () => {
        const originalFetch = global.fetch;

        beforeEach(() => {
            // Default mock for most tests - return empty unless specified
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                text: () => Promise.resolve(''),
            });
        });

        afterEach(() => {
            global.fetch = originalFetch;
        });

        it('should detect commonly breached password', async () => {
            // SHA-1 of 'password' is 5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8
            // Prefix: 5BAA6, Suffix: 1E4C9B93F3F0682250B6CF8331B7EE68FD8

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                text: () => Promise.resolve('1E4C9B93F3F0682250B6CF8331B7EE68FD8:12345\n0000000000000000000000000000000000000000:1'),
            });

            const isBreached = await checkPasswordPwned('password');

            expect(isBreached).toBe(true);
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('5BAA6'));
        });

        it('should not falsely report strong unique password as breached', async () => {
            // Mock empty response (no matches found)
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                text: () => Promise.resolve(''),
            });

            const uniquePassword = `Unique${Date.now()}!@#$${Math.random()}`;
            const isBreached = await checkPasswordPwned(uniquePassword);

            expect(isBreached).toBe(false);
        });

        it('should handle API failures gracefully', async () => {
            // Mock fetch to simulate API failure
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            const isBreached = await checkPasswordPwned('testPassword123!');

            // Should return false on error, not throw
            expect(isBreached).toBe(false);
        });
    });

    describe('Password Strength Helpers', () => {
        it('should return correct color for score 0', () => {
            const color = getPasswordStrengthColor(0);
            expect(color).toBe('#ef4444'); // red
        });

        it('should return correct color for score 4', () => {
            const color = getPasswordStrengthColor(4);
            expect(color).toBe('#10b981'); // emerald
        });

        it('should return correct label for score 0', () => {
            const label = getPasswordStrengthLabel(0);
            expect(label).toBe('Very Weak');
        });

        it('should return correct label for score 4', () => {
            const label = getPasswordStrengthLabel(4);
            expect(label).toBe('Very Strong');
        });
    });

    describe('Password Matching', () => {
        it('should return true for matching passwords', () => {
            const password = 'MyPassword123!';
            const confirmation = 'MyPassword123!';

            expect(passwordsMatch(password, confirmation)).toBe(true);
        });

        it('should return false for non-matching passwords', () => {
            const password = 'MyPassword123!';
            const confirmation = 'DifferentPassword456!';

            expect(passwordsMatch(password, confirmation)).toBe(false);
        });

        it('should return false for empty passwords', () => {
            expect(passwordsMatch('', '')).toBe(false);
        });
    });

    describe('Password Sanitization', () => {
        it('should trim leading whitespace', () => {
            const sanitized = sanitizePassword('  password');
            expect(sanitized).toBe('password');
        });

        it('should trim trailing whitespace', () => {
            const sanitized = sanitizePassword('password  ');
            expect(sanitized).toBe('password');
        });

        it('should trim both leading and trailing whitespace', () => {
            const sanitized = sanitizePassword('  password  ');
            expect(sanitized).toBe('password');
        });

        it('should preserve internal spaces', () => {
            const sanitized = sanitizePassword('my password');
            expect(sanitized).toBe('my password');
        });
    });

    describe('Password Requirements Configuration', () => {
        it('should have defined minimum length', () => {
            expect(PASSWORD_REQUIREMENTS.minLength).toBeDefined();
            expect(PASSWORD_REQUIREMENTS.minLength).toBeGreaterThan(0);
        });

        it('should have complexity requirements', () => {
            expect(PASSWORD_REQUIREMENTS.requireUppercase).toBeDefined();
            expect(PASSWORD_REQUIREMENTS.requireLowercase).toBeDefined();
            expect(PASSWORD_REQUIREMENTS.requireNumbers).toBeDefined();
            expect(PASSWORD_REQUIREMENTS.requireSpecialChars).toBeDefined();
        });

        it('should have minimum score requirement', () => {
            expect(PASSWORD_REQUIREMENTS.minScore).toBeDefined();
            expect(PASSWORD_REQUIREMENTS.minScore).toBeGreaterThanOrEqual(0);
            expect(PASSWORD_REQUIREMENTS.minScore).toBeLessThanOrEqual(4);
        });

        it('should have common passwords list', () => {
            expect(Array.isArray(PASSWORD_REQUIREMENTS.commonPasswords)).toBe(true);
            expect(PASSWORD_REQUIREMENTS.commonPasswords.length).toBeGreaterThan(0);
        });
    });
});
