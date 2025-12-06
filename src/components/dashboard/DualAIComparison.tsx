import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cloud, Server, Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { useAIConversation } from '@/hooks/useAIConversation';
import { useOllamaML } from '@/hooks/use OllamaML';
import ReactMarkdown from 'react-markdown';

export function DualAIComparison() {
    const [prompt, setPrompt] = useState('');
    const [geminiResponse, setGeminiResponse] = useState('');
    const [ollamaResponse, setOllamaResponse] = useState('');
    const [geminiTime, setGeminiTime] = useState(0);
    const [ollamaTime, setOllamaTime] = useState(0);

    const { sendMessage: sendGemini, isSending: geminiLoading } = useAIConversation();
    const { generatePrediction, isGenerating: ollamaLoading } = useOllamaML();

    const handleCompare = async () => {
        if (!prompt.trim()) return;

        setGeminiResponse('');
        setOllamaResponse('');

        // Test Gemini (cloud)
        const geminiStart = Date.now();
        sendGemini({ message: prompt, newConversation: true });
        // Note: We'd capture the response in the hook's onSuccess
        setGeminiTime(Date.now() - geminiStart);

        // Test Ollama (local)
        const ollamaStart = Date.now();
        generatePrediction(
            { prompt },
            {
                onSuccess: (data: any) => {
                    setOllamaResponse(data.response);
                    setOllamaTime(Date.now() - ollamaStart);
                },
            }
        );
    };

    return (
        <div className="space-y-4">
            {/* Input Section */}
            <Card>
                <CardHeader>
                    <CardTitle>🤖 Dual AI Comparison</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Compare Gemini (cloud) vs Ollama (local) responses
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Ask a question to compare both AIs..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCompare()}
                        />
                        <Button
                            onClick={handleCompare}
                            disabled={geminiLoading || ollamaLoading || !prompt.trim()}
                        >
                            {(geminiLoading || ollamaLoading) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Gemini Response */}
                <Card className="border-blue-500/20">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Cloud className="h-5 w-5 text-blue-500" />
                                <CardTitle className="text-lg">Gemini (Cloud)</CardTitle>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="gap-1">
                                    <span className="text-xs">FREE</span>
                                </Badge>
                                {geminiTime > 0 && (
                                    <Badge variant="secondary">
                                        {(geminiTime / 1000).toFixed(2)}s
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Google's cloud AI • 1M context
                        </p>
                    </CardHeader>
                    <CardContent>
                        {geminiLoading ? (
                            <div className="text-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Gemini thinking...
                                </p>
                            </div>
                        ) : geminiResponse ? (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown>{geminiResponse}</ReactMarkdown>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Cloud className="h-12 w-12 mx-auto text-blue-500/20 mb-2" />
                                <p className="text-sm">Waiting for query...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Ollama Response */}
                <Card className="border-green-500/20">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Server className="h-5 w-5 text-green-500" />
                                <CardTitle className="text-lg">Ollama (Local)</CardTitle>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="gap-1">
                                    <span className="text-xs">UNLIMITED</span>
                                </Badge>
                                {ollamaTime > 0 && (
                                    <Badge variant="secondary">
                                        {(ollamaTime / 1000).toFixed(2)}s
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Self-hosted • 100% private
                        </p>
                    </CardHeader>
                    <CardContent>
                        {ollamaLoading ? (
                            <div className="text-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-500" />
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Ollama processing...
                                </p>
                            </div>
                        ) : ollamaResponse ? (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown>{ollamaResponse}</ReactMarkdown>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Server className="h-12 w-12 mx-auto text-green-500/20 mb-2" />
                                <p className="text-sm">Waiting for query...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Comparison Stats */}
            {geminiTime > 0 && ollamaTime > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">⚡ Performance Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-blue-500">
                                    {(geminiTime / 1000).toFixed(2)}s
                                </div>
                                <div className="text-xs text-muted-foreground">Gemini</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-500">
                                    {(ollamaTime / 1000).toFixed(2)}s
                                </div>
                                <div className="text-xs text-muted-foreground">Ollama</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {geminiTime < ollamaTime ? '🏆 Gemini' : '🏆 Ollama'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {Math.abs((geminiTime - ollamaTime) / 1000).toFixed(2)}s faster
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
