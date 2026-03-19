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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
import { aiOrchestrator } from '@/lib/ai/orchestrator';

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
    <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-700">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-1">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-purple-500 rounded-xl blur opacity-25 animate-pulse" />
            <div className="relative h-12 w-12 bg-[hsl(220_18%_7%)] border border-[hsl(220_16%_14%)] rounded-xl flex items-center justify-center text-primary shadow-xl">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex flex-wrap items-center gap-2">
              Neural Assistant
              <Badge variant="outline" className="border-primary/20 text-[9px] sm:text-[10px] text-primary bg-primary/5 uppercase tracking-widest px-2 py-0 font-bold whitespace-nowrap"> v2.4.0-STABLE </Badge>
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1">
               <div className="flex items-center gap-1.5">
                  <div className={cn("h-1.5 w-1.5 rounded-full", aiOrchestrator.getProvider() === 'local' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]")} />
                  <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                    {aiOrchestrator.getProvider() === 'local' ? 'Edge' : 'Cloud'} : {aiOrchestrator.getChatModelName()}
                  </span>
               </div>
               <span className="hidden sm:block text-muted-foreground/20 text-xs text-bold">|</span>
               <div className="flex items-center gap-1.5">
                  <Database className="h-3 w-3 text-muted-foreground/60" />
                  <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground/60">
                    <span className="hidden xs:inline">Context: </span><span className="text-foreground/80 truncate max-w-[120px] inline-block align-bottom">{activeDatasetName || 'Generalized Knowledge'}</span>
                  </span>
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 border-[hsl(220_16%_14%)] bg-[hsl(220_16%_9%)] hover:bg-white/5 font-bold text-xs gap-2">
                <Settings2 className="h-4 w-4 opacity-60" />
                RAG PARAMETERS
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-[hsl(220_18%_7%)] border-l-[hsl(220_16%_14%)] text-foreground sm:max-w-md custom-scrollbar">
              <SheetHeader className="space-y-1 mb-8">
                <div className="h-1 w-20 bg-primary mb-4 rounded-full" />
                <SheetTitle className="text-xl font-bold">Neural Configuration</SheetTitle>
                <SheetDescription className="text-muted-foreground/60">
                  Tune retrieval heuristics and knowledge base parameters for the current session.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-10">
                {/* Context Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Context Source</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors"
                      onClick={recoverOrphanedDatasets}
                      disabled={isRecovering}
                    >
                      {isRecovering ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
                      Sync Library
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <Select
                      value={selectedDataset || 'none'}
                      onValueChange={(val) => setSelectedDataset(val === 'none' ? null : val)}
                    >
                      <SelectTrigger className="bg-[hsl(220_16%_9%)] border-[hsl(220_16%_14%)] h-11">
                        <SelectValue placeholder="Select analytical context..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[hsl(220_18%_7%)] border-[hsl(220_16%_14%)] text-foreground">
                        <SelectItem value="none" className="focus:bg-primary/10 transition-colors">None (General Reasoning)</SelectItem>
                        {datasets.map((dataset) => (
                          <SelectItem key={dataset.id} value={dataset.id} className="focus:bg-primary/10 transition-colors">
                            {dataset.file_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold text-xs tracking-widest shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
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
                          INDEXING VECTORS...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2 fill-current" />
                          RE-INDEX DATASET
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Hyperparameters */}
                <div className="space-y-6">
                   <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Heuristics</h3>
                   
                   <div className="space-y-5">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-muted-foreground/80">SIMILARITY THRESHOLD</label>
                          <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{similarityThreshold}</span>
                        </div>
                        <Input
                          type="range"
                          min={0.1}
                          max={0.9}
                          step={0.1}
                          value={similarityThreshold}
                          onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                          className="accent-primary"
                        />
                        <p className="text-[10px] text-muted-foreground/40 leading-relaxed italic">Minimum cosine similarity required for vector retrieval.</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-muted-foreground/80">CONTEXT DEPTH</label>
                          <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{contextLimit} CHUNKS</span>
                        </div>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          value={contextLimit}
                          onChange={(e) => setContextLimit(parseInt(e.target.value))}
                          className="bg-[hsl(220_16%_9%)] border-[hsl(220_16%_14%)]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">Chunk Size</label>
                          <Input
                            type="number"
                            value={chunkSize}
                            onChange={(e) => setChunkSize(parseInt(e.target.value))}
                            className="bg-[hsl(220_16%_9%)] border-[hsl(220_16%_14%)] h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">Chunk Overlap</label>
                          <Input
                            type="number"
                            value={chunkOverlap}
                            onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                            className="bg-[hsl(220_16%_9%)] border-[hsl(220_16%_14%)] h-9 text-xs"
                          />
                        </div>
                      </div>
                   </div>
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <h4 className="text-[11px] font-bold text-foreground mb-1">Diagnostic Mode</h4>
                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                    Extended retrieval logs are outputted to the developer console during message processing for deep vector tracing.
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <Button 
            onClick={handleNewConversation} 
            disabled={isCreating}
            className="h-10 bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-lg shadow-primary/20 gap-2"
          >
            <Plus className="h-4 w-4" />
            NEW SESSION
          </Button>
        </div>
      </div>

      {/* Main Grid Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Sidebar: Message Threads */}
        <div className="lg:col-span-3 flex flex-col min-h-0 border border-[hsl(220_16%_14%)] bg-[hsl(220_18%_7%)] rounded-3xl overflow-hidden shadow-2xl">
           <div className="p-4 border-b border-[hsl(220_16%_14%)] bg-[hsl(220_16%_9%)] flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Session History</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                 <span className="h-1 w-1 rounded-full bg-primary" />
                 <span className="text-[9px] font-bold text-primary">{conversations.length}</span>
              </div>
           </div>
           
           <ScrollArea className="flex-1 custom-scrollbar">
              <div className="p-3 space-y-2">
                 {conversations.map((conv) => (
                   <div
                     key={conv.id}
                     onClick={() => setSelectedConversationId(conv.id)}
                     className={cn(
                       "group relative p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer",
                       selectedConversationId === conv.id
                        ? "bg-primary/10 border-primary/30 shadow-[inset_0_0_15px_rgba(74,124,255,0.05)]"
                        : "bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/[0.05]"
                     )}
                   >
                     <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                           <h4 className={cn(
                             "text-[13px] font-semibold truncate transition-colors",
                             selectedConversationId === conv.id ? "text-primary" : "text-foreground group-hover:text-primary/80"
                           )}>
                             {conv.title || 'Incomplete Analysis Packet'}
                           </h4>
                           <p className="text-[10px] text-muted-foreground/40 mt-1 font-medium font-mono">
                             {new Date(conv.created_at || Date.now()).toLocaleDateString(undefined, { 
                               day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                             }).toUpperCase()}
                           </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-400 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                     </div>
                     
                     {selectedConversationId === conv.id && (
                       <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                     )}
                   </div>
                 ))}
                 
                 {conversations.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                      <div className="p-3 rounded-full bg-white/[0.02] mb-4">
                        <MessageSquare className="h-6 w-6 text-muted-foreground/20" />
                      </div>
                      <p className="text-[11px] font-bold text-muted-foreground/30 uppercase tracking-widest">Awaiting threads</p>
                   </div>
                 )}
              </div>
           </ScrollArea>
        </div>

        {/* Main Workspace: Neural Terminal */}
        <div className="lg:col-span-9 flex flex-col min-h-0 border border-[hsl(220_16%_14%)] bg-[hsl(220_18%_7%)] rounded-3xl overflow-hidden shadow-2xl relative">
           {/* Top Bar Indicators */}
           <div className="absolute top-0 left-0 right-0 h-[60px] bg-gradient-to-b from-[hsl(220_18%_7%)] to-transparent z-20 pointer-events-none" />
           
           <div className="flex-none p-4 flex items-center justify-between border-b border-[hsl(220_16%_14%)] z-30">
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse" />
                 <span className="text-[11px] font-bold tracking-[0.1em] text-muted-foreground/80 uppercase">
                    {selectedConversationId 
                      ? conversations.find(c => c.id === selectedConversationId)?.title || 'Neural Stream'
                      : 'STANDBY MODE'}
                 </span>
              </div>
              
              {selectedConversationId && (
                <div className="flex items-center gap-1.5 scale-90">
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
           </div>

           {/* Message Stream */}
           <ScrollArea className="flex-1 px-4 lg:px-8 py-10 custom-scrollbar">
              <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end space-y-10 pb-10">
                 {!selectedConversationId ? (
                   <div className="flex flex-col items-center justify-center text-center space-y-10 py-12 px-6 animate-in fade-in zoom-in duration-500">
                      <div className="relative">
                         <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
                         <div className="relative p-10 bg-[hsl(220_16%_9%)] border border-[hsl(220_16%_14%)] rounded-[40px] shadow-2xl">
                            <Sparkles className="h-20 w-20 text-primary" />
                         </div>
                      </div>
                      <div className="space-y-4 max-w-lg">
                         <h2 className="text-3xl font-bold tracking-tight text-foreground">Initiate Neural Link</h2>
                         <p className="text-muted-foreground/60 text-base leading-relaxed">
                            Connect your enterprise datasets via the <span className="text-primary font-bold">RAG interface</span> to begin deep-analysis chat or start a fresh generalized session.
                         </p>
                      </div>
                      <Button 
                        size="lg" 
                        onClick={handleNewConversation} 
                        className="h-14 px-10 bg-primary hover:bg-primary/90 text-white font-bold text-sm tracking-widest shadow-xl shadow-primary/20 gap-3 group"
                      >
                         <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                         START NEW SESSION
                      </Button>
                   </div>
                 ) : messages.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 opacity-40">
                      <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-[24px]">
                        <MessageSquare className="h-10 w-10 text-muted-foreground/60" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-xl uppercase tracking-tighter">Null Stream</h3>
                        <p className="text-xs font-medium max-w-xs mx-auto">
                          Waiting for initial analytical query for {datasets.find(d => d.id === selectedDataset)?.file_name || 'external knowledge base'}
                        </p>
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-10">
                      {messages.map((message) => (
                        <ChatMessageComponent key={message.id} message={message} />
                      ))}
                   </div>
                 )}
                 
                 {(isSending || isSearching) && (
                   <div className="flex items-center gap-10 py-2">
                       <div className="flex items-center gap-3 text-primary animate-in slide-in-from-left duration-300">
                           <div className="flex gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[bounce_1s_infinite_0ms]" />
                              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[bounce_1s_infinite_200ms]" />
                              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[bounce_1s_infinite_400ms]" />
                           </div>
                           <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                             {isSearching ? 'Querying Knowledge Graph' : 'Processing Neural Weights'}
                           </span>
                       </div>
                   </div>
                 )}
                 <div ref={messagesEndRef} className="h-4" />
              </div>
           </ScrollArea>

           {/* Input Dock */}
           <div className="p-6 bg-gradient-to-t from-[hsl(220_18%_7%)] via-[hsl(220_18%_7%)] to-transparent border-t border-[hsl(220_16%_14%)]">
              <div className="max-w-4xl mx-auto relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-end gap-3 bg-[hsl(220_16%_9%)] border border-[hsl(220_16%_14%)] rounded-2xl p-2 pl-4 pr-2 shadow-2xl ring-1 ring-white/5">
                   <textarea
                     value={inputMessage}
                     onChange={(e) => setInputMessage(e.target.value)}
                     onKeyDown={handleKeyPress}
                     placeholder={selectedConversationId ? "Message Neural Assistant..." : "Initiate a session to chat"}
                     disabled={!selectedConversationId || isSending}
                     rows={1}
                     className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] text-foreground placeholder:text-muted-foreground/30 py-3 resize-none max-h-48 custom-scrollbar font-medium"
                   />
                   <Button
                     onClick={handleSendMessage}
                     disabled={!selectedConversationId || !inputMessage.trim() || isSending}
                     className={cn(
                       "h-11 w-11 rounded-xl shadow-lg transition-all active:scale-95 flex-shrink-0",
                       inputMessage.trim() ? "bg-primary text-white shadow-primary/20" : "bg-white/[0.03] text-muted-foreground/30 cursor-not-allowed border border-white/[0.05]"
                     )}
                   >
                     {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                   </Button>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between mt-3 px-1 gap-2">
                   <p className="text-[9px] sm:text-[10px] text-muted-foreground/30 font-bold uppercase tracking-widest hidden xs:block">
                      ENTER TO TRANSMIT · SHIFT+ENTER FOR SPACE
                   </p>
                   {selectedDataset && (
                     <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-help bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                        <Database className="h-3 w-3 text-primary" />
                        <span className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-tighter">Vector-Gated Active</span>
                     </div>
                   )}
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
