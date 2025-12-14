/**
 * Tests for key management system
 * 
 * Tests user key initialization, unlocking, session management,
 * key rotation, and recovery.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    initializeUserKeys,
    unlockUserKeys,
    getDataKey,
    isSessionActive,
    extendSession,
    clearSessionKeys,
    clearAllSessionKeys,
    rotateUserKeys,
    generateRecoveryKey,
    recoverWithRecoveryKey,
    exportKeyBundle,
    importKeyBundle,
    validateKeyBundle,
} from './keyManagement';
import { generateEncryptionKey } from './encryption';

describe('Key Management', () => {
    const userId = 'test-user-123';
    const password = 'SecurePassword123!';

    afterEach(() => {
        // Clean up all sessions after each test
        clearAllSessionKeys();
    });

    describe('User Key Initialization', () => {
        it('should initialize keys for a new user', () => {
            const keyBundle = initializeUserKeys(userId, password);

            expect(keyBundle).toHaveProperty('userId', userId);
            expect(keyBundle).toHaveProperty('encryptedDEK');
            expect(keyBundle).toHaveProperty('salt');
            expect(keyBundle).toHaveProperty('createdAt');
            expect(keyBundle).toHaveProperty('version', 1);

            expect(keyBundle.encryptedDEK).toHaveProperty('ciphertext');
            expect(keyBundle.encryptedDEK).toHaveProperty('iv');
            expect(keyBundle.encryptedDEK).toHaveProperty('tag');
        });

        it('should create different keys for different users', () => {
            const bundle1 = initializeUserKeys('user1', password);
            const bundle2 = initializeUserKeys('user2', password);

            expect(bundle1.encryptedDEK.ciphertext).not.toBe(bundle2.encryptedDEK.ciphertext);
            expect(bundle1.salt).not.toBe(bundle2.salt);
        });

        it('should create different keys for same user with different passwords', () => {
            const bundle1 = initializeUserKeys(userId, 'password1');
            const bundle2 = initializeUserKeys(userId, 'password2');

            expect(bundle1.encryptedDEK.ciphertext).not.toBe(bundle2.encryptedDEK.ciphertext);
        });
    });

    describe('Unlocking User Keys', () => {
        let keyBundle: ReturnType<typeof initializeUserKeys>;

        beforeEach(() => {
            keyBundle = initializeUserKeys(userId, password);
        });

        it('should unlock keys with correct password', () => {
            const sessionId = unlockUserKeys(keyBundle, password);

            expect(typeof sessionId).toBe('string');
            expect(sessionId.length).toBeGreaterThan(0);
        });

        it('should fail to unlock with wrong password', () => {
            expect(() => {
                unlockUserKeys(keyBundle, 'wrongPassword');
            }).toThrow('Failed to unlock keys');
        });

        it('should create valid session on unlock', () => {
            const sessionId = unlockUserKeys(keyBundle, password);

            expect(isSessionActive(sessionId)).toBe(true);
        });

        it('should retrieve data key from session', () => {
            const sessionId = unlockUserKeys(keyBundle, password);
            const dataKey = getDataKey(sessionId);

            expect(dataKey).toBeInstanceOf(Uint8Array);
            expect(dataKey.length).toBe(32); // 256 bits
        });
    });

    describe('Session Management', () => {
        let keyBundle: ReturnType<typeof initializeUserKeys>;
        let sessionId: string;

        beforeEach(() => {
            keyBundle = initializeUserKeys(userId, password);
            sessionId = unlockUserKeys(keyBundle, password);
        });

        it('should have active session after unlock', () => {
            expect(isSessionActive(sessionId)).toBe(true);
        });

        it('should throw error accessing non-existent session', () => {
            const invalidSessionId = 'invalid-session-id';

            expect(() => {
                getDataKey(invalidSessionId);
            }).toThrow('No active session');
        });

        it('should extend session timeout', () => {
            const initialActive = isSessionActive(sessionId);
            extendSession(sessionId);
            const stillActive = isSessionActive(sessionId);

            expect(initialActive).toBe(true);
            expect(stillActive).toBe(true);
        });

        it('should clear specific session', () => {
            clearSessionKeys(sessionId);

            expect(isSessionActive(sessionId)).toBe(false);
        });

        it('should clear all sessions', () => {
            const session2 = unlockUserKeys(keyBundle, password);

            expect(isSessionActive(sessionId)).toBe(true);
            expect(isSessionActive(session2)).toBe(true);

            clearAllSessionKeys();

            expect(isSessionActive(sessionId)).toBe(false);
            expect(isSessionActive(session2)).toBe(false);
        });

        it('should handle accessing cleared session gracefully', () => {
            clearSessionKeys(sessionId);

            expect(() => {
                getDataKey(sessionId);
            }).toThrow('No active session');
        });
    });

    describe('Key Rotation', () => {
        let keyBundle: ReturnType<typeof initializeUserKeys>;
        const oldPassword = 'OldPassword123!';
        const newPassword = 'NewPassword456!';

        beforeEach(() => {
            keyBundle = initializeUserKeys(userId, oldPassword);
        });

        it('should rotate keys on password change', () => {
            const newBundle = rotateUserKeys(oldPassword, newPassword, keyBundle);

            expect(newBundle).toHaveProperty('encryptedDEK');
            expect(newBundle).toHaveProperty('salt');
            expect(newBundle).toHaveProperty('rotatedAt');
            expect(newBundle.version).toBe(keyBundle.version + 1);
        });

        it('should unlock with new password after rotation', () => {
            const newBundle = rotateUserKeys(oldPassword, newPassword, keyBundle);
            const sessionId = unlockUserKeys(newBundle, newPassword);

            expect(isSessionActive(sessionId)).toBe(true);
        });

        it('should not unlock with old password after rotation', () => {
            const newBundle = rotateUserKeys(oldPassword, newPassword, keyBundle);

            expect(() => {
                unlockUserKeys(newBundle, oldPassword);
            }).toThrow('Failed to unlock keys');
        });

        it('should fail rotation with wrong old password', () => {
            expect(() => {
                rotateUserKeys('wrongOldPassword', newPassword, keyBundle);
            }).toThrow();
        });

        it('should preserve data access after rotation', () => {
            // Unlock with old password
            const oldSessionId = unlockUserKeys(keyBundle, oldPassword);
            const oldDataKey = getDataKey(oldSessionId);

            // Rotate keys
            const newBundle = rotateUserKeys(oldPassword, newPassword, keyBundle);

            // Unlock with new password
            const newSessionId = unlockUserKeys(newBundle, newPassword);
            const newDataKey = getDataKey(newSessionId);

            // DEK should be the same (only master key changed)
            expect(newDataKey).toEqual(oldDataKey);
        });
    });

    describe('Recovery Keys', () => {
        let keyBundle: ReturnType<typeof initializeUserKeys>;

        beforeEach(() => {
            keyBundle = initializeUserKeys(userId, password);
        });

        it('should generate a recovery key', () => {
            const recoveryKey = generateRecoveryKey(keyBundle, password);

            expect(typeof recoveryKey).toBe('string');
            expect(recoveryKey).toMatch(/^[A-Za-z0-9]{4}(-[A-Za-z0-9]{4})+$/); // Format: XXXX-XXXX-...
        });

        it('should recover account with recovery key', () => {
            const recoveryKey = generateRecoveryKey(keyBundle, password);
            const newPassword = 'NewRecoveredPassword123!';

            const recoveredBundle = recoverWithRecoveryKey(recoveryKey, newPassword);

            expect(recoveredBundle).toHaveProperty('encryptedDEK');
            expect(recoveredBundle).toHaveProperty('salt');
        });

        it('should fail recovery with invalid recovery key', () => {
            const invalidRecoveryKey = 'XXXX-YYYY-ZZZZ-AAAA';

            expect(() => {
                recoverWithRecoveryKey(invalidRecoveryKey, 'newPassword');
            }).toThrow();
        });
    });

    describe('Key Bundle Management', () => {
        let keyBundle: ReturnType<typeof initializeUserKeys>;

        beforeEach(() => {
            keyBundle = initializeUserKeys(userId, password);
        });

        it('should export key bundle to JSON', () => {
            const exported = exportKeyBundle(keyBundle);

            expect(typeof exported).toBe('string');
            expect(() => JSON.parse(exported)).not.toThrow();
        });

        it('should import key bundle from JSON', () => {
            const exported = exportKeyBundle(keyBundle);
            const imported = importKeyBundle(exported);

            expect(imported).toEqual(keyBundle);
        });

        it('should validate valid key bundle', () => {
            expect(validateKeyBundle(keyBundle)).toBe(true);
        });

        it('should reject invalid key bundle', () => {
            const invalid = { userId: 'test' }; // Missing required fields

            expect(validateKeyBundle(invalid)).toBe(false);
        });

        it('should preserve all fields through export/import', () => {
            const exported = exportKeyBundle(keyBundle);
            const imported = importKeyBundle(exported);

            expect(imported.userId).toBe(keyBundle.userId);
            expect(imported.salt).toBe(keyBundle.salt);
            expect(imported.version).toBe(keyBundle.version);
            expect(imported.encryptedDEK).toEqual(keyBundle.encryptedDEK);
        });
    });

    describe('Security', () => {
        it('should not store master key anywhere', () => {
            const keyBundle = initializeUserKeys(userId, password);
            const sessionId = unlockUserKeys(keyBundle, password);

            // Master key should not be accessible from key bundle
            expect(keyBundle).not.toHaveProperty('masterKey');

            // Should only be able to get data key, not master key
            const dataKey = getDataKey(sessionId);
            expect(dataKey).toBeDefined();
        });

        it('should wipe keys from memory on session clear', () => {
            const keyBundle = initializeUserKeys(userId, password);
            const sessionId = unlockUserKeys(keyBundle, password);

            // Keys should be accessible
            expect(() => getDataKey(sessionId)).not.toThrow();

            // Clear session
            clearSessionKeys(sessionId);

            // Keys should no longer be accessible
            expect(() => getDataKey(sessionId)).toThrow('No active session');
        });

        it('should create unique session IDs', () => {
            const keyBundle = initializeUserKeys(userId, password);
            const session1 = unlockUserKeys(keyBundle, password);
            const session2 = unlockUserKeys(keyBundle, password);

            expect(session1).not.toBe(session2);
        });
    });
});
