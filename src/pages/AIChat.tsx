import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRAGChat } from '@/hooks/useRAGChat';
import { use Embeddings } from '@/hooks/useEmbeddings';
import { ChatMessageComponent } from '@/components/ai/ChatMessage';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Send, Plus, Loader2, Sparkles, Database, Trash2 } from 'lucide-react';

export function AIChat() {
    const { user } = useAuth();
    const [selectedConversationId, setSelectedConversationId] = useState<string>();
    const [selectedDatasetId, setSelectedDatasetId] = useState<string>();
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        conversations,
        messages,
        createConversation,
        deleteConversation,
        sendMessage,
        isSending,
        isCreating,
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
        createConversation(title, {
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
            datasetId: selectedDatasetId,
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Sparkles className="h-8 w-8 text-primary" />
                    AI Assistant
                </h2>
                <p className="text-muted-foreground">
                    Ask questions about your data using AI-powered search
                </p>
            </div>

            {/* Settings Bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Dataset (Optional)</label>
                            <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All datasets" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All datasets</SelectItem>
                                    {datasets.map((dataset) => (
                                        <SelectItem key={dataset.id} value={dataset.id}>
                                            {dataset.name || dataset.file_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => selectedDatasetId && generateDatasetEmbeddings({ datasetId: selectedDatasetId })}
                                disabled={!selectedDatasetId || isGenerating}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Database className="h-4 w-4 mr-2" />
                                        Generate Embeddings
                                    </>
                                )}
                            </Button>
                            <div className="text-sm text-muted-foreground">
                                {embeddingsCount} embeddings
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Chat Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Conversations Sidebar */}
                <div className="lg:col-span-1">
                    <Card className="h-[600px] flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Conversations</CardTitle>
                                <Button onClick={handleNewConversation} size="sm" disabled={isCreating}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0">
                            <ScrollArea className="h-full">
                                <div className="space-y-2 p-4">
                                    {conversations.length === 0 ? (
                                        <div className="text-center text-sm text-muted-foreground py-8">
                                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No conversations yet</p>
                                            <p className="text-xs mt-1">Click + to start</p>
                                        </div>
                                    ) : (
                                        conversations.map((conv) => (
                                            <div
                                                key={conv.id}
                                                className={`p-3 rounded-lg cursor-pointer transition-colors group ${selectedConversationId === conv.id
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'hover:bg-muted'
                                                    }`}
                                                onClick={() => setSelectedConversationId(conv.id)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{conv.title}</p>
                                                        <p className="text-xs opacity-70 mt-1">
                                                            {new Date(conv.updated_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteConversation(conv.id);
                                                            if (selectedConversationId === conv.id) {
                                                                setSelectedConversationId(undefined);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-3">
                    <Card className="h-[600px] flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {selectedConversationId
                                    ? conversations.find(c => c.id === selectedConversationId)?.title || 'Chat'
                                    : 'Select or create a conversation'}
                            </CardTitle>
                        </CardHeader>
                        <Separator />
                        <CardContent className="flex-1 flex flex-col p-0">
                            {/* Messages */}
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
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
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm">Thinking...</span>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>

                            {/* Input */}
                            <div className="p-4 border-t">
                                <div className="flex gap-2">
                                    <Input
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        placeholder="Ask a question about your data..."
                                        disabled={!selectedConversationId || isSending}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!selectedConversationId || !inputMessage.trim() || isSending}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
