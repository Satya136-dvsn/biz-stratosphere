import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useDataUpload } from "@/hooks/useDataUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Dataset {
  id: string;
  name: string;
  file_name: string;
  file_size: number;
  status: string;
  created_at: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown; // Allow extra fields from DB
}

export function DataUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadData, isUploading } = useDataUpload();
  const { user } = useAuth();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    await uploadData(files);
    await fetchDatasets(); // Refresh the list
    // Trigger a refresh of KPI data when new data is uploaded
    window.dispatchEvent(new CustomEvent('dataUploaded'));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const fetchDatasets = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setDatasets(
        (data || []).map((d: {
          id: string;
          name: string;
          file_name: string;
          file_size: number;
          status: string;
          created_at: string;
          metadata?: unknown;
          [key: string]: unknown;
        }) => ({
          ...d,
          metadata: typeof d.metadata === "string"
            ? (() => { try { return JSON.parse(d.metadata as string); } catch { return {}; } })()
            : (typeof d.metadata === "object" && d.metadata !== null ? d.metadata : {}),
        }))
      );
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDataset = async (id: string) => {
    try {
      // Delete associated data points first
      await supabase.from('data_points').delete().eq('dataset_id', id);
      
      // Then delete the dataset
      const { error } = await supabase.from('datasets').delete().eq('id', id);
      if (error) throw error;
      
      await fetchDatasets(); // Refresh the list
    } catch (error) {
      console.error('Error deleting dataset:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-accent';
      case 'processing':
        return 'text-warning';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-accent" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4 text-warning animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  useEffect(() => {
    // Inline fetchDatasets to avoid extra dependency in the array
    const fetchDatasetsAsync = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('datasets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        setDatasets(
          (data || []).map((d: {
            id: string;
            name: string;
            file_name: string;
            file_size: number;
            status: string;
            created_at: string;
            metadata?: unknown;
            [key: string]: unknown;
          }) => ({
            ...d,
            metadata: typeof d.metadata === "string"
              ? (() => { try { return JSON.parse(d.metadata as string); } catch { return {}; } })()
              : (typeof d.metadata === "object" && d.metadata !== null ? d.metadata : {}),
          }))
        );
      } catch (error) {
        console.error('Error fetching datasets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatasetsAsync();
  }, [user]);

  return (
    <Card className="border-2 border-info/20 bg-gradient-to-br from-info/10 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-semibold">
          <Upload className="h-6 w-6 text-info" />
          Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragActive 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload Your Data Files</h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop your CSV, Excel, or JSON files here
          </p>
          <Button 
            className="bg-gradient-primary" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Choose Files'}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".csv,.xlsx,.xls"
            multiple
            className="hidden"
            aria-label="Upload data files"
          />
        </div>

        {/* Recent Files */}
        <div>
          <h4 className="font-semibold mb-3">Recent Uploads</h4>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-card/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No files uploaded yet</p>
              <p className="text-sm">Upload your first CSV or Excel file to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{dataset.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(dataset.file_size)} • {new Date(dataset.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(dataset.status)}
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      dataset.status === "completed" 
                        ? "bg-accent/10 text-accent" 
                        : dataset.status === "processing"
                        ? "bg-warning/10 text-warning"
                        : "bg-destructive/10 text-destructive"
                    )}>
                      {dataset.status}
                    </span>
                    {dataset.status === "completed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDataset(dataset.id)}
                        className="h-6 w-6 p-0 hover:bg-destructive/10"
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}