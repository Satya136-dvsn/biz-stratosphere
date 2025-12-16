/**
 * Encryption Utilities Library
 * 
 * Provides enterprise-grade encryption for Biz Stratosphere platform
 * using AES-256-GCM (Web Crypto API) for data at rest and secure key derivation.
 * 
 * Security Features:
 * - AES-256-GCM authenticated encryption (Web Crypto API)
 * - PBKDF2 key derivation from passwords (Web Crypto API)
 * - SHA-256 hashing (Web Crypto API)
 * - Secure random IV generation
 * - Base64 encoding for storage
 * - Type-safe interfaces
 * - Browser-native cryptography (no external dependencies)
 */

// Encryption configuration constants
const ENCRYPTION_CONFIG = {
    algorithm: 'AES-GCM',
    keySize: 32, // 256 bits
    ivSize: 12, // 96 bits (recommended for GCM)
    tagSize: 16, // 128 bits authentication tag (included in ciphertext by Web Crypto)
    saltSize: 32, // 256 bits for PBKDF2
    pbkdf2Iterations: 100000, // OWASP recommended minimum
} as const;

/**
 * UTF-8 Helper Functions
 */

/** Convert UTF-8 string to bytes */
function utf8ToBytes(str: string): Uint8Array {
    return new TextEncoder().encode(str);
}

/** Convert bytes to UTF-8 string */
function bytesToUtf8(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
}

/**
 * Encrypted data structure
 */
export interface EncryptedData {
    ciphertext: string; // Base64 encoded (includes auth tag)
    iv: string; // Base64 encoded initialization vector
    tag: string; // Base64 encoded authentication tag (for compatibility)
    salt?: string; // Base64 encoded salt (for password-derived keys)
}

/**
 * Key derivation result
 */
export interface KeyDerivationResult {
    key: Uint8Array;
    salt: Uint8Array;
}

/**
 * Generate a random encryption key
 * @returns 32-byte (256-bit) random key
 */
export function generateKey(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.keySize));
}

/**
 * Generate a random initialization vector (IV)
 * @returns 12-byte (96-bit) random IV
 */
export function generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivSize));
}

/**
 * Generate random salt for key derivation
 * @returns 32-byte (256-bit) random salt
 */
export function generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.saltSize));
}

/**
 * Derive an encryption key from a password using PBKDF2 (Web Crypto API)
 * 
 * @param password - User password
 * @param salt - Optional salt (will generate if not provided)
 * @param iterations - Number of PBKDF2 iterations (default: 100,000)
 * @returns Derived key and salt
 */
export async function deriveKeyFromPassword(
    password: string,
    salt?: Uint8Array,
    iterations: number = ENCRYPTION_CONFIG.pbkdf2Iterations
): Promise<KeyDerivationResult> {
    const actualSalt = salt || generateSalt();
    const passwordBytes = utf8ToBytes(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBytes,
        'PBKDF2',
        false,
        ['deriveBits']
    );

    // Derive key using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: actualSalt,
            iterations: iterations,
            hash: 'SHA-256',
        },
        keyMaterial,
        ENCRYPTION_CONFIG.keySize * 8 // bits
    );

    return {
        key: new Uint8Array(derivedBits),
        salt: actualSalt,
    };
}

/**
 * Encrypt data using AES-256-GCM
 * 
 * @param data - Data to encrypt (string or object)
 * @param key - 32-byte encryption key
 * @returns Encrypted data with IV and auth tag
 */
export async function encryptData(
    data: string | object,
    key: Uint8Array
): Promise<EncryptedData> {
    // Validate key size
    if (key.length !== ENCRYPTION_CONFIG.keySize) {
        throw new Error(`Encryption key must be ${ENCRYPTION_CONFIG.keySize} bytes`);
    }

    // Convert data to string if object
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    const plaintextBytes = utf8ToBytes(plaintext);

    // Generate random IV
    const iv = generateIV();

    // Import key for Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: ENCRYPTION_CONFIG.algorithm },
        false,
        ['encrypt']
    );

    // Encrypt data
    const ciphertextWithTag = await crypto.subtle.encrypt(
        {
            name: ENCRYPTION_CONFIG.algorithm,
            iv: iv,
        },
        cryptoKey,
        plaintextBytes
    );

    // Web Crypto API includes the auth tag in the ciphertext
    // For GCM, the last 16 bytes are the authentication tag
    const ciphertextBytes = new Uint8Array(ciphertextWithTag);
    const ciphertext = ciphertextBytes.slice(0, -16);
    const tag = ciphertextBytes.slice(-16);

    return {
        ciphertext: btoa(String.fromCharCode(...ciphertext)),
        iv: btoa(String.fromCharCode(...iv)),
        tag: btoa(String.fromCharCode(...tag)),
    };
}

