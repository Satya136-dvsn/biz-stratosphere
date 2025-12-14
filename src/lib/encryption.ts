/**
 * Encryption Utilities Library
 * 
 * Provides enterprise-grade encryption for Biz Stratosphere platform
 * using AES-256-GCM for data at rest and secure key derivation.
 * 
 * Security Features:
 * - AES-256-GCM authenticated encryption
 * - PBKDF2 key derivation from passwords
 * - Secure random IV generation
 * - Base64 encoding for storage
 * - Type-safe interfaces
 */

import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/ciphers/webcrypto/utils';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes, utf8ToBytes, bytesToUtf8 } from '@noble/hashes/utils';

// Encryption configuration constants
const ENCRYPTION_CONFIG = {
    algorithm: 'AES-256-GCM',
    keySize: 32, // 256 bits
    ivSize: 12, // 96 bits (recommended for GCM)
    tagSize: 16, // 128 bits authentication tag
    saltSize: 32, // 256 bits for PBKDF2
    pbkdf2Iterations: 100000, // OWASP recommended minimum
} as const;

/**
 * Encrypted data structure with metadata
 */
export interface EncryptedData {
    ciphertext: string; // Base64 encoded encrypted data
    iv: string; // Base64 encoded initialization vector
    tag: string; // Base64 encoded authentication tag
    algorithm: string; // Encryption algorithm used
    version: number; // Version for future migration
}

/**
 * Key derivation result
 */
export interface DerivedKey {
    key: Uint8Array;
    salt: string; // Base64 encoded salt
}

/**
 * Generate a cryptographically secure random encryption key
 * 
 * @returns 32-byte encryption key
 */
export function generateEncryptionKey(): Uint8Array {
    return randomBytes(ENCRYPTION_CONFIG.keySize);
}

/**
 * Generate a cryptographically secure random salt
 * 
 * @returns Base64 encoded salt
 */
export function generateSalt(): string {
    const salt = randomBytes(ENCRYPTION_CONFIG.saltSize);
    return bytesToBase64(salt);
}

/**
 * Derive an encryption key from a password using PBKDF2
 * 
 * @param password - User password
 * @param salt - Optional salt (generates new if not provided)
 * @returns Derived key and salt
 */
export function deriveKeyFromPassword(
    password: string,
    salt?: string
): DerivedKey {
    const saltBytes = salt ? base64ToBytes(salt) : randomBytes(ENCRYPTION_CONFIG.saltSize);

    const key = pbkdf2(
        sha256,
        utf8ToBytes(password),
        saltBytes,
        {
            c: ENCRYPTION_CONFIG.pbkdf2Iterations,
            dkLen: ENCRYPTION_CONFIG.keySize,
        }
    );

    return {
        key,
        salt: bytesToBase64(saltBytes),
    };
}

/**
 * Encrypt data using AES-256-GCM
 * 
 * @param data - Data to encrypt (string or object)
 * @param key - 32-byte encryption key
 * @returns Encrypted data with metadata
 */
export function encryptData(
    data: string | object,
    key: Uint8Array
): EncryptedData {
    if (key.length !== ENCRYPTION_CONFIG.keySize) {
        throw new Error(`Encryption key must be ${ENCRYPTION_CONFIG.keySize} bytes`);
    }

    // Convert data to string if it's an object
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    const plaintextBytes = utf8ToBytes(plaintext);

    // Generate random IV
    const iv = randomBytes(ENCRYPTION_CONFIG.ivSize);

    // Create AES-GCM cipher
    const cipher = gcm(key, iv);

    // Encrypt and get ciphertext + auth tag
    const encrypted = cipher.encrypt(plaintextBytes);

    // GCM returns ciphertext + tag concatenated
    // Split them: last 16 bytes is the tag
    const ciphertext = encrypted.slice(0, -ENCRYPTION_CONFIG.tagSize);
    const tag = encrypted.slice(-ENCRYPTION_CONFIG.tagSize);

    return {
        ciphertext: bytesToBase64(ciphertext),
        iv: bytesToBase64(iv),
        tag: bytesToBase64(tag),
        algorithm: ENCRYPTION_CONFIG.algorithm,
        version: 1,
    };
}

/**
 * Decrypt data using AES-256-GCM
 * 
 * @param encryptedData - Encrypted data with metadata
 * @param key - 32-byte encryption key
 * @returns Decrypted plaintext
 */
