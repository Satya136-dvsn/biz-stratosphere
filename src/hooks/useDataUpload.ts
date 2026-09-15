// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { checkRateLimit } from '@/lib/rateLimit';
import { useQueryClient } from '@tanstack/react-query';
import { maskRowPII, maskRowsPII } from '@/lib/data/piiMasking';
import { computeChurnKPIs, type ChurnKPIs } from '@/lib/data/kpiEngine';

type DataPoint = {
  metric_name: string;
  metric_value: number;
  metric_type: string;
  date_recorded: string;
  metadata?: Database["public"]["Tables"]["data_points"]["Insert"]["metadata"];
};

export function useDataUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [lastKPIs, setLastKPIs] = useState<ChurnKPIs | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { company } = useCompany();
  const queryClient = useQueryClient();

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
    // 1. Scrub PII from all incoming rows using clean regex masking
    const maskedRawData = maskRowsPII(rawData as Record<string, any>[]);

    // 2. Compute dynamic KPIs for churn/MRR data
    const kpis = computeChurnKPIs(maskedRawData);
    setLastKPIs(kpis);

    const dataPoints: DataPoint[] = [];

    maskedRawData.forEach((row: any, index: number) => {
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
              metadata: {
                original_row: row as unknown as import("@/integrations/supabase/types").Json,
                row_index: index,
                pii_masked: true,
              }
            });
          }
          return;
        }

        // Try to find metric name, value, and date columns
        const possibleNameFields = ['name', 'metric', 'metric_name', 'category', 'type'];
        const possibleValueFields = ['value', 'amount', 'metric_value', 'revenue', 'sales', 'count', 'mrr', 'MRR'];
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

        // If we couldn't find a name, use row index or account name
        if (!metricName) {
          metricName = row.account_name ? String(row.account_name) : `Metric_${index + 1}`;
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
          metadata: {
            original_row: row as import("@/integrations/supabase/types").Json,
            row_index: index,
            pii_masked: true,
          }
        });
      } catch (error) {
        console.warn(`Skipping row ${index + 1} due to validation error:`, error);
      }
    });

    // ALSO: Create raw CSV row entries for Advanced Charts with PII-masked rows
    maskedRawData.forEach((row: any, index: number) => {
      try {
        const possibleDateFields = ['date', 'created_at', 'timestamp', 'recorded_date', 'date_recorded'];
        let dateRecorded = new Date().toISOString();

        for (const field of possibleDateFields) {
          if (row[field]) {
            const date = new Date(row[field]);
            if (!isNaN(date.getTime())) {
              dateRecorded = date.toISOString();
              break;
            }
          }
        }

        dataPoints.push({
          metric_name: 'raw_csv_row',
          metric_value: 0,
          metric_type: 'raw',
          date_recorded: dateRecorded,
          metadata: {
            row_data: row as import("@/integrations/supabase/types").Json,
            is_raw: true,
            pii_masked: true,
            columns: Object.keys(row),
            row_index: index
          }
        });
      } catch (error) {
        console.warn(`Skipping raw row ${index + 1}:`, error);
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

    try {
      const rateLimitResult = await checkRateLimit(user.id, 'upload');

      if (!rateLimitResult.allowed) {
        const resetTime = rateLimitResult.resetAt.toLocaleTimeString();
        const resetDate = rateLimitResult.resetAt.toLocaleDateString();
        toast({
          title: "Upload Limit Reached",
          description: `You've reached your daily limit of ${rateLimitResult.limit} uploads. Limit resets at ${resetTime} on ${resetDate}. (${rateLimitResult.current}/${rateLimitResult.limit} used)`,
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Rate limit check error:', error);
    }

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        const dataPoints = await processFile(file);

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

        const { error } = await supabase.functions.invoke('data-upload', {
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
          description: `Processed ${dataPoints.length} data points from ${file.name} with PII auto-masking`,
        });

        queryClient.invalidateQueries({ queryKey: ['datasets'] });
        queryClient.invalidateQueries({ queryKey: ['kpi-data'] });
        queryClient.invalidateQueries({ queryKey: ['chart-data'] });
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

  /**
   * Load sample enterprise customer churn data (8 accounts) with PII auto-masking and KPI computation
   */
  const loadSampleChurnData = async () => {
    setIsUploading(true);
    try {
      let csvText = '';
      try {
        const response = await fetch('/customer_churn_data.csv');
        if (response.ok) {
          csvText = await response.text();
        }
      } catch {
        // Fallback to embedded CSV text below
      }

      if (!csvText) {
        csvText = `customer_id,account_name,contact_email,contact_phone,mrr,contract_length_months,support_tickets_open,usage_frequency_score,days_to_renewal,satisfaction_score,churn_risk_score,industry,tier
CUST-1001,Northstar Logistics,david.miller@northstarlogistics.com,+1-555-234-8841,48200,12,9,42,18,3.2,0.84,Supply Chain,Enterprise
CUST-1002,Cascade Global,sarah.connor@cascadeglobal.com,+1-555-891-4432,62500,24,12,35,45,2.8,0.88,Cloud Infrastructure,Enterprise
CUST-1003,Orbit Systems,marcus.vance@orbitsystems.io,+1-555-672-9100,22100,12,7,49,90,3.6,0.73,FinTech,Enterprise
CUST-1004,Apex Retail,elena.rostova@apexretail.com,+1-555-341-2099,76400,36,2,91,210,4.8,0.18,E-Commerce,Enterprise
CUST-1005,Meridian Health,dr.patel@meridianhealth.org,+1-555-443-7721,56300,24,3,78,180,4.2,0.36,Healthcare,Enterprise
CUST-1006,Vanguard Dynamics,alex.chen@vanguarddynamics.co,+1-555-908-1122,34900,12,8,38,24,3.1,0.81,Manufacturing,Enterprise
CUST-1007,Helios Energy,rachel.adams@heliosenergy.com,+1-555-812-3344,41000,12,4,65,150,4.0,0.42,Renewables,Enterprise
CUST-1008,Synthetix Media,james.wilson@synthetixmedia.com,+1-555-709-6655,18500,6,6,52,60,3.4,0.68,Digital Media,Enterprise`;
      }

      const parsed = Papa.parse<Record<string, any>>(csvText, { header: true, skipEmptyLines: true });
      const maskedRows = maskRowsPII(parsed.data);
      const kpis = computeChurnKPIs(maskedRows);
      setLastKPIs(kpis);

      const dataPoints = validateAndTransformData(maskedRows);

      if (user) {
        try {
          const datasetsPayload = [{
            name: 'customer_churn_data',
            file_name: 'customer_churn_data.csv',
            file_type: 'text/csv',
            file_size: csvText.length,
            status: 'completed',
            user_id: user.id,
            ...(company ? { company_id: company.id } : {}),
          }];

          const dataPointsPayload = dataPoints.map(dp => ({
            ...dp,
            user_id: user.id,
            ...(company ? { company_id: company.id } : {}),
          }));

          const { error } = await supabase.functions.invoke('data-upload', {
            body: {
              datasets: datasetsPayload,
              data_points: dataPointsPayload
            }
          });

          if (error) {
            console.warn('Edge function upload failed, continuing locally:', error);
          }
        } catch (err) {
          console.warn('Backend sync failed, continuing locally:', err);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-data'] });
      queryClient.invalidateQueries({ queryKey: ['chart-data'] });
      window.dispatchEvent(new CustomEvent('dataUploaded', { detail: { kpis, count: maskedRows.length } }));

      toast({
        title: "Sample Churn Data Loaded",
        description: `Loaded ${maskedRows.length} enterprise accounts ($${kpis.totalMRR.toLocaleString()} MRR, at-risk ARR: $${kpis.atRiskARR.toLocaleString()}). PII auto-masking applied.`,
      });

      return { kpis, rows: maskedRows };
    } catch (error) {
      console.error('Failed to load sample churn data:', error);
      toast({
        title: "Load Failed",
        description: error instanceof Error ? error.message : "Failed to load sample churn data.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadData,
    isUploading,
    loadSampleChurnData,
    lastKPIs,
    isMaskingActive: true,
  };
}
