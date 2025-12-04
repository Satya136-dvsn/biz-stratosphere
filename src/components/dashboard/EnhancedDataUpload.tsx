import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';

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
        const quality = analyzeCSV(results.data, results.meta.fields || []);
        setAnalysis(quality);
        setLoading(false);
        
        toast({
          title: "Analysis Complete",
          description: `Analyzed ${quality.totalRows} rows with ${quality.totalColumns} columns`,
        });
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
    if (!file || !analysis) return;

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create dataset record
      const { error: datasetError } = await supabase
        .from('datasets')
        .insert([{
          name: file.name,
          file_name: file.name,
          file_type: 'csv',
          file_size: file.size,
          status: 'completed' as const,
          metadata: {
            quality: analysis,
            uploaded_at: new Date().toISOString()
          }
        }] as any);

      if (datasetError) throw datasetError;

      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded and analyzed`,
      });

      setFile(null);
      setAnalysis(null);
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
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={loading}
          />
          <Button
            onClick={handleAnalyze}
            disabled={!file || loading}
            variant="secondary"
          >
            <FileText className="h-4 w-4 mr-2" />
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

            <Button onClick={handleUpload} disabled={loading} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Upload Dataset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}