/**
 * Decrypt data using AES-256-GCM
 * 
 * @param encryptedData - Encrypted data with IV and tag
 * @param key - 32-byte decryption key
 * @returns Decrypted string
 */
export async function decryptData(
    encryptedData: EncryptedData,
    key: Uint8Array
): Promise<string> {
    // Validate key size
    if (key.length !== ENCRYPTION_CONFIG.keySize) {
        throw new Error(`Decryption key must be ${ENCRYPTION_CONFIG.keySize} bytes`);
    }

    // Decode base64 data
    const ciphertext = Uint8Array.from(atob(encryptedData.ciphertext), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
    const tag = Uint8Array.from(atob(encryptedData.tag), c => c.charCodeAt(0));

    // Combine ciphertext and tag (Web Crypto expects them together)
    const ciphertextWithTag = new Uint8Array(ciphertext.length + tag.length);
    ciphertextWithTag.set(ciphertext);
    ciphertextWithTag.set(tag, ciphertext.length);

    // Import key for Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: ENCRYPTION_CONFIG.algorithm },
        false,
        ['decrypt']
    );

    // Decrypt data
    try {
        const plaintextBytes = await crypto.subtle.decrypt(
            {
                name: ENCRYPTION_CONFIG.algorithm,
                iv: iv,
            },
            cryptoKey,
            ciphertextWithTag
        );

        return bytesToUtf8(new Uint8Array(plaintextBytes));
    } catch (error) {
        throw new Error('Decryption failed');
    }
}

/**
 * Encrypt a dataset (array of objects)
 * 
 * @param dataset - Array of data objects
 * @param key - Encryption key
 * @returns Encrypted dataset
 */
export async function encryptDataset(
    dataset: object[],
    key: Uint8Array
): Promise<EncryptedData> {
    const jsonData = JSON.stringify(dataset);
    return encryptData(jsonData, key);
}

/**
 * Decrypt a dataset
 * 
 * @param encryptedData - Encrypted dataset
 * @param key - Decryption key
 * @returns Decrypted array of objects
 */
export async function decryptDataset(
    encryptedData: EncryptedData,
    key: Uint8Array
): Promise<object[]> {
    const jsonData = await decryptData(encryptedData, key);
    return JSON.parse(jsonData);
}

/**
 * Encrypt a file
 * 
 * @param file - File to encrypt
 * @param key - Encryption key
 * @returns Encrypted file data
 */
export async function encryptFile(
    file: File,
    key: Uint8Array
): Promise<EncryptedData> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...bytes));

    return encryptData(base64, key);
}

/**
 * Decrypt a file
 * 
 * @param encryptedData - Encrypted file data
 * @param key - Decryption key
 * @param filename - Original filename
 * @param mimeType - File MIME type
 * @returns Decrypted File object
 */
export async function decryptFile(
    encryptedData: EncryptedData,
    key: Uint8Array,
    filename: string,
    mimeType: string = 'application/octet-stream'
): Promise<File> {
    const base64 = await decryptData(encryptedData, key);
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    return new File([bytes], filename, { type: mimeType });
}

/**
 *  * Hash data using SHA-256 (Web Crypto API)
 * 
 * @param data - Data to hash
 * @returns Hex-encoded hash
 */
export async function hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);

    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
}

/**
 * Verify data against a hash
 * 
 * @param data - Data to verify
 * @param hash - Expected hash (hex-encoded)
 * @returns True if hash matches
 */
export async function verifyHash(data: string, hash: string): Promise<boolean> {
    const computedHash = await hashData(data);
    return computedHash === hash;
}

/**
 * Export key as base64 string (for storage)
 * 
 * @param key - Key to export
 * @returns Base64-encoded key
 */
export function exportKey(key: Uint8Array): string {
    return btoa(String.fromCharCode(...key));
}

/**
 * Import key from base64 string
 * 
 * @param base64Key - Base64-encoded key
 * @returns Key as Uint8Array
 */
export function importKey(base64Key: string): Uint8Array {
    return Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
}

/**
 * Securely wipe a key from memory
 * 
 * @param key - Key to wipe
 */
export function wipeKey(key: Uint8Array): void {
    crypto.getRandomValues(key); // Overwrite with random data
    key.fill(0); // Then zero out
}

/**
 * Get encryption configuration
 * 
 * @returns Encryption configuration object
 */
export function getEncryptionConfig() {
    return { ...ENCRYPTION_CONFIG };
}
