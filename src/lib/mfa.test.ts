/**
 * Tests for MFA (Multi-Factor Authentication) Library
 * 
 * Tests TOTP generation/verification, QR code creation,
 * backup codes, and all MFA utilities.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    generateTOTPSecret,
    verifyTOTPToken,
    generateBackupCodes,
    verifyBackupCode,
    hashBackupCode,
    formatBackupCodesForDisplay,
    generateCurrentToken,
    getTokenTimeRemaining,
    isValidSecret,
    getMFAConfig,
} from './mfa';

describe('MFA Library', () => {
    describe('TOTP Secret Generation', () => {
        it('should generate a valid TOTP secret', async () => {
            const userEmail = 'test@example.com';
            const secret = await generateTOTPSecret(userEmail);

            expect(secret).toHaveProperty('secret');
            expect(secret).toHaveProperty('uri');
            expect(secret).toHaveProperty('qrCode');

            // Secret should be Base32 encoded
            expect(typeof secret.secret).toBe('string');
            expect(secret.secret.length).toBeGreaterThan(0);

            // URI should be otpauth format
            expect(secret.uri).toMatch(/^otpauth:\/\/totp\//);
            expect(secret.uri).toContain(userEmail);
            expect(secret.uri).toContain('Biz%20Stratosphere');

            // QR code should be data URL
            expect(secret.qrCode).toMatch(/^data:image\/png;base64,/);
        });

        it('should generate unique secrets each time', async () => {
            const secret1 = await generateTOTPSecret('user1@example.com');
            const secret2 = await generateTOTPSecret('user2@example.com');

            expect(secret1.secret).not.toBe(secret2.secret);
            expect(secret1.qrCode).not.toBe(secret2.qrCode);
        });

        it('should include issuer in URI', async () => {
            const secret = await generateTOTPSecret('test@example.com');

            expect(secret.uri).toContain('issuer=Biz%20Stratosphere');
        });

        it('should generate valid Base32 secret', async () => {
            const secret = await generateTOTPSecret('test@example.com');

            expect(isValidSecret(secret.secret)).toBe(true);
        });
    });

    describe('TOTP Token Verification', () => {
        let testSecret: string;

        beforeEach(async () => {
            const secret = await generateTOTPSecret('test@example.com');
            testSecret = secret.secret;
        });

        it('should verify valid TOTP token', () => {
            // Generate current token
            const token = generateCurrentToken(testSecret);

            // Verify it
            const result = verifyTOTPToken(token, testSecret);

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should reject invalid token', () => {
            const result = verifyTOTPToken('000000', testSecret);

            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should reject token with wrong length', () => {
            const result = verifyTOTPToken('12345', testSecret);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('6 digits');
        });

        it('should reject non-numeric token', () => {
            const result = verifyTOTPToken('abcdef', testSecret);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('only digits');
        });

        it('should reject empty token', () => {
            const result = verifyTOTPToken('', testSecret);

            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should reject with empty secret', () => {
            const result = verifyTOTPToken('123456', '');

            expect(result.valid).toBe(false);
            expect(result.error).toContain('Secret is required');
        });

        it('should handle tokens with spaces', () => {
            const token = generateCurrentToken(testSecret);
            const tokenWithSpaces = `${token.slice(0, 3)} ${token.slice(3)}`;

            const result = verifyTOTPToken(tokenWithSpaces, testSecret);

            expect(result.valid).toBe(true);
        });

        it('should handle tokens with dashes', () => {
            const token = generateCurrentToken(testSecret);
            const tokenWithDashes = `${token.slice(0, 3)}-${token.slice(3)}`;

            const result = verifyTOTPToken(tokenWithDashes, testSecret);

            expect(result.valid).toBe(true);
        });
    });

    describe('Current Token Generation', () => {
        it('should generate 6-digit token', async () => {
            const secret = await generateTOTPSecret('test@example.com');
            const token = generateCurrentToken(secret.secret);

            expect(token).toMatch(/^\d{6}$/);
            expect(token.length).toBe(6);
        });

        it('should generate different tokens for different secrets', async () => {
            const secret1 = await generateTOTPSecret('user1@example.com');
            const secret2 = await generateTOTPSecret('user2@example.com');

            const token1 = generateCurrentToken(secret1.secret);
            const token2 = generateCurrentToken(secret2.secret);

            // Very unlikely to be the same (1 in 1,000,000)
            expect(token1).not.toBe(token2);
        });

        it('should verify its own generated token', async () => {
            const secret = await generateTOTPSecret('test@example.com');
            const token = generateCurrentToken(secret.secret);

            const result = verifyTOTPToken(token, secret.secret);
            expect(result.valid).toBe(true);
        });
    });

    describe('Token Time Remaining', () => {
        it('should return time between 0 and 30', () => {
            const remaining = getTokenTimeRemaining();

            expect(remaining).toBeGreaterThanOrEqual(0);
            expect(remaining).toBeLessThanOrEqual(30);
        });

        it('should change over time', async () => {
            const time1 = getTokenTimeRemaining();

            // Wait 1 second
            await new Promise(resolve => setTimeout(resolve, 1000));

            const time2 = getTokenTimeRemaining();

            expect(time1).not.toBe(time2);
        });
    });

    describe('Backup Codes Generation', () => {
        it('should generate 10 backup codes', () => {
            const codes = generateBackupCodes();

            expect(codes.length).toBe(10);
        });

        it('should have correct format (XXXX-XXXX)', () => {
            const codes = generateBackupCodes();

            codes.forEach(code => {
                expect(code.code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
            });
        });

        it('should include both code and hash', () => {
            const codes = generateBackupCodes();

            codes.forEach(code => {
                expect(code).toHaveProperty('code');
                expect(code).toHaveProperty('hash');
                expect(typeof code.code).toBe('string');
                expect(typeof code.hash).toBe('string');
                expect(code.code.length).toBeGreaterThan(0);
                expect(code.hash.length).toBeGreaterThan(0);
            });
        });

        it('should generate unique codes', () => {
            const codes = generateBackupCodes();
            const codeStrings = codes.map(c => c.code);
            const uniqueCodes = new Set(codeStrings);

            expect(uniqueCodes.size).toBe(codes.length);
        });

        it('should not use confusing characters', () => {
            const codes = generateBackupCodes();

            codes.forEach(code => {
                // Should not contain I, O, 0, 1
                expect(code.code).not.toMatch(/[IO01]/);
            });
        });

        it('should generate different codes each time', () => {
            const codes1 = generateBackupCodes();
            const codes2 = generateBackupCodes();

            const codes1Strings = codes1.map(c => c.code).join(',');
            const codes2Strings = codes2.map(c => c.code).join(',');

            expect(codes1Strings).not.toBe(codes2Strings);
        });
    });

    describe('Backup Code Hashing', () => {
        it('should hash backup code', () => {
            const code = 'TEST-CODE';
            const hash = hashBackupCode(code);

            expect(typeof hash).toBe('string');
            expect(hash.length).toBeGreaterThan(0);
        });

        it('should produce same hash for same code', () => {
            const code = 'TEST-CODE';
            const hash1 = hashBackupCode(code);
            const hash2 = hashBackupCode(code);

            expect(hash1).toBe(hash2);
        });

        it('should produce different hashes for different codes', () => {
            const hash1 = hashBackupCode('CODE-1111');
            const hash2 = hashBackupCode('CODE-2222');

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('Backup Code Verification', () => {
        it('should verify correct backup code', () => {
            const code = 'TEST-CODE';
            const hash = hashBackupCode(code);

            expect(verifyBackupCode(code, hash)).toBe(true);
        });

        it('should reject incorrect backup code', () => {
            const hash = hashBackupCode('CORRECT-CODE');

            expect(verifyBackupCode('WRONG-CODE', hash)).toBe(false);
        });

        it('should be case-sensitive', () => {
            const hash = hashBackupCode('TEST-CODE');

            expect(verifyBackupCode('test-code', hash)).toBe(false);
        });

        it('should verify all generated codes', () => {
            const codes = generateBackupCodes();

            codes.forEach(code => {
                expect(verifyBackupCode(code.code, code.hash)).toBe(true);
            });
        });
    });

    describe('Backup Codes Display Formatting', () => {
        it('should format codes for display', () => {
            const codes = generateBackupCodes();
            const formatted = formatBackupCodesForDisplay(codes);

            expect(typeof formatted).toBe('string');
            expect(formatted.length).toBeGreaterThan(0);
        });

        it('should include header information', () => {
            const codes = generateBackupCodes();
            const formatted = formatBackupCodesForDisplay(codes);

            expect(formatted).toContain('Biz Stratosphere');
            expect(formatted).toContain('Backup Recovery Codes');
            expect(formatted).toContain('IMPORTANT');
        });

        it('should include all codes numbered', () => {
            const codes = generateBackupCodes();
            const formatted = formatBackupCodesForDisplay(codes);

            codes.forEach((code, idx) => {
                expect(formatted).toContain(`${idx + 1}. ${code.code}`);
            });
        });

        it('should include generation timestamp', () => {
            const codes = generateBackupCodes();
            const formatted = formatBackupCodesForDisplay(codes);

            expect(formatted).toContain('Generated:');
        });

        it('should include security warning', () => {
            const codes = generateBackupCodes();
            const formatted = formatBackupCodesForDisplay(codes);

            expect(formatted).toContain('safe place');
            expect(formatted).toContain('once');
        });
    });

    describe('Secret Validation', () => {
        it('should validate correct Base32 secret', () => {
            expect(isValidSecret('JBSWY3DPEHPK3PXP')).toBe(true);
        });

        it('should accept secrets with padding', () => {
            expect(isValidSecret('JBSWY3DPEHPK3PXP====')).toBe(true);
        });

        it('should reject lowercase letters', () => {
            expect(isValidSecret('jbswy3dpehpk3pxp')).toBe(false);
        });

        it('should reject invalid Base32 characters', () => {
            expect(isValidSecret('JBSWY3DPEHPK3PX1')).toBe(false); // 1 not in Base32
            expect(isValidSecret('JBSWY3DPEHPK3PX0')).toBe(false); // 0 not in Base32
            expect(isValidSecret('JBSWY3DPEHPK3PX8')).toBe(false); // 8 not in Base32
            expect(isValidSecret('JBSWY3DPEHPK3PX9')).toBe(false); // 9 not in Base32
        });

        it('should reject empty string', () => {
            expect(isValidSecret('')).toBe(false);
        });

        it('should accept all valid Base32 characters', () => {
            expect(isValidSecret('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567')).toBe(true);
        });
    });

    describe('MFA Configuration', () => {
        it('should return configuration object', () => {
            const config = getMFAConfig();

            expect(config).toHaveProperty('issuer');
            expect(config).toHaveProperty('algorithm');
            expect(config).toHaveProperty('digits');
            expect(config).toHaveProperty('period');
            expect(config).toHaveProperty('window');
            expect(config).toHaveProperty('backupCodesCount');
            expect(config).toHaveProperty('backupCodeLength');
        });

        it('should have correct values', () => {
            const config = getMFAConfig();

            expect(config.issuer).toBe('Biz Stratosphere');
            expect(config.algorithm).toBe('SHA1');
            expect(config.digits).toBe(6);
            expect(config.period).toBe(30);
            expect(config.window).toBe(1);
            expect(config.backupCodesCount).toBe(10);
            expect(config.backupCodeLength).toBe(8);
        });

        it('should return immutable config', () => {
            const config = getMFAConfig();
            const original = { ...config };

            // Try to modify (should not affect original)
            (config as any).issuer = 'Modified';

            const config2 = getMFAConfig();
            expect(config2.issuer).toBe(original.issuer);
        });
    });

    describe('Integration Tests', () => {
        it('should complete full MFA setup flow', async () => {
            // 1. Generate secret
            const secret = await generateTOTPSecret('test@example.com');
            expect(secret.secret).toBeDefined();

            // 2. Generate current token
            const token = generateCurrentToken(secret.secret);
            expect(token).toMatch(/^\d{6}$/);

            // 3. Verify token
            const result = verifyTOTPToken(token, secret.secret);
            expect(result.valid).toBe(true);

            // 4. Generate backup codes
            const codes = generateBackupCodes();
            expect(codes.length).toBe(10);

            // 5. Verify backup code
            expect(verifyBackupCode(codes[0].code, codes[0].hash)).toBe(true);
        });

        it('should handle complete verification flow', async () => {
            const secret = await generateTOTPSecret('user@example.com');

            // Generate token
            const token = generateCurrentToken(secret.secret);

            // Should verify successfully
            expect(verifyTOTPToken(token, secret.secret).valid).toBe(true);

            // Wrong token should fail
            expect(verifyTOTPToken('000000', secret.secret).valid).toBe(false);

            // Backup code flow
            const codes = generateBackupCodes();
            expect(verifyBackupCode(codes[0].code, codes[0].hash)).toBe(true);
            expect(verifyBackupCode('WRONG-CODE', codes[0].hash)).toBe(false);
        });
    });

    describe('Performance', () => {
        it('should generate secret quickly', async () => {
            const start = performance.now();
            await generateTOTPSecret('test@example.com');
            const end = performance.now();

            expect(end - start).toBeLessThan(500); // Should be < 500ms
        });

        it('should verify token quickly', async () => {
            const secret = await generateTOTPSecret('test@example.com');
            const token = generateCurrentToken(secret.secret);

            const start = performance.now();
            verifyTOTPToken(token, secret.secret);
            const end = performance.now();

            expect(end - start).toBeLessThan(50); // Should be < 50ms
        });

        it('should generate backup codes quickly', () => {
            const start = performance.now();
            generateBackupCodes();
            const end = performance.now();

            expect(end - start).toBeLessThan(100); // Should be < 100ms
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed QR code generation gracefully', async () => {
            // This should not throw
            const secret = await generateTOTPSecret('invalid@@@email');
            expect(secret.secret).toBeDefined();
        });

        it('should handle edge case emails', async () => {
            const emails = [
                'test@test.com',
                'a@b.c',
                'test+tag@example.com',
                'user.name@sub.domain.com',
            ];

            for (const email of emails) {
                const secret = await generateTOTPSecret(email);
                expect(secret.secret).toBeDefined();
                expect(secret.uri).toContain(encodeURIComponent(email));
            }
        });
    });
});
