// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Key Management System
 * 
 * Manages user encryption keys with secure storage and rotation capabilities.
 * Implements zero-knowledge architecture where server never has access to plaintext keys.
 * 
 * Key Hierarchy:
 * - Master Key: Derived from user password using PBKDF2
 * - Data Encryption Key (DEK): Random key that encrypts actual data
 * - DEK is encrypted with Master Key and stored
 * - Master Key is never stored, only derived on-demand
 */

import {
    generateEncryptionKey,
    deriveKeyFromPassword,
    encryptData,
    decryptData,
    exportKey,
    importKey,
    generateSalt,
    wipeKey,
    type EncryptedData,
    type DerivedKey
} from './encryption';

/**
 * User key bundle stored in database
 */
export interface UserKeyBundle {
    userId: string;
    encryptedDEK: EncryptedData; // DEK encrypted with master key
    salt: string; // Salt for PBKDF2
    createdAt: Date;
    rotatedAt?: Date;
    version: number;
}

/**
 * Active session keys (in memory only)
 */
interface SessionKeys {
    masterKey: Uint8Array;
    dataKey: Uint8Array;
    expiresAt: number;
}

// In-memory session key store (cleared on logout)
const sessionKeyStore = new Map<string, SessionKeys>();

// Session timeout (30 minutes)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Initialize encryption for a new user
 * Generate DEK and encrypt it with password-derived master key
 * 
 * @param userId - User identifier
 * @param password - User password
 * @returns Key bundle to store in database
 */
export function initializeUserKeys(
    userId: string,
    password: string
): UserKeyBundle {
    // Derive master key from password
    const { key: masterKey, salt } = deriveKeyFromPassword(password);

    // Generate random DEK for data encryption
    const dataKey = generateEncryptionKey();

    // Encrypt DEK with master key
    const encryptedDEK = encryptData(exportKey(dataKey), masterKey);

    // Wipe sensitive data from memory
    wipeKey(masterKey);
    wipeKey(dataKey);

    return {
        userId,
        encryptedDEK,
        salt,
        createdAt: new Date(),
        version: 1,
    };
}

/**
 * Unlock user keys with password
 * Derives master key and decrypts DEK for use in session
 * 
 * @param keyBundle - Stored key bundle from database
 * @param password - User password
 * @returns Session ID for key access
 */
export function unlockUserKeys(
    keyBundle: UserKeyBundle,
    password: string
): string {
    const sessionId = generateSessionId();

    try {
        // Derive master key from password and stored salt
        const { key: masterKey } = deriveKeyFromPassword(password, keyBundle.salt);

        // Decrypt DEK
        const dekString = decryptData(keyBundle.encryptedDEK, masterKey);
        const dataKey = importKey(dekString);

        // Store in session (with timeout)
        const expiresAt = Date.now() + SESSION_TIMEOUT_MS;
        sessionKeyStore.set(sessionId, {
            masterKey,
            dataKey,
            expiresAt,
        });

        // Auto-cleanup expired session
        setTimeout(() => {
            clearSessionKeys(sessionId);
        }, SESSION_TIMEOUT_MS);

        return sessionId;
    } catch (error) {
        throw new Error('Failed to unlock keys: Invalid password');
    }
}

/**
 * Get data encryption key for active session
 * 
 * @param sessionId - Active session ID
 * @returns Data encryption key
 */
export function getDataKey(sessionId: string): Uint8Array {
    const session = sessionKeyStore.get(sessionId);

    if (!session) {
        throw new Error('No active session: Please login again');
    }

    if (Date.now() > session.expiresAt) {
        clearSessionKeys(sessionId);
        throw new Error('Session expired: Please login again');
    }

    return session.dataKey;
}

/**
 * Check if session has valid keys
 * 
 * @param sessionId - Session ID to check
 * @returns True if session is active and valid
 */
export function isSessionActive(sessionId: string): boolean {
    const session = sessionKeyStore.get(sessionId);
    if (!session) return false;

    if (Date.now() > session.expiresAt) {
        clearSessionKeys(sessionId);
        return false;
    }

    return true;
}

/**
 * Extend session timeout
 * 
 * @param sessionId - Session to extend
 */
export function extendSession(sessionId: string): void {
    const session = sessionKeyStore.get(sessionId);
    if (session) {
        session.expiresAt = Date.now() + SESSION_TIMEOUT_MS;
    }
}

/**
 * Clear session keys from memory
 * 
 * @param sessionId - Session to clear
 */
