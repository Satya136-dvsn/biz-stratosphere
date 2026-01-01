import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle2, AlertCircle, TrendingUp, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';
import { scanDataForPII, type PIIScanResult } from '@/lib/piiDetection';
import { PIIDetection } from './PIIDetection';

interface DataQuality {
  totalRows: number;
  totalColumns: number;
  missingValues: number;
  duplicates: number;
  numericColumns: string[];
  categoricalColumns: string[];
  dateColumns: string[];
  outliers: { column: string; count: number }[];
}

export function EnhancedDataUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DataQuality | null>(null);
  const [piiScan, setPiiScan] = useState<PIIScanResult | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [piiConsent, setPiiConsent] = useState(false);
  const { toast } = useToast();

  const analyzeCSV = (data: any[], fields: string[]) => {
    const numericColumns: string[] = [];
    const categoricalColumns: string[] = [];
    const dateColumns: string[] = [];
    let missingValues = 0;

    // Analyze columns
    fields.forEach(field => {
      const sample = data.find(row => row[field] != null)?.[field];

      if (!isNaN(Number(sample))) {
        numericColumns.push(field);
      } else if (!isNaN(Date.parse(sample))) {
        dateColumns.push(field);
      } else {
        categoricalColumns.push(field);
      }
    });

    // Count missing values
    data.forEach(row => {
      fields.forEach(field => {
        if (row[field] == null || row[field] === '') {
          missingValues++;
        }
      });
    });

    // Detect outliers in numeric columns
    const outliers = numericColumns.map(col => {
      const values = data.map(row => Number(row[col])).filter(v => !isNaN(v));
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(
        values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
      );
      const outCount = values.filter(v => Math.abs(v - mean) > 3 * std).length;
      return { column: col, count: outCount };
    }).filter(o => o.count > 0);

    // Detect duplicates
    const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
    const duplicates = data.length - uniqueRows.size;

    return {
      totalRows: data.length,
      totalColumns: fields.length,
      missingValues,
      duplicates,
      numericColumns,
      categoricalColumns,
      dateColumns,
      outliers
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid File",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      setAnalysis(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as any[];
        const fields = results.meta.fields || [];

        // Analyze quality
        const quality = analyzeCSV(data, fields);
        setAnalysis(quality);

        // Scan for PII
        const scanResult = scanDataForPII(data, fields);
        setPiiScan(scanResult);
        setParsedData(data);

        // Reset consent if new file
        setPiiConsent(false);

        setLoading(false);

        if (scanResult.hasPII) {
          toast({
            title: "⚠️ PII Detected",
            description: `Found ${scanResult.piiColumns.length} columns with potential personally identifiable information. Please review and provide consent.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Analysis Complete",
            description: `Analyzed ${quality.totalRows} rows with ${quality.totalColumns} columns. No PII detected.`,
          });
        }
      },
      error: (error) => {
        console.error('Parse error:', error);
        toast({
          title: "Error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
        setLoading(false);
      }
    });
  };

  const handleUpload = async () => {
    console.log('Starting upload. Parsed data length:', parsedData.length);

    if (!file || !analysis) return;

    if (!parsedData.length) {
      toast({
        title: "Error",
        description: "No data found to upload. Please try analyzing again.",
        variant: "destructive"
      });
      return;
    }

    // Validate PII consent
    if (piiScan?.hasPII && !piiConsent) {
      toast({
        title: "Consent Required",
        description: "You must acknowledge and provide consent to process data containing PII.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Create dataset record
      const { data: dataset, error: datasetError } = await supabase
        .from('datasets')
        .insert([{
          user_id: user.id,
          name: file.name,
          file_name: file.name,
          file_type: 'csv',
          file_size: file.size,
          status: 'processing' as const, // Set to processing initially
          metadata: {
            quality: analysis,
            pii_scan: piiScan,
            pii_consent_given: piiConsent,
            uploaded_at: new Date().toISOString()
          }
        }] as any)
        .select()
        .single();

      if (datasetError || !dataset) throw datasetError;

      // 2. Prepare Data Points (Batch Processing)
      const BATCH_SIZE = 100; // conservative batch size
      const pointsToInsert: any[] = [];
      const timestamp = new Date().toISOString();

      // Helper to try parsing date
      const parseDate = (row: any) => {
        // Try common date fields
        const dateField = Object.keys(row).find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('time'));
        if (dateField && row[dateField]) {
          const d = new Date(row[dateField]);
          if (!isNaN(d.getTime())) return d.toISOString();
        }
        return timestamp; // Fallback to upload time
      };

      parsedData.forEach(row => {
        const rowDate = parseDate(row);

        // A. Insert Raw Row (for Table Views / Advanced Charts)
        pointsToInsert.push({
          user_id: user.id,
          dataset_id: dataset.id,
          metric_name: 'raw_csv_row',
          metric_value: 0, // Placeholder
          date_recorded: rowDate,
          metadata: { row_data: row }
        });

        // B. Insert Individual Numeric Metrics (for Aggregation Reports)
        // Auto-detect numeric fields from the row
        Object.entries(row).forEach(([key, val]) => {
          // Skip IDs, dates, and non-numeric
          if (key.toLowerCase().includes('date') || key.toLowerCase().includes('id')) return;

          const numVal = parseFloat(val as string);
          if (!isNaN(numVal)) {
            pointsToInsert.push({
              user_id: user.id,
              dataset_id: dataset.id,
              metric_name: key.toLowerCase().trim(), // Normalize metric name
              metric_value: numVal,
              date_recorded: rowDate,
              metadata: { original_key: key }
            });
          }
        });
      });

      // 3. Perform Batched Inserts
      console.log(`Uploading ${pointsToInsert.length} data points...`);

      for (let i = 0; i < pointsToInsert.length; i += BATCH_SIZE) {
        const batch = pointsToInsert.slice(i, i + BATCH_SIZE);
        const { error: batchError } = await supabase
          .from('data_points')
          .insert(batch);

        if (batchError) {
          console.error('Batch upload error:', batchError);
          // We continue trying best effort, but log critical failure
          toast({
            title: "Batch Upload Issue",
            description: `Some records failed to upload: ${batchError.message}`,
            variant: "destructive"
          });
        }

        // Optional: Update progress UI here if we had one
      }

      // 4. Update Dataset Status to Completed
      await supabase
        .from('datasets')
        .update({ status: 'completed' } as any)
        .eq('id', dataset.id);

      toast({
        title: "Upload Successful",
        description: `${file.name} has been processed. ${pointsToInsert.length} data points created.`,
      });

      setFile(null);
      setAnalysis(null);
      setPiiScan(null);
      setPiiConsent(false);
      setParsedData([]);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Enhanced Data Upload
        </CardTitle>
        <CardDescription>
          Upload CSV files with automatic quality analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={loading}
            className="cursor-pointer border-2 hover:border-primary/50 transition-colors h-14 text-base"
          />
          <Button
            onClick={handleAnalyze}
            disabled={!file || loading}
            size="lg"
            className="w-full transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-95 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 h-12"
          >
            <FileText className="h-5 w-5 mr-2" />
            Analyze
          </Button>
        </div>

        {analysis && (
          <div className="space-y-4 p-4 bg-secondary/20 rounded-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Data Quality Report
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Rows</p>
                <p className="font-semibold">{analysis.totalRows.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Columns</p>
                <p className="font-semibold">{analysis.totalColumns}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Missing Values</p>
                <p className="font-semibold text-warning">{analysis.missingValues}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Duplicates</p>
                <p className="font-semibold text-warning">{analysis.duplicates}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Numeric Columns ({analysis.numericColumns.length})</p>
              <p className="text-xs text-muted-foreground">{analysis.numericColumns.join(', ')}</p>
            </div>

            {analysis.outliers.length > 0 && (
              <div className="flex items-start gap-2 p-2 bg-warning/10 rounded">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold">Outliers Detected</p>
                  {analysis.outliers.map(o => (
                    <p key={o.column}>{o.column}: {o.count} outliers</p>
                  ))}
                </div>
              </div>
            )}

            {/* PII Detection Results */}
            {piiScan && piiScan.hasPII && (
              <div className="space-y-4">
                <PIIDetection data={parsedData} columns={Object.keys(parsedData[0] || {})} />

                <div className="flex items-start gap-3 p-4 border-2 border-warning rounded-lg bg-warning/5">
                  <Checkbox
                    id="pii-consent"
                    checked={piiConsent}
                    onCheckedChange={(checked) => setPiiConsent(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="pii-consent"
                      className="text-sm font-medium cursor-pointer"
                    >
                      I acknowledge this data contains personally identifiable information (PII)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      By checking this box, you confirm that you have the necessary rights and permissions
                      to process this data, and that it will be handled in accordance with applicable
                      privacy regulations (GDPR, CCPA, etc.).
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={loading || (piiScan?.hasPII && !piiConsent)}
              className="w-full transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-95"
            >
              <Upload className="h-4 w-4 mr-2" />
              {piiScan?.hasPII && !piiConsent ? 'Consent Required to Upload' : 'Upload Dataset'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}