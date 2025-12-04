import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, Info, CheckCircle } from 'lucide-react';
import { useChurnDataUpload } from '@/hooks/useChurnDataUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const ChurnDataUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadChurnData, isUploading } = useChurnDataUpload();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles) {
      await uploadChurnData(selectedFiles);
      setSelectedFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearSelection = () => {
    setSelectedFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Upload Churn Training Data
        </CardTitle>
        <CardDescription>
          Upload CSV or Excel files containing customer churn data for training machine learning models
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your file should include columns for: tenure, monthly_charges, contract_type, and churn label (churned/retained).
            Optional columns: customer_id, total_charges, internet_service, payment_method, gender, senior_citizen.
          </AlertDescription>
        </Alert>

        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium">Drop your churn data files here</p>
            <p className="text-sm text-muted-foreground">
              or click to select files
            </p>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Choose Files
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            disabled={isUploading}
            title="Select churn data files to upload"
          />
        </div>

        {selectedFiles && (
          <div className="space-y-3">
            <h4 className="font-medium">Selected Files:</h4>
            {Array.from(selectedFiles).map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-4 w-4" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {file.name.split('.').pop()?.toUpperCase()}
                </Badge>
              </div>
            ))}
            
            <div className="flex gap-2">
              <Button 
                onClick={handleUpload} 
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? 'Uploading...' : 'Upload Churn Data'}
              </Button>
              <Button 
                variant="outline" 
                onClick={clearSelection}
                disabled={isUploading}
              >
                Clear
              </Button>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Progress value={undefined} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">
                  Processing and uploading churn data...
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">CSV</div>
            <p className="text-sm text-muted-foreground">Comma-separated values</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">XLSX</div>
            <p className="text-sm text-muted-foreground">Excel spreadsheets</p>
          </div>
          <div className="text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-1" />
            <p className="text-sm text-muted-foreground">Auto-validation</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};