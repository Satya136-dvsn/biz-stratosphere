import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Conversation } from '@/hooks/useRAGChat';

interface ConversationSettingsProps {
    conversation: Conversation | null;
    onUpdate?: () => void;
}

export function ConversationSettings({ conversation, onUpdate }: ConversationSettingsProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Settings state
    const [contextWindow, setContextWindow] = useState(10);
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(2000);

    // Load settings from conversation
    useEffect(() => {
        if (conversation) {
            setContextWindow(conversation.context_window || 10);
            setTemperature(conversation.temperature || 0.7);
            setMaxTokens(conversation.max_tokens || 2000);
        }
    }, [conversation]);

    const handleSave = async () => {
        if (!conversation) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('chat_conversations')
                .update({
                    context_window: contextWindow,
                    temperature: temperature,
                    max_tokens: maxTokens,
                })
                .eq('id', conversation.id);

            if (error) throw error;

            toast({
                title: 'Settings saved',
                description: 'Conversation settings updated successfully',
            });

            setIsOpen(false);
            onUpdate?.();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: `Failed to save settings: ${error.message}`,
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!conversation) {
        return null;
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" title="Conversation Settings">
                    <Settings className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Conversation Settings</SheetTitle>
                    <SheetDescription>
                        Customize how the AI responds in this conversation
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-6">
                    {/* Context Window */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="context-window">Context Window</Label>
                            <span className="text-sm text-muted-foreground">{contextWindow} messages</span>
                        </div>
                        <Select
                            value={contextWindow.toString()}
                            onValueChange={(value) => setContextWindow(parseInt(value))}
                        >
                            <SelectTrigger id="context-window">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5 messages (Fast, less context)</SelectItem>
                                <SelectItem value="10">10 messages (Balanced)</SelectItem>
                                <SelectItem value="15">15 messages (More context)</SelectItem>
                                <SelectItem value="20">20 messages (Maximum context)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Number of recent messages to include as context. Higher values provide more context but increase cost and response time.
                        </p>
                    </div>

                    {/* Temperature */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="temperature">Temperature</Label>
                            <span className="text-sm text-muted-foreground">{temperature.toFixed(1)}</span>
                        </div>
                        <Slider
                            id="temperature"
                            min={0}
                            max={1}
                            step={0.1}
                            value={[temperature]}
                            onValueChange={([value]) => setTemperature(value)}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Precise (0.0)</span>
                            <span>Balanced (0.7)</span>
                            <span>Creative (1.0)</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Controls randomness. Lower values make responses more focused and deterministic. Higher values make responses more creative.
                        </p>
                    </div>

                    {/* Max Tokens */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="max-tokens">Max Response Length</Label>
                            <span className="text-sm text-muted-foreground">{maxTokens} tokens</span>
                        </div>
                        <Select
                            value={maxTokens.toString()}
                            onValueChange={(value) => setMaxTokens(parseInt(value))}
                        >
                            <SelectTrigger id="max-tokens">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1000">1000 tokens (Short)</SelectItem>
                                <SelectItem value="2000">2000 tokens (Medium)</SelectItem>
                                <SelectItem value="3000">3000 tokens (Long)</SelectItem>
                                <SelectItem value="4000">4000 tokens (Very long)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Maximum length of AI responses. Longer responses cost more and take longer to generate.
                        </p>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full"
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
