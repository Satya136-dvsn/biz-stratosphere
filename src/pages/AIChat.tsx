import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRAGChat } from '@/hooks/useRAGChat';
import { useEmbeddings } from '@/hooks/useEmbeddings';
import { ChatMessageComponent } from '@/components/ai/ChatMessage';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Send, Plus, Loader2, Sparkles, Database, Trash2, Zap } from 'lucide-react';
import { ConversationSettings } from '@/components/ai/ConversationSettings';
import { ExportConversation } from '@/components/ai/ExportConversation';

export function AIChat() {
    const { user } = useAuth();
    const [selectedConversationId, setSelectedConversationId] = useState<string>();
    const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
    const [similarityThreshold, setSimilarityThreshold] = useState(0.5);
    const [contextLimit, setContextLimit] = useState(5);
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
    const { data: datasets = [] } = useQuery({
        queryKey: ['datasets', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('datasets')
                .select('id, name, file_name')
                .eq('user_id', user.id);
            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });

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

    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
                        <p className="text-muted-foreground">Advanced RAG-powered chatbot with custom datasets</p>
                    </div>
                </div>
            </div>

            {/* Config Card */}
            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        RAG Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="text-sm font-medium mb-1.5 block">Active Dataset</label>
                            <Select
                                value={selectedDataset || 'none'}
                                onValueChange={(val) => setSelectedDataset(val === 'none' ? null : val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a dataset for context" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Context</SelectItem>
                                    {datasets.map((dataset) => (
                                        <SelectItem key={dataset.id} value={dataset.id}>
                                            {dataset.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => selectedDataset && generateDatasetEmbeddings({ datasetId: selectedDataset })}
                            disabled={!selectedDataset || isGenerating}
                            className="w-full md:w-auto"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Embedding...
                                </>
                            ) : (
                                <>
                                    <Zap className="h-4 w-4 mr-2" />
                                    Process Dataset
                                </>
                            )}
                        </Button>
                    </div>
                    {embeddingsCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                            {embeddingsCount} vectors available for similarity search
                        </p>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                {/* Conversations Sidebar */}
                <Card className="lg:col-span-1 flex flex-col min-h-0">
                    <CardHeader className="py-4 border-b">
                        <Button onClick={handleNewConversation} disabled={isCreating} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            New Chat
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="p-2 space-y-1">
                                {conversations.map((conv) => (
                                    <div
                                        key={conv.id}
                                        className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${selectedConversationId === conv.id
                                            ? 'bg-primary/10 text-primary'
                                            : 'hover:bg-muted'
                                            }`}
                                        onClick={() => setSelectedConversationId(conv.id)}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <MessageSquare className="h-4 w-4 flex-shrink-0" />
                                            <span className="text-sm truncate">{conv.title || 'Untitled Chat'}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteConversation(conv.id);
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                {conversations.length === 0 && (
                                    <p className="text-center text-xs text-muted-foreground py-8">No conversations</p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Chat Area */}
                <Card className="lg:col-span-3 flex flex-col min-h-0">
                    <CardHeader className="py-3 border-b flex flex-row items-center justify-between">
                        <CardTitle className="text-lg truncate">
                            {selectedConversationId
                                ? conversations.find((c) => c.id === selectedConversationId)?.title || 'Chat'
                                : 'Select or create a conversation'}
                        </CardTitle>
                        {selectedConversationId && (
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="hidden md:flex items-center gap-2 px-2 py-1 bg-muted rounded-md text-xs">
                                    <Database className="h-3 w-3" />
                                    Threshold:
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={similarityThreshold * 100}
                                        onChange={(e) => setSimilarityThreshold(Number(e.target.value) / 100)}
                                        className="w-16 h-1.5"
                                    />
                                    <span>{(similarityThreshold * 100).toFixed(0)}%</span>
                                </div>

                                <div className="hidden md:flex items-center gap-2 px-2 py-1 bg-muted rounded-md text-xs">
                                    <MessageSquare className="h-3 w-3" />
                                    Context:
                                    <select
                                        value={contextLimit}
                                        onChange={(e) => setContextLimit(Number(e.target.value))}
                                        className="bg-transparent border-none focus:ring-0 p-0 h-4 text-xs"
                                    >
                                        <option value={3}>3</option>
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                    </select>
                                </div>

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

                    <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4 pb-4">
                                {!selectedConversationId ? (
                                    <Alert>
                                        <Sparkles className="h-4 w-4" />
                                        <AlertDescription>
                                            Create a new conversation or select an existing one to start chatting with your data.
                                        </AlertDescription>
                                    </Alert>
                                ) : messages.length === 0 ? (
                                    <Alert>
                                        <MessageSquare className="h-4 w-4" />
                                        <AlertDescription>
                                            Ask me anything about your data! I'll search through your datasets and provide relevant answers.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    messages.map((message) => (
                                        <ChatMessageComponent key={message.id} message={message} />
                                    ))
                                )}
                                {isSending && (
                                    <div className="flex items-center gap-2 text-muted-foreground ml-4">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">Thinking...</span>
                                    </div>
                                )}
                                {isSearching && (
                                    <div className="flex items-center gap-2 text-muted-foreground ml-4">
                                        <Database className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">Searching knowledge base...</span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Input */}
                        <div className="p-4 border-t bg-background">
                            <div className="flex gap-2">
                                <Input
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder={selectedConversationId ? "Ask a question about your data..." : "Select a conversation to start"}
                                    disabled={!selectedConversationId || isSending}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!selectedConversationId || !inputMessage.trim() || isSending}
                                    size="icon"
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
