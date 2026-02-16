// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Encrypted Storage Utilities
 * 
 * Provides encrypted wrapper around browser storage APIs (localStorage, sessionStorage)
 * ensuring sensitive data is never stored in plaintext.
 */

import {
    encryptData,
    decryptData,
    type EncryptedData
} from './encryption';
import { getDataKey, isSessionActive } from './keyManagement';

/**
 * Encrypted localStorage wrapper
 */
export class EncryptedStorage {
    private sessionId: string | null = null;

    /**
     * Initialize encrypted storage with session
     * 
     * @param sessionId - Active session ID with encryption keys
     */
    constructor(sessionId?: string) {
        this.sessionId = sessionId || null;
    }

    /**
     * Set session ID for encryption
     */
    setSession(sessionId: string): void {
        this.sessionId = sessionId;
    }

    /**
     * Store encrypted item
     * 
     * @param key - Storage key
     * @param value - Value to encrypt and store
     */
    setItem(key: string, value: any): void {
        if (!this.sessionId || !isSessionActive(this.sessionId)) {
            throw new Error('No active encryption session');
        }

        try {
            const dataKey = getDataKey(this.sessionId);
            const encrypted = encryptData(value, dataKey);
            localStorage.setItem(key, JSON.stringify(encrypted));
        } catch (error) {
            console.error('Failed to encrypt storage item:', error);
            throw error;
        }
    }

    /**
     * Retrieve and decrypt item
     * 
     * @param key - Storage key
     * @returns Decrypted value or null if not found
     */
    getItem<T = any>(key: string): T | null {
        if (!this.sessionId || !isSessionActive(this.sessionId)) {
            throw new Error('No active encryption session');
        }

        try {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;

            const encryptedData: EncryptedData = JSON.parse(encrypted);
            const dataKey = getDataKey(this.sessionId);
            const decrypted = decryptData(encryptedData, dataKey);

            return JSON.parse(decrypted) as T;
        } catch (error) {
            console.error('Failed to decrypt storage item:', error);
            return null;
        }
    }

    /**
     * Remove item from storage
     * 
     * @param key - Storage key
     */
    removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    /**
     * Clear all encrypted storage
     */
    clear(): void {
        localStorage.clear();
    }

    /**
     * Check if key exists
     * 
     * @param key - Storage key
     * @returns True if key exists
     */
    hasItem(key: string): boolean {
        return localStorage.getItem(key) !== null;
    }
}

/**
 * Encrypted session storage wrapper
 */
export class EncryptedSessionStorage extends EncryptedStorage {
    /**
     * Store encrypted item in sessionStorage
     */
    override setItem(key: string, value: any): void {
        if (!this.sessionId || !isSessionActive(this.sessionId!)) {
            throw new Error('No active encryption session');
        }

        try {
            const dataKey = getDataKey(this.sessionId!);
            const encrypted = encryptData(value, dataKey);
            sessionStorage.setItem(key, JSON.stringify(encrypted));
        } catch (error) {
            console.error('Failed to encrypt session item:', error);
            throw error;
        }
    }

    /**
     * Retrieve and decrypt item from sessionStorage
     */
    override getItem<T = any>(key: string): T | null {
        if (!this.sessionId || !isSessionActive(this.sessionId!)) {
            throw new Error('No active encryption session');
        }

        try {
            const encrypted = sessionStorage.getItem(key);
            if (!encrypted) return null;

            const encryptedData: EncryptedData = JSON.parse(encrypted);
            const dataKey = getDataKey(this.sessionId!);
            const decrypted = decryptData(encryptedData, dataKey);

            return JSON.parse(decrypted) as T;
        } catch (error) {
            console.error('Failed to decrypt session item:', error);
            return null;
        }
    }

    /**
     * Remove item from sessionStorage
     */
    override removeItem(key: string): void {
        sessionStorage.removeItem(key);
    }

    /**
     * Clear all encrypted session storage
     */
    override clear(): void {
        sessionStorage.clear();
    }

    /**
     * Check if key exists in sessionStorage
     */
    override hasItem(key: string): boolean {
        return sessionStorage.getItem(key) !== null;
    }
}

// Global instances (initialized with session)
let encryptedLocalStorage: EncryptedStorage | null = null;
let encryptedSessionStorageInstance: EncryptedSessionStorage | null = null;

/**
 * Initialize encrypted storage with session
 * 
 * @param sessionId - Active session ID
 */
export function initializeEncryptedStorage(sessionId: string): void {
    encryptedLocalStorage = new EncryptedStorage(sessionId);
    encryptedSessionStorageInstance = new EncryptedSessionStorage(sessionId);
}

/**
 * Get encrypted localStorage instance
 */
export function getEncryptedLocalStorage(): EncryptedStorage {
    if (!encryptedLocalStorage) {
        throw new Error('Encrypted storage not initialized');
    }
    return encryptedLocalStorage;
}

/**
 * Get encrypted sessionStorage instance
 */
export function getEncryptedSessionStorage(): EncryptedSessionStorage {
    if (!encryptedSessionStorageInstance) {
        throw new Error('Encrypted session storage not initialized');
    }
    return encryptedSessionStorageInstance;
}

/**
 * Clear all encrypted storage on logout
 */
export function clearEncryptedStorage(): void {
    encryptedLocalStorage = null;
    encryptedSessionStorageInstance = null;
    localStorage.clear();
    sessionStorage.clear();
}
