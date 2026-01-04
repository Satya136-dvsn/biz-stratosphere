import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    useUserUploads,
    getSourceDisplayName,
    getSourceIcon,
    type UploadFilters,
} from '@/hooks/useUserUploads';
import {
    FolderOpen,
    Search,
    Download,
    Trash2,
    Eye,
    Info,
    Upload,
    HardDrive,
    Calendar,
    FileText,
    Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

export function UploadHistory() {
    const [filters, setFilters] = useState<UploadFilters>({});
    const [searchTerm, setSearchTerm] = useState('');

    const {
        uploads,
        uploadsBySource,
        storageUsage,
        isLoading,
        error,
        deleteUpload,
        formatFileSize,
    } = useUserUploads(filters);

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setFilters((prev) => ({ ...prev, searchTerm: value }));
    };

    const handleSourceFilter = (value: string) => {
        setFilters((prev) => ({
            ...prev,
            source: value === 'all' ? undefined : value,
        }));
    };

    const handleStatusFilter = (value: string) => {
        setFilters((prev) => ({
            ...prev,
            status: value === 'all' ? undefined : value,
        }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading upload history...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    Failed to load upload history: {(error as Error).message}
                </AlertDescription>
            </Alert>
        );
    }

    const storagePercent = storageUsage
        ? (storageUsage.total_size_bytes / (1024 * 1024 * 1024)) * 100 // Assuming 1GB limit
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <FolderOpen className="h-8 w-8 text-primary" />
                        Upload History
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage all your uploaded files across the application
                    </p>
                </div>
                <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New File
                </Button>
            </div>

            {/* Storage Usage Card */}
            {storageUsage && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5" />
                            Storage Usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    {storageUsage.total_files} files
                                </span>
                                <span className="font-medium">
                                    {formatFileSize(storageUsage.total_size_bytes)} / 1 GB
                                </span>
                            </div>
                            <Progress value={storagePercent} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                                {(100 - storagePercent).toFixed(1)}% available
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search files..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Source Filter */}
                        <Select onValueChange={handleSourceFilter} defaultValue="all">
                            <SelectTrigger>
                                <SelectValue placeholder="All Sources" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                <SelectItem value="ai_chat">AI Chat</SelectItem>
                                <SelectItem value="ml_predictions">ML Predictions</SelectItem>
                                <SelectItem value="dashboard">Dashboard</SelectItem>
                                <SelectItem value="advanced_charts">Advanced Charts</SelectItem>
                                <SelectItem value="profile">Profile</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select onValueChange={handleStatusFilter} defaultValue="all">
                            <SelectTrigger>
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* File Groups */}
            <div className="space-y-6">
                {uploads.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No files found</h3>
                            <p className="text-muted-foreground text-center max-w-sm">
                                {searchTerm || filters.source || filters.status
                                    ? 'Try adjusting your filters or search term'
                                    : 'Upload your first file to get started'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    Object.entries(uploadsBySource).map(([source, sourceUploads]) => (
                        <div key={source} className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{getSourceIcon(source)}</span>
                                <h2 className="text-xl font-semibold">
                                    {getSourceDisplayName(source)}
                                </h2>
                                <Badge variant="secondary">{sourceUploads.length} files</Badge>
                            </div>

                            <div className="grid gap-4">
                                {sourceUploads.map((upload) => (
                                    <Card key={upload.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                {/* File Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                        <h3 className="font-medium truncate">
                                                            {upload.original_filename}
                                                        </h3>
                                                        <Badge variant="outline">{upload.file_type}</Badge>
                                                        {upload.status === 'processing' && (
                                                            <Badge variant="secondary">
                                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                                Processing
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(upload.created_at), 'MMM d, yyyy h:mm a')}
                                                        </span>
                                                        <span>💾 {formatFileSize(upload.file_size_bytes)}</span>
                                                        {upload.row_count && (
                                                            <span>📊 {upload.row_count.toLocaleString()} rows</span>
                                                        )}
                                                        {upload.access_count > 0 && (
                                                            <span>👁️ {upload.access_count} views</span>
                                                        )}
                                                    </div>

                                                    {upload.upload_context && Object.keys(upload.upload_context).length > 0 && (
                                                        <div className="mt-2">
                                                            <Badge variant="outline" className="text-xs">
                                                                Used in: {getSourceDisplayName(upload.upload_source)}
                                                                {upload.upload_context.feature && ` → ${upload.upload_context.feature}`}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <Button variant="ghost" size="sm" title="View Details">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" title="Download">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title="Delete"
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this file?')) {
                                                                deleteUpload(upload.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
