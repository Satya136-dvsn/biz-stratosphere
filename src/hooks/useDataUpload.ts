import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { checkRateLimit } from '@/lib/rateLimit';

type DataPoint = {
  metric_name: string;
  metric_value: number;
  metric_type: string;
  date_recorded: string;
  metadata?: Database["public"]["Tables"]["data_points"]["Insert"]["metadata"];
};

export function useDataUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { company } = useCompany();

  const processFile = async (file: File): Promise<DataPoint[]> => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            try {
              const dataPoints = validateAndTransformData(results.data);
              resolve(dataPoints);
            } catch (error) {
              reject(error);
            }
          },
          error: (error) => reject(error)
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            const dataPoints = validateAndTransformData(jsonData);
            resolve(dataPoints);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('Unsupported file format. Please upload CSV or Excel files.'));
      }
    });
  };

  const validateAndTransformData = (rawData: unknown[]): DataPoint[] => {
    const dataPoints: DataPoint[] = [];

    rawData.forEach((row: any, index: number) => {
      try {
        // Custom mapping for user data format
        // Map churn column as metric_name and estimated_ as metric_value
        if ('churn' in row && 'estimated_' in row) {
          const metricName = 'churn';
          const metricValue = Number(row['estimated_']);
          const dateRecorded = new Date().toISOString();

          if (!isNaN(metricValue)) {
            dataPoints.push({
              metric_name: metricName,
              metric_value: metricValue,
              metric_type: 'number',
              date_recorded: dateRecorded,
              metadata: { original_row: row as unknown as import("@/integrations/supabase/types").Json, row_index: index }
            });
          }
          return;
        }

        // Try to find metric name, value, and date columns
        const possibleNameFields = ['name', 'metric', 'metric_name', 'category', 'type'];
        const possibleValueFields = ['value', 'amount', 'metric_value', 'revenue', 'sales', 'count'];
        const possibleDateFields = ['date', 'created_at', 'timestamp', 'recorded_date', 'date_recorded'];

        let metricName = '';
        let metricValue = 0;
        let dateRecorded = new Date().toISOString();

        // Find metric name
        for (const field of possibleNameFields) {
          if (row[field]) {
            metricName = String(row[field]);
            break;
          }
        }

        // Find metric value
        for (const field of possibleValueFields) {
          if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
            const value = Number(row[field]);
            if (!isNaN(value)) {
              metricValue = value;
              break;
            }
          }
        }

        // Find date
        for (const field of possibleDateFields) {
          if (row[field]) {
            const date = new Date(row[field]);
            if (!isNaN(date.getTime())) {
              dateRecorded = date.toISOString();
              break;
            }
          }
        }

        // If we couldn't find a name, use row index or a generic name
        if (!metricName) {
          metricName = `Metric_${index + 1}`;
        }

        // Skip rows with invalid values
        if (isNaN(metricValue)) {
          return;
        }

        dataPoints.push({
          metric_name: metricName,
          metric_value: metricValue,
          metric_type: 'number',
          date_recorded: dateRecorded,
          metadata: { original_row: row as import("@/integrations/supabase/types").Json, row_index: index }
        });
      } catch (error) {
        console.warn(`Skipping row ${index + 1} due to validation error:`, error);
      }
    });

    if (dataPoints.length === 0) {
      throw new Error('No valid data points found in the file. Please check your data format.');
    }

    return dataPoints;
  };

  const uploadData = async (files: FileList) => {

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload data.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Process file
        const dataPoints = await processFile(file);

        // Prepare payload for backend function
        const datasetsPayload = [{
          name: file.name.split('.')[0],
          file_name: file.name,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          status: 'processing',
          user_id: user.id,
          ...(company ? { company_id: company.id } : {}),
        }];

        const dataPointsPayload = dataPoints.map(dp => ({
          ...dp,
          user_id: user.id,
          ...(company ? { company_id: company.id } : {}),
        }));

        // Call Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('data-upload', {
          body: {
            datasets: datasetsPayload,
            data_points: dataPointsPayload
          }
        });

        if (error) {
          throw new Error(error.message || 'Upload failed');
        }

        toast({
          title: "Upload Successful",
          description: `Processed ${dataPoints.length} data points from ${file.name}`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to process uploaded files.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadData,
    isUploading
  };
}
