// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { toast } from 'sonner';

interface ChurnDataPoint {
  tenure: number;
  monthly_charges: number;
  contract_type: 'Month-to-month' | 'One year' | 'Two year';
  label: boolean;
  customer_id?: string;
  total_charges?: number;
  internet_service?: string;
  payment_method?: string;
  gender?: string;
  senior_citizen?: boolean;
}

export const useChurnDataUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { company } = useCompany();

  const processFile = async (file: File): Promise<ChurnDataPoint[]> => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            try {
              const processedData = validateAndTransformChurnData(results.data);
              resolve(processedData);
            } catch (error) {
              reject(error);
            }
          },
          error: (error) => reject(error)
        });
      } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(e.target?.result, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(worksheet);
            const processedData = validateAndTransformChurnData(rawData);
            resolve(processedData);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read Excel file'));
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('Unsupported file format. Please use CSV or Excel files.'));
      }
    });
  };

  const validateAndTransformChurnData = (rawData: any[]): ChurnDataPoint[] => {
    if (!rawData || rawData.length === 0) {
      throw new Error('No data found in the file');
    }

    const transformedData: ChurnDataPoint[] = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      
      if (!row || Object.keys(row).length === 0) continue;

      try {
        const tenure = parseNumber(getFieldValue(row, ['tenure', 'months', 'duration']));
        const monthly_charges = parseNumber(getFieldValue(row, ['monthly_charges', 'monthly_fee', 'charges']));
        const contract_type = parseContractType(getFieldValue(row, ['contract_type', 'contract']));
        const label = parseChurnLabel(getFieldValue(row, ['churn', 'churned', 'label']));

        if (tenure === null || monthly_charges === null || !contract_type || label === null) {
          continue;
        }

        const churnPoint: ChurnDataPoint = {
          tenure,
          monthly_charges,
          contract_type,
          label,
        };

        const customer_id = getFieldValue(row, ['customer_id', 'id']);
        if (customer_id) churnPoint.customer_id = String(customer_id);

        transformedData.push(churnPoint);
      } catch (error) {
        console.warn(`Error processing row ${i + 1}:`, error);
      }
    }

    return transformedData;
  };

  const getFieldValue = (row: any, fieldNames: string[]): any => {
    for (const fieldName of fieldNames) {
      for (const key in row) {
        if (key.toLowerCase().includes(fieldName.toLowerCase())) {
          return row[key];
        }
      }
    }
    return null;
  };

  const parseNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  };

  const parseContractType = (value: any): 'Month-to-month' | 'One year' | 'Two year' | null => {
    if (!value) return null;
    const str = String(value).toLowerCase();
    if (str.includes('month')) return 'Month-to-month';
    if (str.includes('one') || str.includes('1')) return 'One year';
    if (str.includes('two') || str.includes('2')) return 'Two year';
    return null;
  };

  const parseChurnLabel = (value: any): boolean | null => {
    if (value === null || value === undefined) return null;
    const str = String(value).toLowerCase();
    if (str === 'true' || str === '1' || str === 'yes' || str === 'churned') return true;
    if (str === 'false' || str === '0' || str === 'no' || str === 'retained') return false;
    return null;
  };

  const uploadChurnData = async (files: FileList) => {
    if (!user) {
      toast.error('Please log in to upload data');
      return;
    }

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const { data: dataset, error: datasetError } = await supabase
          .from('datasets')
          .insert({
            name: `Churn Data - ${file.name}`,
            file_name: file.name,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
            status: 'processing',
            user_id: user.id,
            company_id: company?.id,
            description: 'Customer churn training data'
          })
          .select()
          .single();

        if (datasetError) {
          throw datasetError;
        }

        try {
          const churnData = await processFile(file);
          
          const churnInserts = churnData.map(point => ({
            ...point,
            user_id: user.id,
            company_id: company?.id,
            dataset_id: dataset.id
          }));

          const { error: insertError } = await supabase
            .from('churn_data')
            .insert(churnInserts);

          if (insertError) {
            throw insertError;
          }

          await supabase
            .from('datasets')
            .update({ status: 'completed' })
            .eq('id', dataset.id);

          toast.success(`Successfully uploaded ${churnData.length} churn data points from ${file.name}`);
        } catch (error) {
          await supabase
            .from('datasets')
            .update({ 
              status: 'error',
              metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
            })
            .eq('id', dataset.id);
          
          throw error;
        }
      }
    } catch (error) {
      console.error('Error uploading churn data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload churn data');
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadChurnData,
    isUploading
  };
};