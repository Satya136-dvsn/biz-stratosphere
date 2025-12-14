/**
 * Tests for encryption utilities
 * 
 * Tests AES-256-GCM encryption/decryption, key derivation,
 * dataset encryption, and file encryption.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    generateEncryptionKey,
    generateSalt,
    deriveKeyFromPassword,
    encryptData,
    decryptData,
    encryptDataset,
    decryptDataset,
    encryptFile,
    decryptFile,
    hashData,
    verifyHash,
    generateSecureId,
    exportKey,
    importKey,
} from './encryption';

describe('Encryption Utilities', () => {
    describe('Key Generation', () => {
        it('should generate a 32-byte encryption key', () => {
            const key = generateEncryptionKey();
            expect(key).toBeInstanceOf(Uint8Array);
            expect(key.length).toBe(32); // 256 bits
        });

        it('should generate unique keys each time', () => {
            const key1 = generateEncryptionKey();
            const key2 = generateEncryptionKey();
            expect(key1).not.toEqual(key2);
        });

        it('should generate a base64-encoded salt', () => {
            const salt = generateSalt();
            expect(typeof salt).toBe('string');
            expect(salt.length).toBeGreaterThan(0);
        });

        it('should generate unique salts', () => {
            const salt1 = generateSalt();
            const salt2 = generateSalt();
            expect(salt1).not.toBe(salt2);
        });
    });

    describe('Key Derivation (PBKDF2)', () => {
        it('should derive a key from password', () => {
            const password = 'mySecurePassword123!';
            const { key, salt } = deriveKeyFromPassword(password);

            expect(key).toBeInstanceOf(Uint8Array);
            expect(key.length).toBe(32); // 256 bits
            expect(typeof salt).toBe('string');
        });

        it('should derive the same key from same password and salt', () => {
            const password = 'mySecurePassword123!';
            const { key: key1, salt } = deriveKeyFromPassword(password);
            const { key: key2 } = deriveKeyFromPassword(password, salt);

            expect(key1).toEqual(key2);
        });

        it('should derive different keys from different passwords', () => {
            const { key: key1 } = deriveKeyFromPassword('password1');
            const { key: key2 } = deriveKeyFromPassword('password2');

            expect(key1).not.toEqual(key2);
        });

        it('should derive different keys with different salts', () => {
            const password = 'mySecurePassword123!';
            const { key: key1 } = deriveKeyFromPassword(password);
            const { key: key2 } = deriveKeyFromPassword(password);

            expect(key1).not.toEqual(key2);
        });
    });

    describe('Data Encryption/Decryption', () => {
        let key: Uint8Array;

        beforeEach(() => {
            key = generateEncryptionKey();
        });

        it('should encrypt and decrypt string data', () => {
            const plaintext = 'Hello, World! This is a secret message.';
            const encrypted = encryptData(plaintext, key);

            expect(encrypted).toHaveProperty('ciphertext');
            expect(encrypted).toHaveProperty('iv');
            expect(encrypted).toHaveProperty('tag');
            expect(encrypted).toHaveProperty('algorithm');
            expect(encrypted.algorithm).toBe('AES-256-GCM');

            const decrypted = decryptData(encrypted, key);
            expect(decrypted).toBe(plaintext);
        });

        it('should encrypt and decrypt object data', () => {
            const data = { name: 'John', age: 30, email: 'john@example.com' };
            const encrypted = encryptData(data, key);
            const decrypted = decryptData(encrypted, key);

            expect(JSON.parse(decrypted)).toEqual(data);
        });

        it('should produce different ciphertexts for same data', () => {
            const plaintext = 'Same data';
            const encrypted1 = encryptData(plaintext, key);
            const encrypted2 = encryptData(plaintext, key);

            // Different IVs should result in different ciphertexts
            expect(encrypted1.iv).not.toBe(encrypted2.iv);
            expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
        });

        it('should fail decryption with wrong key', () => {
            const plaintext = 'Secret data';
            const encrypted = encryptData(plaintext, key);
            const wrongKey = generateEncryptionKey();

            expect(() => {
                decryptData(encrypted, wrongKey);
            }).toThrow('Decryption failed');
        });

        it('should fail decryption with tampered ciphertext', () => {
            const plaintext = 'Secret data';
            const encrypted = encryptData(plaintext, key);

            // Tamper with ciphertext
            encrypted.ciphertext = encrypted.ciphertext.slice(0, -5) + 'XXXXX';

            expect(() => {
                decryptData(encrypted, key);
            }).toThrow('Decryption failed');
        });

        it('should throw error with invalid key size', () => {
            const invalidKey = new Uint8Array(16); // 128-bit instead of 256-bit

            expect(() => {
                encryptData('data', invalidKey);
            }).toThrow('Encryption key must be 32 bytes');
        });
    });

    describe('Dataset Encryption', () => {
        let key: Uint8Array;

        beforeEach(() => {
            key = generateEncryptionKey();
        });

        it('should encrypt and decrypt a dataset', () => {
            const dataset = [
                { id: 1, name: 'Alice', age: 25 },
                { id: 2, name: 'Bob', age: 30 },
                { id: 3, name: 'Charlie', age: 35 },
            ];

            const encrypted = encryptDataset(dataset, key);
            const decrypted = decryptDataset(encrypted, key);

            expect(decrypted).toEqual(dataset);
        });

        it('should handle empty dataset', () => {
            const dataset: any[] = [];
            const encrypted = encryptDataset(dataset, key);
            const decrypted = decryptDataset(encrypted, key);

            expect(decrypted).toEqual(dataset);
        });

        it('should handle large dataset', () => {
            const dataset = Array.from({ length: 1000 }, (_, i) => ({
                id: i,
                value: Math.random(),
                text: `Row ${i}`,
            }));

            const encrypted = encryptDataset(dataset, key);
            const decrypted = decryptDataset(encrypted, key);

            expect(decrypted).toEqual(dataset);
        });
    });

    describe('File Encryption', () => {
        let key: Uint8Array;

        beforeEach(() => {
            key = generateEncryptionKey();
        });

        it('should encrypt and decrypt file data', () => {
            const fileData = new TextEncoder().encode('File contents here');
            const encrypted = encryptFile(fileData.buffer, key);
            const decrypted = decryptFile(encrypted, key);

            const decryptedText = new TextDecoder().decode(decrypted);
            expect(decryptedText).toBe('File contents here');
        });

        it('should handle binary file data', () => {
            const binaryData = new Uint8Array([0, 1, 2, 3, 255, 254, 253]);
            const encrypted = encryptFile(binaryData.buffer, key);
            const decrypted = decryptFile(encrypted, key);

            expect(new Uint8Array(decrypted)).toEqual(binaryData);
        });
    });

    describe('Hashing', () => {
        it('should hash data with SHA-256', () => {
            const data = 'test data';
            const hash = hashData(data);

            expect(typeof hash).toBe('string');
            expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
        });

        it('should produce consistent hashes', () => {
            const data = 'test data';
            const hash1 = hashData(data);
            const hash2 = hashData(data);

            expect(hash1).toBe(hash2);
        });

        it('should produce different hashes for different data', () => {
            const hash1 = hashData('data1');
            const hash2 = hashData('data2');

            expect(hash1).not.toBe(hash2);
        });

        it('should verify correct hash', () => {
            const data = 'test data';
            const hash = hashData(data);

            expect(verifyHash(data, hash)).toBe(true);
        });

        it('should reject incorrect hash', () => {
            const data = 'test data';
            const hash = hashData(data);

            expect(verifyHash('wrong data', hash)).toBe(false);
        });
    });

    describe('Key Import/Export', () => {
        it('should export and import a key', () => {
            const originalKey = generateEncryptionKey();
            const exported = exportKey(originalKey);
            const imported = importKey(exported);

            expect(imported).toEqual(originalKey);
        });

        it('should export key as base64 string', () => {
            const key = generateEncryptionKey();
            const exported = exportKey(key);

            expect(typeof exported).toBe('string');
            expect(exported).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 pattern
        });
    });

    describe('Utilities', () => {
        it('should generate a secure random ID', () => {
            const id = generateSecureId();

            expect(typeof id).toBe('string');
            expect(id.length).toBe(32); // 16 bytes = 32 hex characters
        });

        it('should generate unique IDs', () => {
            const id1 = generateSecureId();
            const id2 = generateSecureId();

            expect(id1).not.toBe(id2);
        });
    });

    describe('Performance', () => {
        it('should encrypt small data quickly', () => {
            const key = generateEncryptionKey();
            const data = 'Small data';

            const start = performance.now();
            encryptData(data, key);
            const end = performance.now();

            expect(end - start).toBeLessThan(10); // Should be < 10ms
        });

        it('should decrypt small data quickly', () => {
            const key = generateEncryptionKey();
            const data = 'Small data';
            const encrypted = encryptData(data, key);

            const start = performance.now();
            decryptData(encrypted, key);
            const end = performance.now();

            expect(end - start).toBeLessThan(10); // Should be < 10ms
        });
    });
});
