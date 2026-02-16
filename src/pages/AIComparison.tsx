// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { DualAIComparison } from '@/components/dashboard/DualAIComparison';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, Cloud, Server, DollarSign, Lock, Gauge } from 'lucide-react';

export function AIComparison() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Zap className="h-8 w-8 text-primary" />
                    Dual AI Comparison
                </h2>
                <p className="text-muted-foreground">
                    Compare Google Gemini (cloud) vs Ollama (local) side-by-side
                </p>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Cloud className="h-4 w-4 text-blue-500" />
                            Gemini (Cloud AI)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3 text-green-500" />
                            <span>Free tier: 1500 requests/day</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Gauge className="h-3 w-3 text-blue-500" />
                            <span>Fast cloud processing</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Cloud className="h-3 w-3 text-purple-500" />
                            <span>Always latest model</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Server className="h-4 w-4 text-green-500" />
                            Ollama (Local AI)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3 text-green-500" />
                            <span>Unlimited usage (free)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Lock className="h-3 w-3 text-green-500" />
                            <span>100% private & secure</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Server className="h-3 w-3 text-orange-500" />
                            <span>Runs on your hardware</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            Best Use Cases
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div>
                            <strong>Gemini:</strong> Quick queries, general knowledge
                        </div>
                        <div>
                            <strong>Ollama:</strong> Sensitive data, bulk processing
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Setup Alert */}
            <Alert>
                <Server className="h-4 w-4" />
                <AlertDescription>
                    <strong>Note:</strong> Ollama requires local installation. Download from{' '}
                    <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline">
                        ollama.ai
                    </a>{' '}
                    and run the ML service with Docker Compose.
                </AlertDescription>
            </Alert>

            {/* Comparison Component */}
            <DualAIComparison />

            {/* Comparison Guide */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">When to Use Which AI?</CardTitle>
                    <CardDescription>Guidelines for choosing between cloud and local AI</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h4 className="font-semibold flex items-center gap-2 text-blue-600">
                                <Cloud className="h-4 w-4" />
                                Choose Gemini When:
                            </h4>
                            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
                                <li>You need quick responses for general queries</li>
                                <li>Working with public data</li>
                                <li>Want access to latest AI capabilities</li>
                                <li>Don't have local compute resources</li>
                                <li>Need multi-language support</li>
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-semibold flex items-center gap-2 text-green-600">
                                <Server className="h-4 w-4" />
                                Choose Ollama When:
                            </h4>
                            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
                                <li>Processing sensitive or confidential data</li>
                                <li>Need unlimited batch processing</li>
                                <li>Want 100% data privacy</li>
                                <li>Have local GPU resources</li>
                                <li>Working offline or in secure networks</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
