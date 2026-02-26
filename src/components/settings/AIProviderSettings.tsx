// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Wifi, WifiOff } from "lucide-react";

interface OllamaModel {
    name: string;
    size: number;
    modified_at: string;
}

export function AIProviderSettings() {
    const { toast } = useToast();
    const envProvider = import.meta.env.VITE_AI_PROVIDER || 'local';
    const envOllamaUrl = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';

    const [provider, setProvider] = useState<string>(() => {
        return localStorage.getItem('biz_ai_provider') || envProvider;
    });
    const [ollamaUrl, setOllamaUrl] = useState<string>(() => {
        return localStorage.getItem('biz_ollama_url') || envOllamaUrl;
    });
    const [chatModel, setChatModel] = useState<string>(() => {
        return localStorage.getItem('biz_ollama_chat_model') || import.meta.env.VITE_OLLAMA_CHAT_MODEL || 'llama3.2';
    });
    const [embedModel, setEmbedModel] = useState<string>(() => {
        return localStorage.getItem('biz_ollama_embed_model') || import.meta.env.VITE_OLLAMA_EMBED_MODEL || 'nomic-embed-text';
    });

    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
    const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Test Ollama connection
    const testConnection = async () => {
        setIsTestingConnection(true);
        setConnectionStatus('unknown');
        try {
            const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setAvailableModels(data.models || []);
            setConnectionStatus('connected');
            toast({
                title: 'Connected!',
                description: `Ollama is running with ${data.models?.length || 0} model(s) available.`,
            });
        } catch (err: any) {
            setConnectionStatus('error');
            setAvailableModels([]);
            toast({
                title: 'Connection Failed',
                description: `Could not reach Ollama at ${ollamaUrl}. Is it running?`,
                variant: 'destructive',
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    // Auto-test on mount
    useEffect(() => {
        if (provider === 'local') {
            testConnection();
        }
    }, []);

    // Save settings
    const handleSave = () => {
        setIsSaving(true);
        localStorage.setItem('biz_ai_provider', provider);
        localStorage.setItem('biz_ollama_url', ollamaUrl);
        localStorage.setItem('biz_ollama_chat_model', chatModel);
        localStorage.setItem('biz_ollama_embed_model', embedModel);

        setTimeout(() => {
            setIsSaving(false);
            toast({
                title: 'Settings Saved',
                description: 'AI provider settings saved. Reload the page for changes to take full effect.',
            });
        }, 300);
    };

    // Reset to env defaults
    const handleReset = () => {
        localStorage.removeItem('biz_ai_provider');
        localStorage.removeItem('biz_ollama_url');
        localStorage.removeItem('biz_ollama_chat_model');
        localStorage.removeItem('biz_ollama_embed_model');
        setProvider(envProvider);
        setOllamaUrl(envOllamaUrl);
        setChatModel(import.meta.env.VITE_OLLAMA_CHAT_MODEL || 'llama3.2');
        setEmbedModel(import.meta.env.VITE_OLLAMA_EMBED_MODEL || 'nomic-embed-text');
        toast({ title: 'Reset', description: 'Settings reset to environment defaults.' });
    };

    const formatSize = (bytes: number) => {
        const gb = bytes / (1024 * 1024 * 1024);
        return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Provider</CardTitle>
                <CardDescription>
                    Configure which AI model powers your chat and embeddings
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Provider Selection */}
                <div className="space-y-2">
                    <Label>Active Provider</Label>
                    <Select value={provider} onValueChange={setProvider}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="local">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Local (Ollama) — Free, Private
                                </div>
                            </SelectItem>
                            <SelectItem value="gemini">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    Google Gemini — Cloud API
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {provider === 'local'
                            ? 'Uses Ollama running on your machine. No data leaves your device.'
                            : 'Uses Google Gemini API. Requires VITE_GEMINI_API_KEY in .env.'}
                    </p>
                </div>

                {/* Ollama Configuration (only when local) */}
                {provider === 'local' && (
                    <>
                        <Separator />
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm">Ollama Configuration</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={testConnection}
                                    disabled={isTestingConnection}
                                    className="gap-2"
                                >
                                    {isTestingConnection ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : connectionStatus === 'connected' ? (
                                        <Wifi className="h-3 w-3 text-emerald-500" />
                                    ) : connectionStatus === 'error' ? (
                                        <WifiOff className="h-3 w-3 text-destructive" />
                                    ) : (
                                        <Wifi className="h-3 w-3" />
                                    )}
                                    {isTestingConnection ? 'Testing...' : 'Test Connection'}
                                </Button>
                            </div>

                            {/* Connection Status */}
                            {connectionStatus === 'connected' && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                    <span className="text-emerald-700 dark:text-emerald-400">
                                        Connected — {availableModels.length} model(s) available
                                    </span>
                                </div>
                            )}
                            {connectionStatus === 'error' && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                                    <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                                    <span className="text-destructive">
                                        Cannot reach Ollama. Make sure it's installed and running.
                                    </span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="ollama-url">Ollama URL</Label>
                                <Input
                                    id="ollama-url"
                                    value={ollamaUrl}
                                    onChange={(e) => setOllamaUrl(e.target.value)}
                                    placeholder="http://localhost:11434"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="chat-model">Chat Model</Label>
                                    <Input
                                        id="chat-model"
                                        value={chatModel}
                                        onChange={(e) => setChatModel(e.target.value)}
                                        placeholder="llama3.2"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="embed-model">Embedding Model</Label>
                                    <Input
                                        id="embed-model"
                                        value={embedModel}
                                        onChange={(e) => setEmbedModel(e.target.value)}
                                        placeholder="nomic-embed-text"
                                    />
                                </div>
                            </div>

                            {/* Available Models List */}
                            {availableModels.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Installed Models</Label>
                                    <div className="grid gap-1.5">
                                        {availableModels.map((m) => (
                                            <div
                                                key={m.name}
                                                className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
                                            >
                                                <span className="font-mono text-xs">{m.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatSize(m.size)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Save Settings
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                        Reset to Defaults
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
