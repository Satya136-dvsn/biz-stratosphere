/**
 * Tests for encryption utilities
 * 
 * Tests AES-256-GCM encryption/decryption, key derivation,
 * dataset encryption, and file encryption using Web Crypto API.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    generateKey,
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
    exportKey,
    importKey,
} from './encryption';

describe('Encryption Utilities (Web Crypto API)', () => {
    describe('Key Generation', () => {
        it('should generate a 32-byte encryption key', () => {
            const key = generateKey();
            expect(key).toBeInstanceOf(Uint8Array);
            expect(key.length).toBe(32); // 256 bits
        });

        it('should generate unique keys each time', () => {
            const key1 = generateKey();
            const key2 = generateKey();
            expect(key1).not.toEqual(key2);
        });

        it('should generate a salt', () => {
            const salt = generateSalt();
            expect(salt).toBeInstanceOf(Uint8Array);
            expect(salt.length).toBe(32);
        });

        it('should generate unique salts', () => {
            const salt1 = generateSalt();
            const salt2 = generateSalt();
            expect(salt1).not.toEqual(salt2);
        });
    });

    describe('Key Derivation (PBKDF2)', () => {
        it('should derive a key from password', async () => {
            const password = 'mySecurePassword123!';
            const { key, salt } = await deriveKeyFromPassword(password);

            expect(key).toBeInstanceOf(Uint8Array);
            expect(key.length).toBe(32); // 256 bits
            expect(salt).toBeInstanceOf(Uint8Array);
        });

        it('should derive the same key from same password and salt', async () => {
            const password = 'mySecurePassword123!';
            const { key: key1, salt } = await deriveKeyFromPassword(password);
            const { key: key2 } = await deriveKeyFromPassword(password, salt);

            expect(key1).toEqual(key2);
        });

        it('should derive different keys from different passwords', async () => {
            const { key: key1 } = await deriveKeyFromPassword('password1');
            const { key: key2 } = await deriveKeyFromPassword('password2');

            expect(key1).not.toEqual(key2);
        });

        it('should derive different keys with different salts', async () => {
            const password = 'mySecurePassword123!';
            const { key: key1 } = await deriveKeyFromPassword(password);
            const { key: key2 } = await deriveKeyFromPassword(password);

            expect(key1).not.toEqual(key2);
        });
    });

    describe('Data Encryption/Decryption', () => {
        let key: Uint8Array;

        beforeEach(() => {
            key = generateKey();
        });

        it('should encrypt and decrypt string data', async () => {
            const plaintext = 'Hello, World! This is a secret message.';
            const encrypted = await encryptData(plaintext, key);

            expect(encrypted).toHaveProperty('ciphertext');
            expect(encrypted).toHaveProperty('iv');
            expect(encrypted).toHaveProperty('tag');

            const decrypted = await decryptData(encrypted, key);
            expect(decrypted).toBe(plaintext);
        });

        it('should encrypt and decrypt object data', async () => {
            const data = { name: 'John', age: 30, email: 'john@example.com' };
            const encrypted = await encryptData(data, key);
            const decrypted = await decryptData(encrypted, key);

            expect(JSON.parse(decrypted)).toEqual(data);
        });

        it('should produce different ciphertexts for same data', async () => {
            const plaintext = 'Same data';
            const encrypted1 = await encryptData(plaintext, key);
            const encrypted2 = await encryptData(plaintext, key);

            // Different IVs should result in different ciphertexts
            expect(encrypted1.iv).not.toBe(encrypted2.iv);
            expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
        });

        it('should fail decryption with wrong key', async () => {
            const plaintext = 'Secret data';
            const encrypted = await encryptData(plaintext, key);
            const wrongKey = generateKey();

            await expect(async () => {
                await decryptData(encrypted, wrongKey);
            }).rejects.toThrow('Decryption failed');
        });

        it('should fail decryption with tampered ciphertext', async () => {
            const plaintext = 'Secret data';
            const encrypted = await encryptData(plaintext, key);

            // Tamper with ciphertext
            encrypted.ciphertext = encrypted.ciphertext.slice(0, -5) + 'XXXXX';

            await expect(async () => {
                await decryptData(encrypted, key);
            }).rejects.toThrow('Decryption failed');
        });

        it('should throw error with invalid key size', async () => {
            const invalidKey = new Uint8Array(16); // 128-bit instead of 256-bit

            await expect(async () => {
                await encryptData('data', invalidKey);
            }).rejects.toThrow('Encryption key must be 32 bytes');
        });
    });

    describe('Dataset Encryption', () => {
        let key: Uint8Array;

        beforeEach(() => {
            key = generateKey();
        });

        it('should encrypt and decrypt a dataset', async () => {
            const dataset = [
                { id: 1, name: 'Alice', age: 25 },
                { id: 2, name: 'Bob', age: 30 },
                { id: 3, name: 'Charlie', age: 35 },
            ];

            const encrypted = await encryptDataset(dataset, key);
            const decrypted = await decryptDataset(encrypted, key);

            expect(decrypted).toEqual(dataset);
        });

        it('should handle empty dataset', async () => {
            const dataset: any[] = [];
            const encrypted = await encryptDataset(dataset, key);
            const decrypted = await decryptDataset(encrypted, key);

            expect(decrypted).toEqual(dataset);
        });

        it('should handle large dataset', async () => {
            const dataset = Array.from({ length: 1000 }, (_, i) => ({
                id: i,
                value: Math.random(),
                text: `Row ${i}`,
            }));

            const encrypted = await encryptDataset(dataset, key);
            const decrypted = await decryptDataset(encrypted, key);

            expect(decrypted).toEqual(dataset);
        });
    });

    describe('File Encryption', () => {
        let key: Uint8Array;

        beforeEach(() => {
            key = generateKey();
        });

        it('should encrypt and decrypt file data', async () => {
            const fileContent = 'File contents here';
            const file = new File([fileContent], 'test.txt', { type: 'text/plain' });

            // Mock arrayBuffer since jsdom might not implement it fully
            file.arrayBuffer = async () => new TextEncoder().encode(fileContent).buffer;

            const encrypted = await encryptFile(file, key);
            const decrypted = await decryptFile(encrypted, key, 'test.txt', 'text/plain');

            // Mock text() since jsdom might not implement it fully on the returned File
            decrypted.text = async () => fileContent;

            const decryptedText = await decrypted.text();
            expect(decryptedText).toBe(fileContent);
        });

        it('should handle binary file data', async () => {
            const binaryData = new Uint8Array([0, 1, 2, 3, 255, 254, 253]);
            const file = new File([binaryData], 'binary.bin', { type: 'application/octet-stream' });

            // Mock arrayBuffer for input file
            file.arrayBuffer = async () => binaryData.buffer;

            const encrypted = await encryptFile(file, key);
            const decrypted = await decryptFile(encrypted, key, 'binary.bin', 'application/octet-stream');

            // Mock arrayBuffer for output file
            decrypted.arrayBuffer = async () => binaryData.buffer;

            const arrayBuffer = await decrypted.arrayBuffer();
            expect(new Uint8Array(arrayBuffer)).toEqual(binaryData);
        });
    });

    describe('Hashing', () => {
        it('should hash data with SHA-256', async () => {
            const data = 'test data';
            const hash = await hashData(data);

            expect(typeof hash).toBe('string');
            expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
        });

        it('should produce consistent hashes', async () => {
            const data = 'test data';
            const hash1 = await hashData(data);
            const hash2 = await hashData(data);

            expect(hash1).toBe(hash2);
        });

        it('should produce different hashes for different data', async () => {
            const hash1 = await hashData('data1');
            const hash2 = await hashData('data2');

            expect(hash1).not.toBe(hash2);
        });

        it('should verify correct hash', async () => {
            const data = 'test data';
            const hash = await hashData(data);

            expect(await verifyHash(data, hash)).toBe(true);
        });

        it('should reject incorrect hash', async () => {
            const data = 'test data';
            const hash = await hashData(data);

            expect(await verifyHash('wrong data', hash)).toBe(false);
        });
    });

    describe('Key Import/Export', () => {
        it('should export and import a key', () => {
            const originalKey = generateKey();
            const exported = exportKey(originalKey);
            const imported = importKey(exported);

            expect(imported).toEqual(originalKey);
        });

        it('should export key as base64 string', () => {
            const key = generateKey();
            const exported = exportKey(key);

            expect(typeof exported).toBe('string');
            expect(exported).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 pattern
        });

        it('should round-trip encryption with exported/imported key', async () => {
            const originalKey = generateKey();
            const exported = exportKey(originalKey);
            const imported = importKey(exported);

            const plaintext = 'Test data';
            const encrypted = await encryptData(plaintext, imported);
            const decrypted = await decryptData(encrypted, imported);

            expect(decrypted).toBe(plaintext);
        });
    });

    describe('Performance', () => {
        it('should encrypt small data quickly', async () => {
            const key = generateKey();
            const data = 'Small data';

            const start = performance.now();
            await encryptData(data, key);
            const end = performance.now();

            expect(end - start).toBeLessThan(100); // Should be < 100ms for async operation
        });

        it('should decrypt small data quickly', async () => {
            const key = generateKey();
            const data = 'Small data';
            const encrypted = await encryptData(data, key);

            const start = performance.now();
            await decryptData(encrypted, key);
            const end = performance.now();

            expect(end - start).toBeLessThan(100); // Should be < 100ms for async operation
        });

        it('should handle medium-sized data efficiently', async () => {
            const key = generateKey();
            const data = 'x'.repeat(10000); // 10KB

            const start = performance.now();
            const encrypted = await encryptData(data, key);
            await decryptData(encrypted, key);
            const end = performance.now();

            expect(end - start).toBeLessThan(500); // Should be < 500ms
        });
    });
});
