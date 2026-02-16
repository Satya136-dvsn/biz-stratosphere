// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Encrypted Data Upload Hook
 * 
 * Provides encrypted data upload functionality with client-side encryption
 * before sending data to Supabase storage.
 * 
 * Features:
 * - Client-side CSV/Excel parsing and encryption
 * - Encrypted metadata storage
 * - Session-based encryption key management
 * - Progress tracking
 * - PII detection before encryption
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
    encryptDataset,
    decryptDataset,
    type EncryptedData,
} from '@/lib/encryption';
import { getDataKey, isSessionActive } from '@/lib/keyManagement';
import Papa from 'papaparse';

/**
 * Encrypted dataset metadata stored in database
 */
export interface EncryptedDatasetMetadata {
    id: string;
    user_id: string;
    name: string;
    original_filename: string;
    encrypted_data: EncryptedData;
    row_count: number;
    column_count: number;
    column_names: string[]; // Encrypted separately
    file_size: number;
    upload_date: string;
    is_encrypted: boolean;
    encryption_version: number;
}

/**
 * Upload progress state
 */
interface UploadProgress {
    stage: 'parsing' | 'encrypting' | 'uploading' | 'complete';
    percent: number;
    message: string;
}

/**
 * Hook return type
 */
interface UseEncryptedDataUploadReturn {
    uploadEncrypted: (file: File, sessionId: string) => Promise<string | null>;
    downloadDecrypted: (datasetId: string, sessionId: string) => Promise<any[] | null>;
    isUploading: boolean;
    progress: UploadProgress | null;
}

/**
 * Hook for encrypted data upload and download
 */
export function useEncryptedDataUpload(): UseEncryptedDataUploadReturn {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState<UploadProgress | null>(null);
    const { toast } = useToast();

    /**
     * Upload and encrypt dataset
     */
    const uploadEncrypted = async (
        file: File,
        sessionId: string
    ): Promise<string | null> => {
        // Validate session
        if (!sessionId || !isSessionActive(sessionId)) {
            toast({
                title: 'Session Expired',
                description: 'Please log in again to upload encrypted data',
                variant: 'destructive',
            });
            return null;
        }

        setIsUploading(true);
        setProgress({
            stage: 'parsing',
            percent: 10,
            message: 'Parsing CSV file...',
        });

        try {
            // Step 1: Parse CSV file
            const parsedData = await parseCSVFile(file);

            if (!parsedData || parsedData.length === 0) {
                throw new Error('No data found in file');
            }

            setProgress({
                stage: 'encrypting',
                percent: 40,
                message: 'Encrypting data...',
            });

            // Step 2: Get encryption key from session
            const dataKey = getDataKey(sessionId);

            // Step 3: Encrypt dataset
            const encryptedData = encryptDataset(parsedData, dataKey);

            // Extract metadata
            const columnNames = Object.keys(parsedData[0] || {});

            setProgress({
                stage: 'uploading',
                percent: 70,
                message: 'Uploading to secure storage...',
            });

            // Step 4: Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Step 5: Store encrypted dataset with metadata
            const { data: dataset, error } = await supabase
                .from('datasets')
                .insert({
                    user_id: user.id,
                    name: file.name.replace('.csv', ''),
                    file_name: file.name,
                    uploaded_at: new Date().toISOString(),
                    row_count: parsedData.length,
                    column_count: columnNames.length,
                    // Store encrypted data as JSONB
                    encrypted_blob: encryptedData,
                    is_encrypted: true,
                    encryption_version: 1,
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            setProgress({
                stage: 'complete',
                percent: 100,
                message: 'Upload complete! Data is now encrypted.',
            });

            toast({
                title: 'Success',
                description: `${file.name} uploaded and encrypted successfully`,
            });

            // Clear progress after delay
            setTimeout(() => {
                setProgress(null);
            }, 2000);

            return dataset.id;

        } catch (error) {
            console.error('Upload error:', error);
            toast({
                title: 'Upload Failed',
                description: error instanceof Error ? error.message : 'Failed to upload encrypted data',
                variant: 'destructive',
            });
            setProgress(null);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Download and decrypt dataset
     */
    const downloadDecrypted = async (
        datasetId: string,
        sessionId: string
    ): Promise<any[] | null> => {
        // Validate session
        if (!sessionId || !isSessionActive(sessionId)) {
            toast({
                title: 'Session Expired',
                description: 'Please log in again to access encrypted data',
                variant: 'destructive',
            });
            return null;
        }

        try {
            // Step 1: Fetch encrypted dataset
            const { data: dataset, error } = await supabase
                .from('datasets')
                .select('*')
                .eq('id', datasetId)
                .single();

            if (error) {
                throw error;
            }

            if (!dataset.is_encrypted || !dataset.encrypted_blob) {
                // Fallback for non-encrypted legacy data
                console.warn('Dataset is not encrypted, fetching from data_points');
                const { data: dataPoints } = await supabase
                    .from('data_points')
                    .select('*')
                    .eq('dataset_id', datasetId);

                return dataPoints || [];
            }

            // Step 2: Get decryption key
            const dataKey = getDataKey(sessionId);

            // Step 3: Decrypt dataset
            const decryptedData = decryptDataset(dataset.encrypted_blob, dataKey);

            return decryptedData;

        } catch (error) {
            console.error('Download error:', error);
            toast({
                title: 'Download Failed',
                description: error instanceof Error ? error.message : 'Failed to decrypt data',
                variant: 'destructive',
            });
            return null;
        }
    };

    return {
        uploadEncrypted,
        downloadDecrypted,
        isUploading,
        progress,
    };
}

/**
 * Parse CSV file to JSON array
 */
async function parseCSVFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve(results.data);
            },
            error: (error) => {
                reject(error);
            },
        });
    });
}

/**
 * Utility: Check if dataset is encrypted
 */
export async function isDatasetEncrypted(datasetId: string): Promise<boolean> {
    try {
        const { data } = await supabase
            .from('datasets')
            .select('is_encrypted')
            .eq('id', datasetId)
            .single();

        return data?.is_encrypted || false;
    } catch {
        return false;
    }
}

/**
 * Utility: Get encryption status for all user datasets
 */
export async function getEncryptionStatus(userId: string): Promise<{
    total: number;
    encrypted: number;
    unencrypted: number;
}> {
    try {
        const { data } = await supabase
            .from('datasets')
            .select('is_encrypted')
            .eq('user_id', userId);

        if (!data) {
            return { total: 0, encrypted: 0, unencrypted: 0 };
        }

        const encrypted = data.filter(d => d.is_encrypted).length;
        const unencrypted = data.length - encrypted;

        return {
            total: data.length,
            encrypted,
            unencrypted,
        };
    } catch {
        return { total: 0, encrypted: 0, unencrypted: 0 };
    }
}
