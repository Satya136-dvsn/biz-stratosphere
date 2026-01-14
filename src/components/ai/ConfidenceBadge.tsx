/**
 * AI Confidence Badge Component
 * 
 * Displays confidence level for AI responses with visual indicators
 * and warnings for low-confidence responses.
 */

import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ConfidenceScore } from '@/lib/ai/confidenceScoring';

interface ConfidenceBadgeProps {
    confidence: ConfidenceScore;
    showDetails?: boolean;
    sourceCount?: number;
    datasetName?: string;
    className?: string;
}

export function ConfidenceBadge({
    confidence,
    showDetails = false,
    sourceCount = 0,
    datasetName,
    className,
}: ConfidenceBadgeProps) {
    const [expanded, setExpanded] = useState(false);

    const getVariant = () => {
        switch (confidence.level) {
            case 'high':
                return 'success';
            case 'medium':
                return 'warning';
            case 'low':
                return 'destructive';
        }
    };

    const getIcon = () => {
        switch (confidence.level) {
            case 'high':
                return <CheckCircle className="h-3 w-3" />;
            case 'medium':
                return <AlertCircle className="h-3 w-3" />;
            case 'low':
                return <AlertTriangle className="h-3 w-3" />;
        }
    };

    const getLabel = () => {
        switch (confidence.level) {
            case 'high':
                return 'High Confidence';
            case 'medium':
                return 'Medium Confidence';
            case 'low':
                return 'Low Confidence';
        }
    };

    const getColor = () => {
        switch (confidence.level) {
            case 'high':
                return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 dark:text-green-400';
            case 'medium':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-400';
            case 'low':
                return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800 dark:text-red-400';
        }
    };

    return (
        <div className={cn('space-y-2', className)} data-testid="confidence-badge">
            {/* Main Badge */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className={cn(
                                'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-colors hover:opacity-80',
                                getColor()
                            )}
                            data-testid={`confidence-level-${confidence.level}`}
                        >
                            {getIcon()}
                            <span>{getLabel()}</span>
                            <span className="opacity-60">({Math.round(confidence.score * 100)}%)</span>
                            {showDetails && (
                                expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />
                            )}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">
                            {confidence.level === 'high' && 'This response is well-supported by your dataset.'}
                            {confidence.level === 'medium' && 'This response has partial support from your data.'}
                            {confidence.level === 'low' && 'This response may not be fully supported by your dataset.'}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Low Confidence Warning */}
            {confidence.level === 'low' && (
                <Alert variant="destructive" className="py-2" data-testid="low-confidence-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-xs font-medium">Low confidence response</AlertTitle>
                    <AlertDescription className="text-xs">
                        This answer may not be fully supported by your dataset. Verify with original data.
                    </AlertDescription>
                </Alert>
            )}

            {/* Expanded Details */}
            {showDetails && expanded && (
                <div className="p-3 bg-muted/50 rounded-md text-xs space-y-2 animate-in slide-in-from-top-2">
                    {/* Source Info */}
                    <div className="flex items-center gap-2">
                        <Info className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Sources: </span>
                        <span className="font-medium">{sourceCount}</span>
                        {datasetName && (
                            <>
                                <span className="text-muted-foreground mx-1">•</span>
                                <span className="text-muted-foreground">Dataset: </span>
                                <span className="font-medium truncate max-w-[150px]">{datasetName}</span>
                            </>
                        )}
                    </div>

                    {/* Reasons */}
                    {confidence.reasons.length > 0 && (
                        <div className="space-y-1">
                            <span className="text-muted-foreground">Analysis:</span>
                            <ul className="list-disc list-inside text-muted-foreground pl-1">
                                {confidence.reasons.map((reason, idx) => (
                                    <li key={idx}>{reason}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Inline confidence indicator (minimal version)
 */
interface InlineConfidenceProps {
    level: 'high' | 'medium' | 'low';
    score: number;
}

export function InlineConfidence({ level, score }: InlineConfidenceProps) {
    const colors = {
        high: 'bg-green-500',
        medium: 'bg-yellow-500',
        low: 'bg-red-500',
    };

    return (
        <div className="inline-flex items-center gap-1">
            <div className={cn('h-1.5 w-1.5 rounded-full', colors[level])} />
            <span className="text-[10px] text-muted-foreground capitalize">{level}</span>
        </div>
    );
}

/**
 * Source transparency component
 */
interface SourceTransparencyProps {
    sourceCount: number;
    datasetName?: string;
    columnsReferenced?: string[];
    isLimited?: boolean;
}

export function SourceTransparency({
    sourceCount,
    datasetName,
    columnsReferenced = [],
    isLimited = false,
}: SourceTransparencyProps) {
    if (isLimited || sourceCount === 0) {
        return (
            <div className="text-xs text-muted-foreground/80 italic flex items-center gap-1.5 mt-1" data-testid="source-transparency">
                <AlertCircle className="h-3 w-3" />
                Based on limited dataset evidence
            </div>
        );
    }

    return (
        <div className="text-xs text-muted-foreground mt-1 space-y-0.5" data-testid="source-transparency">
            <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>
                    Sourced from <strong>{sourceCount}</strong> data point{sourceCount !== 1 ? 's' : ''}
                    {datasetName && <> in <strong>{datasetName}</strong></>}
                </span>
            </div>
            {columnsReferenced.length > 0 && (
                <div className="pl-4 text-muted-foreground/70">
                    Columns: {columnsReferenced.join(', ')}
                </div>
            )}
        </div>
    );
}