export function clearSessionKeys(sessionId: string): void {
    const session = sessionKeyStore.get(sessionId);
    if (session) {
        // Securely wipe keys
        wipeKey(session.masterKey);
        wipeKey(session.dataKey);
        sessionKeyStore.delete(sessionId);
    }
}

/**
 * Clear all session keys (on logout)
 */
export function clearAllSessionKeys(): void {
    sessionKeyStore.forEach((session, sessionId) => {
        wipeKey(session.masterKey);
        wipeKey(session.dataKey);
    });
    sessionKeyStore.clear();
}

/**
 * Rotate user's data encryption key
 * Re-encrypts DEK with new master key (e.g., after password change)
 * 
 * @param oldPassword - Current password
 * @param newPassword - New password
 * @param oldKeyBundle - Current key bundle
 * @returns New key bundle to store
 */
export function rotateUserKeys(
    oldPassword: string,
    newPassword: string,
    oldKeyBundle: UserKeyBundle
): UserKeyBundle {
    // Decrypt DEK with old password
    const { key: oldMasterKey } = deriveKeyFromPassword(oldPassword, oldKeyBundle.salt);
    const dekString = decryptData(oldKeyBundle.encryptedDEK, oldMasterKey);
    const dataKey = importKey(dekString);

    // Derive new master key from new password
    const { key: newMasterKey, salt: newSalt } = deriveKeyFromPassword(newPassword);

    // Re-encrypt DEK with new master key
    const encryptedDEK = encryptData(exportKey(dataKey), newMasterKey);

    // Wipe sensitive data
    wipeKey(oldMasterKey);
    wipeKey(newMasterKey);
    wipeKey(dataKey);

    return {
        ...oldKeyBundle,
        encryptedDEK,
        salt: newSalt,
        rotatedAt: new Date(),
        version: oldKeyBundle.version + 1,
    };
}

/**
 * Generate recovery key for account recovery
 * Returns a human-readable recovery key that can decrypt the DEK
 * 
 * @param keyBundle - User key bundle
 * @param password - User password
 * @returns Recovery key (24 words or similar)
 */
export function generateRecoveryKey(
    keyBundle: UserKeyBundle,
    password: string
): string {
    // Decrypt DEK
    const { key: masterKey } = deriveKeyFromPassword(password, keyBundle.salt);
    const dekString = decryptData(keyBundle.encryptedDEK, masterKey);

    // Encode DEK as recovery phrase (simplified - in production use BIP39 or similar)
    const recoveryKey = btoa(dekString).replace(/[+/=]/g, '').substring(0, 48);

    // Format as groups of 4 characters
    const formatted = recoveryKey.match(/.{1,4}/g)?.join('-') || '';

    wipeKey(masterKey);

    return formatted;
}

/**
 * Recover account using recovery key
 * 
 * @param recoveryKey - Recovery key from generateRecoveryKey
 * @param newPassword - New password to set
 * @returns New key bundle
 */
export function recoverWithRecoveryKey(
    recoveryKey: string,
    newPassword: string
): Partial<UserKeyBundle> {
    // Remove dashes and decode
    const cleanKey = recoveryKey.replace(/-/g, '');
    const dekString = atob(cleanKey);
    const dataKey = importKey(dekString);

    // Derive new master key
    const { key: masterKey, salt } = deriveKeyFromPassword(newPassword);

    // Encrypt DEK with new master key
    const encryptedDEK = encryptData(exportKey(dataKey), masterKey);

    wipeKey(masterKey);
    wipeKey(dataKey);

    return {
        encryptedDEK,
        salt,
        rotatedAt: new Date(),
        version: 1,
    };
}

/**
 * Generate secure session ID
 */
function generateSessionId(): string {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Export key bundle for backup
 * 
 * @param keyBundle - Key bundle to export
 * @returns JSON string for backup
 */
export function exportKeyBundle(keyBundle: UserKeyBundle): string {
    return JSON.stringify(keyBundle);
}

/**
 * Import key bundle from backup
 * 
 * @param backupString - JSON string from exportKeyBundle
 * @returns Key bundle
 */
export function importKeyBundle(backupString: string): UserKeyBundle {
    return JSON.parse(backupString);
}

/**
 * Validate key bundle structure
 * 
 * @param keyBundle - Key bundle to validate
 * @returns True if valid
 */
export function validateKeyBundle(keyBundle: any): keyBundle is UserKeyBundle {
    return !!(
        keyBundle &&
        typeof keyBundle.userId === 'string' &&
        keyBundle.encryptedDEK &&
        typeof keyBundle.salt === 'string' &&
        typeof keyBundle.version === 'number'
    );
}
