// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useRAGChat } from '@/hooks/useRAGChat';
import { useEmbeddings } from '@/hooks/useEmbeddings';
import { ChatMessageComponent } from '@/components/ai/ChatMessage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Send, Plus, Loader2, Sparkles, Database, Trash2, Zap, ChevronDown, ChevronUp, Settings2, Sliders, RefreshCw } from 'lucide-react';
import { ConversationSettings } from '@/components/ai/ConversationSettings';
import { ExportConversation } from '@/components/ai/ExportConversation';

export function AIChat() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedConversationId, setSelectedConversationId] = useState<string>();
    // Initialize from localStorage if available
    const [selectedDataset, setSelectedDataset] = useState<string | null>(() => {
        return localStorage.getItem('lastSelectedDataset') || null;
    });
    const [similarityThreshold, setSimilarityThreshold] = useState(0.5);
    const [contextLimit, setContextLimit] = useState(5);
    const [chunkSize, setChunkSize] = useState(1);
    const [chunkOverlap, setChunkOverlap] = useState(0);
    const [inputMessage, setInputMessage] = useState('');
    const [isRecovering, setIsRecovering] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Persist selection changes
    useEffect(() => {
        if (selectedDataset) {
            localStorage.setItem('lastSelectedDataset', selectedDataset);
        } else {
            localStorage.removeItem('lastSelectedDataset');
        }
    }, [selectedDataset]);

    const {
        conversations,
        messages,
        createConversation,
        deleteConversation,
        sendMessage,
        isSending,
        isSearching,
        isCreating,
        refreshConversations
    } = useRAGChat(selectedConversationId);

    const { generateDatasetEmbeddings, isGenerating, embeddingsCount } = useEmbeddings();

    // Fetch datasets
    const { data: datasets = [], error: datasetsError, isLoading: datasetsLoading } = useQuery({
        queryKey: ['datasets', user?.id],
        queryFn: async () => {
            if (!user) return [];
            console.log('[AIChat] Fetching datasets for user:', user.id);
            const { data, error } = await supabase
                .from('datasets')
                .select('id, file_name')
                .eq('user_id', user.id);

            if (error) {
                console.error('[AIChat] Error fetching datasets:', error);
                toast({
                    title: "Error loading datasets",
                    description: error.message,
                    variant: "destructive"
                });
                throw error;
            }
            console.log('[AIChat] Fetched datasets:', data);
            console.log('[AIChat] Number of datasets:', data?.length || 0);
            return data || [];
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
        refetchOnWindowFocus: false, // Prevent disappearing on tab switch
    });

    // Log datasets state changes
    useEffect(() => {
        console.log('[AIChat] Datasets state updated:', {
            count: datasets?.length || 0,
            datasets,
            error: datasetsError,
            loading: datasetsLoading
        });

        // Log each dataset individually to see the file_name field
        if (datasets && datasets.length > 0) {
            console.log('[AIChat] Individual datasets:');
            datasets.forEach((ds, idx) => {
                console.log(`  Dataset ${idx}:`, {
                    id: ds.id,
                    file_name: ds.file_name,
                    nameType: typeof ds.file_name,
                    nameLength: ds.file_name?.length,
                    fullObject: ds
                });
            });
        }
    }, [datasets, datasetsError, datasetsLoading]);

    // Recover orphaned datasets (Fix for visibility issues)
    const recoverOrphanedDatasets = async () => {
        if (!user || isRecovering) return;
        setIsRecovering(true);
        try {
            console.log('[Recovery] Scanning embeddings for orphaned datasets...');
            // Fetch sample embeddings metadata
            const { data: embeddings, error: embError } = await supabase
                .from('embeddings')
                .select('metadata')
                .eq('user_id', user.id)
                .limit(1000);

            if (embError) throw embError;

            // Collect dataset IDs and names from metadata
            const datasetInfo = new Map<string, string>();
            embeddings?.forEach(e => {
                const meta = e.metadata as any;
                if (meta?.dataset_id) {
                    // Try to extract filename from metadata
                    const filename = meta?.filename || meta?.source || meta?.name;
                    if (!datasetInfo.has(meta.dataset_id) && filename) {
                        datasetInfo.set(meta.dataset_id, filename);
                    } else if (!datasetInfo.has(meta.dataset_id)) {
                        datasetInfo.set(meta.dataset_id, `Dataset ${meta.dataset_id.substring(0, 8)}`);
                    }
                }
            });

            console.log('[Recovery] Found distinct IDs:', Array.from(datasetInfo.keys()));
            console.log('[Recovery] Dataset names from metadata:', Object.fromEntries(datasetInfo));

            if (datasetInfo.size === 0) {
                toast({ title: 'No Data Found', description: 'No embeddings found to recover.' });
                return;
            }

            // Check which datasets need to be created or updated
            const existingDatasets = new Map(datasets.map(d => [d.id, d.file_name]));
            const toUpsert: any[] = [];

            datasetInfo.forEach((fileName, id) => {
                const existingFileName = existingDatasets.get(id);
                // Add if missing OR if file_name is null/empty
                if (!existingDatasets.has(id) || !existingFileName || existingFileName.trim() === '') {
                    toUpsert.push({
                        id,
                        user_id: user.id,
                        file_name: fileName,
                        created_at: new Date().toISOString()
                    });
                }
            });

            if (toUpsert.length === 0) {
                toast({ title: 'All Good', description: 'All datasets have valid names.' });
                return;
            }

            console.log('[Recovery] Upserting datasets:', toUpsert);

            // Restore/Update them
            const { error: insertError } = await supabase
                .from('datasets')
                .upsert(toUpsert);

            if (insertError) throw insertError;

            await queryClient.invalidateQueries({ queryKey: ['datasets'] });

            toast({
                title: 'Recovery Successful',
                description: `Fixed ${toUpsert.length} dataset(s) with proper names from metadata.`
            });

        } catch (error: any) {
            console.error('[Recovery] Failed:', error);
            toast({
                title: 'Recovery Failed',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setIsRecovering(false);
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle new conversation
    const handleNewConversation = () => {
        const title = `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
        createConversation({ title }, {
            onSuccess: (data) => {
                setSelectedConversationId(data.id);
            },
        });
    };

    // Handle send message
    const handleSendMessage = () => {
        if (!inputMessage.trim() || !selectedConversationId || isSending) return;

        sendMessage({
            convId: selectedConversationId,
            message: inputMessage,
            datasetId: selectedDataset,
            similarityThreshold,
            contextLimit,
        });

        setInputMessage('');
    };

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const currentConversation = conversations.find(c => c.id === selectedConversationId);
    const activeDatasetName = datasets.find(d => d.id === selectedDataset)?.name;

    return (
        <div className="space-y-4 flex flex-col h-[calc(100vh-120px)]">
            {/* Header */}
            <div className="flex items-center justify-between flex-none px-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Knowledge Base:</span>
                            {activeDatasetName ? (
                                <span className="flex items-center gap-1 font-medium text-primary">
                                    <Database className="h-3 w-3" />
                                    {activeDatasetName}
                                </span>
                            ) : (
                                <span className="text-muted-foreground/70 italic">No dataset selected</span>
                            )}
                        </div>
                    </div>
                </div>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Settings2 className="h-4 w-4" />
                            <span className="hidden sm:inline">RAG Configuration</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>RAG Configuration</SheetTitle>
                            <SheetDescription>
                                Configure the retrieval strategy and manage your knowledge base context.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="py-6 space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium flex items-center gap-2 text-primary">
                                    <Database className="h-4 w-4" />
                                    Active Context
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-medium text-muted-foreground">Selected Dataset</label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary"
                                            onClick={recoverOrphanedDatasets}
                                            disabled={isRecovering}
                                        >
                                            {isRecovering ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                                            {isRecovering ? 'Restoring...' : 'Find Missing Data'}
                                        </Button>
                                    </div>
                                    {datasetsError && (
                                        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                                            Error: {datasetsError.message}
                                        </div>
                                    )}
                                    {datasetsLoading ? (
                                        <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Loading datasets...
                                        </div>
                                    ) : (
                                        <Select
                                            value={selectedDataset || 'none'}
                                            onValueChange={(val) => setSelectedDataset(val === 'none' ? null : val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a dataset..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Context (General Chat)</SelectItem>
                                                {datasets.map((dataset) => (
                                                    <SelectItem key={dataset.id} value={dataset.id}>
                                                        {dataset.file_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {!datasetsLoading && !datasetsError && datasets.length === 0 && (
                                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                            No datasets found. Click "Find Missing Data" to scan for orphaned datasets.
                                        </div>
                                    )}
                                </div>
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    onClick={() => selectedDataset && generateDatasetEmbeddings({
                                        datasetId: selectedDataset,
                                        chunkSize,
                                        chunkOverlap
                                    })}
                                    disabled={!selectedDataset || isGenerating}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Processing Embeddings...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="h-4 w-4 mr-2" />
                                            Process & Refresh Embeddings
                                        </>
                                    )}
                                </Button>
                                {embeddingsCount > 0 && (
                                    <div className="p-2 bg-muted rounded text-xs text-center text-muted-foreground">
                                        ✓ {embeddingsCount} vectors indexed and ready
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium flex items-center gap-2 text-primary">
                                    <Sliders className="h-4 w-4" />
                                    Retrieval Parameters
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-medium">Similarity Threshold</label>
                                            <span className="text-xs text-muted-foreground">{similarityThreshold}</span>
                                        </div>
                                        <Input
                                            type="number"
                                            min={0.1}
                                            max={0.9}
                                            step={0.1}
                                            value={similarityThreshold}
                                            onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                                        />
                                        <p className="text-[10px] text-muted-foreground">Minimum similarity score (0-1) for a chunk to be included.</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-medium">Context Limit</label>
                                            <span className="text-xs text-muted-foreground">{contextLimit} chunks</span>
                                        </div>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={20}
                                            step={1}
                                            value={contextLimit}
                                            onChange={(e) => setContextLimit(parseInt(e.target.value))}
                                        />
                                        <p className="text-[10px] text-muted-foreground">Number of relevant chunks to retrieve.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium">Chunk Size</label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={100}
                                                value={chunkSize}
                                                onChange={(e) => setChunkSize(parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium">Chunk Overlap</label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={50}
                                                value={chunkOverlap}
                                                onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                            <h4 className="text-sm font-medium">Debug Retrieval</h4>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Test query (e.g. revenue)"
                                    id="debug-query"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        const q = (document.getElementById('debug-query') as HTMLInputElement).value;
                                        if (!q) return;

                                        // Quick hack to access search function
                                        // In real code we should expose this via hook better, but for debug:
                                        console.log('Testing retrieval for:', q);
                                        // We need to trigger a search. We can't easily access hook function here explicitly without refactoring.
                                        // Instead, let's just use console log instructions for the user.
                                        alert("Please check the Browser Console (F12) for retrieval logs when you send a message.");
                                    }}
                                >
                                    Log to Console
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Open Browser Console (F12) to see raw vector matches.
                            </p>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                {/* Conversations Sidebar */}
                <Card className="lg:col-span-1 flex flex-col min-h-0 h-full border-muted/60 shadow-sm">
                    <CardHeader className="py-4 border-b flex-none">
                        <Button onClick={handleNewConversation} disabled={isCreating} className="w-full shadow-sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Chat
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden bg-muted/5">
                        <ScrollArea className="h-full">
                            <div className="p-2 space-y-1.5">
                                {conversations.map((conv) => (
                                    <div
                                        key={conv.id}
                                        className={`group relative flex flex-col gap-1.5 p-2.5 rounded-lg border cursor-pointer transition-all duration-200 ${selectedConversationId === conv.id
                                            ? 'bg-primary/5 border-primary/30 shadow-sm'
                                            : 'bg-card hover:bg-muted/50 hover:border-border hover:shadow-sm'
                                            }`}
                                        onClick={() => setSelectedConversationId(conv.id)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                                <div className={`p-1 rounded-md flex-shrink-0 ${selectedConversationId === conv.id ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium truncate text-foreground">
                                                        {conv.title || 'Untitled Chat'}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                        {new Date(conv.created_at || Date.now()).toLocaleDateString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteConversation(conv.id);
                                                }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {conversations.length === 0 && (
                                    <div className="text-center py-10 px-4">
                                        <div className="bg-muted/30 p-3 rounded-full w-fit mx-auto mb-3">
                                            <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">No conversations yet</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Chat Area */}
                <Card className="lg:col-span-3 flex flex-col min-h-0 h-full bg-background/50 backdrop-blur-sm border-border/60 shadow-md">
                    <CardHeader className="py-3 border-b bg-muted/5 flex flex-row items-center justify-between flex-none h-14">
                        <CardTitle className="text-base font-medium truncate flex items-center gap-2">
                            {selectedConversationId ? (
                                <>
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    {conversations.find((c) => c.id === selectedConversationId)?.title || 'Chat'}
                                </>
                            ) : (
                                <span className="text-muted-foreground font-normal">Select a conversation</span>
                            )}
                        </CardTitle>
                        {selectedConversationId && (
                            <div className="flex flex-wrap items-center gap-2">
                                <ConversationSettings
                                    conversation={currentConversation || null}
                                    onUpdate={refreshConversations}
                                />
                                <ExportConversation
                                    conversation={currentConversation!}
                                    messages={messages}
                                />
                            </div>
                        )}
                    </CardHeader>

                    <CardContent className="flex-1 overflow-hidden p-0 flex flex-col relative h-full">
                        <ScrollArea className="flex-1 p-6 h-full">
                            <div className="min-h-full flex flex-col justify-end pb-4 max-w-4xl mx-auto">
                                {!selectedConversationId ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-500 py-12 px-4">
                                        <div className="relative group">
                                            <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-primary/20 to-purple-500/20 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                            <div className="relative p-8 bg-background rounded-3xl border shadow-lg">
                                                <Sparkles className="h-16 w-16 text-primary" />
                                            </div>
                                        </div>
                                        <div className="space-y-4 max-w-lg">
                                            <h2 className="text-2xl font-bold tracking-tight">AI Knowledge Assistant</h2>
                                            <p className="text-muted-foreground text-md">
                                                Unlock insights from your data. Connect a dataset in <span className="font-semibold text-primary">RAG Configuration</span> and start chatting.
                                            </p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Button size="lg" onClick={handleNewConversation} className="shadow-lg hover:shadow-primary/20 transition-all gap-2">
                                                <Plus className="h-5 w-5" />
                                                Start New Chat
                                            </Button>
                                        </div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-80">
                                        <div className="p-4 bg-primary/5 rounded-full ring-1 ring-primary/10">
                                            <MessageSquare className="h-8 w-8 text-primary/60" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-lg">Empty Conversation</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Ask questions about "{datasets.find(d => d.id === selectedDataset)?.name || 'your data'}"
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {messages.map((message) => (
                                            <ChatMessageComponent key={message.id} message={message} />
                                        ))}
                                    </div>
                                )}
                                {isSending && (
                                    <div className="flex items-center gap-2 text-muted-foreground ml-4 my-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">Thinking...</span>
                                    </div>
                                )}
                                {isSearching && (
                                    <div className="flex items-center gap-2 text-muted-foreground ml-4 my-2">
                                        <Database className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">Searching knowledge base...</span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-4 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <div className="flex gap-2 max-w-4xl mx-auto w-full">
                                <Input
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder={selectedConversationId ? "Ask a question about your data..." : "Select a conversation to start"}
                                    disabled={!selectedConversationId || isSending}
                                    className="flex-1 shadow-sm focus-visible:ring-primary/20"
                                    data-testid="ai-chat-input"
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!selectedConversationId || !inputMessage.trim() || isSending}
                                    size="icon"
                                    className="shadow-sm"
                                    data-testid="ai-chat-send-button"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