export function decryptData(
    encryptedData: EncryptedData,
    key: Uint8Array
): string {
    if (key.length !== ENCRYPTION_CONFIG.keySize) {
        throw new Error(`Encryption key must be ${ENCRYPTION_CONFIG.keySize} bytes`);
    }

    if (encryptedData.algorithm !== ENCRYPTION_CONFIG.algorithm) {
        throw new Error(`Unsupported algorithm: ${encryptedData.algorithm}`);
    }

    // Decode base64 components
    const ciphertext = base64ToBytes(encryptedData.ciphertext);
    const iv = base64ToBytes(encryptedData.iv);
    const tag = base64ToBytes(encryptedData.tag);

    // Concatenate ciphertext and tag for GCM
    const encryptedBytes = new Uint8Array(ciphertext.length + tag.length);
    encryptedBytes.set(ciphertext);
    encryptedBytes.set(tag, ciphertext.length);

    // Create AES-GCM decipher
    const decipher = gcm(key, iv);

    try {
        // Decrypt and verify authentication tag
        const decrypted = decipher.decrypt(encryptedBytes);
        return bytesToUtf8(decrypted);
    } catch (error) {
        throw new Error('Decryption failed: Invalid key or corrupted data');
    }
}

/**
 * Encrypt a dataset (array of objects)
 * 
 * @param dataset - Array of data objects
 * @param key - Encryption key
 * @returns Encrypted dataset with metadata
 */
export function encryptDataset(
    dataset: any[],
    key: Uint8Array
): EncryptedData {
    return encryptData(dataset, key);
}

/**
 * Decrypt a dataset
 * 
 * @param encryptedData - Encrypted dataset
 * @param key - Decryption key
 * @returns Original dataset array
 */
export function decryptDataset(
    encryptedData: EncryptedData,
    key: Uint8Array
): any[] {
    const decrypted = decryptData(encryptedData, key);
    return JSON.parse(decrypted);
}

/**
 * Encrypt a file (as ArrayBuffer)
 * 
 * @param fileData - File data as ArrayBuffer
 * @param key - Encryption key
 * @returns Encrypted file data
 */
export function encryptFile(
    fileData: ArrayBuffer,
    key: Uint8Array
): EncryptedData {
    const fileBytes = new Uint8Array(fileData);

    // Generate random IV
    const iv = randomBytes(ENCRYPTION_CONFIG.ivSize);

    // Create AES-GCM cipher
    const cipher = gcm(key, iv);

    // Encrypt file
    const encrypted = cipher.encrypt(fileBytes);

    // Split ciphertext and tag
    const ciphertext = encrypted.slice(0, -ENCRYPTION_CONFIG.tagSize);
    const tag = encrypted.slice(-ENCRYPTION_CONFIG.tagSize);

    return {
        ciphertext: bytesToBase64(ciphertext),
        iv: bytesToBase64(iv),
        tag: bytesToBase64(tag),
        algorithm: ENCRYPTION_CONFIG.algorithm,
        version: 1,
    };
}

/**
 * Decrypt a file
 * 
 * @param encryptedData - Encrypted file data
 * @param key - Decryption key
 * @returns Original file as ArrayBuffer
 */
export function decryptFile(
    encryptedData: EncryptedData,
    key: Uint8Array
): ArrayBuffer {
    const ciphertext = base64ToBytes(encryptedData.ciphertext);
    const iv = base64ToBytes(encryptedData.iv);
    const tag = base64ToBytes(encryptedData.tag);

    // Concatenate ciphertext and tag
    const encryptedBytes = new Uint8Array(ciphertext.length + tag.length);
    encryptedBytes.set(ciphertext);
    encryptedBytes.set(tag, ciphertext.length);

    // Decrypt
    const decipher = gcm(key, iv);
    const decrypted = decipher.decrypt(encryptedBytes);

    return decrypted.buffer;
}

/**
 * Hash data using SHA-256
 * 
 * @param data - Data to hash
 * @returns Hex encoded hash
 */
export function hashData(data: string): string {
    const hash = sha256(utf8ToBytes(data));
    return bytesToHex(hash);
}

/**
 * Verify data integrity using hash
 * 
 * @param data - Original data
 * @param hash - Expected hash
 * @returns True if hash matches
 */
export function verifyHash(data: string, hash: string): boolean {
    const computed = hashData(data);
    return computed === hash;
}

// Utility functions for base64 encoding/decoding

function bytesToBase64(bytes: Uint8Array): string {
    // Use browser's btoa for base64 encoding
    const binary = String.fromCharCode(...bytes);
    return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
    // Use browser's atob for base64 decoding
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Generate a secure random ID
 * 
 * @returns Hex encoded random ID
 */
export function generateSecureId(): string {
    return bytesToHex(randomBytes(16));
}

/**
 * Securely wipe a key from memory
 * Note: This is best-effort in JavaScript due to garbage collection
 * 
 * @param key - Key to wipe
 */
export function wipeKey(key: Uint8Array): void {
    if (key) {
        key.fill(0);
    }
}

/**
 * Export encryption key to storable format
 * 
 * @param key - Encryption key
 * @returns Base64 encoded key
 */
export function exportKey(key: Uint8Array): string {
    return bytesToBase64(key);
}

/**
 * Import encryption key from stored format
 * 
 * @param keyString - Base64 encoded key
 * @returns Encryption key
 */
export function importKey(keyString: string): Uint8Array {
    return base64ToBytes(keyString);
}
