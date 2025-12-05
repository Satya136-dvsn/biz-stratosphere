import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Sparkles, Loader2, DollarSign, Zap } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAIConversation } from "@/hooks/useAIConversation";
import ReactMarkdown from 'react-markdown';

export function AIChatbot() {
  const [input, setInput] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isTyping,
    sendMessage,
    isSending,
    tokenUsage,
    estimatedCost
  } = useAIConversation(currentConversationId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isSending) return;

    sendMessage({
      message: input,
      newConversation: !currentConversationId
    });

    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col bg-gradient-to-br from-card/95 to-card/80 border-primary/10">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Business Analyst</CardTitle>
              <p className="text-xs text-muted-foreground">
                Powered by GPT-4o Mini • Context-aware insights
              </p>
            </div>
          </div>

          {tokenUsage.total > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <Badge variant="outline" className="gap-1">
                <Zap className="h-3 w-3" />
                {tokenUsage.total} tokens
              </Badge>
              <Badge variant="outline" className="gap-1">
                <DollarSign className="h-3 w-3" />
                ${estimatedCost.toFixed(4)}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
                <div className="p-4 rounded-full bg-primary/10">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Ask me anything about your business data</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    I'll analyze your datasets and provide insights
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 mt-4 w-full max-w-md">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput("What are my top revenue trends?")}
                    className="justify-start text-left"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    What are my top revenue trends?
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput("Analyze my customer growth")}
                    className="justify-start text-left"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze my customer growth
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput("Show me data quality insights")}
                    className="justify-start text-left"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Show me data quality insights
                  </Button>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 items-start",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    message.role === "assistant"
                      ? "bg-primary/10"
                      : "bg-secondary/50"
                  )}
                >
                  {message.role === "assistant" ? (
                    <Bot className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-secondary-foreground" />
                  )}
                </div>

                <div
                  className={cn(
                    "flex-1 rounded-lg p-3 space-y-2",
                    message.role === "assistant"
                      ? "bg-muted/50"
                      : "bg-primary/5"
                  )}
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 rounded-lg p-3 bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Analyzing your data...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border/50">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your business data..."
              disabled={isSending}
              className="flex-1 bg-background"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              size="icon"
              className="bg-gradient-primary hover:opacity-90"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  );
}