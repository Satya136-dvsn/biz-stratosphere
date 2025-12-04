import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles, TrendingUp, BarChart3 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import styles from "./AIChatbot.module.css";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}


export function AIChatbot() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('ai-chat', {
        body: { message: currentInput },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get AI response');
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.message,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble responding right now. Please try again later.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrendAnalysis = async (metric: string) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('trend-analysis', {
        body: { metric_name: metric, time_period: 30 },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get trend analysis');
      }

      const analysis = response.data;
      const insight = `📊 Trend Analysis for ${metric}:\n\n• Trend: ${analysis.trend.toUpperCase()}\n• Change: ${analysis.change_percentage}%\n• Confidence: ${analysis.confidence}%\n\nInsights:\n${analysis.insights.map((i: string) => `• ${i}`).join('\n')}`;

      const botResponse: Message = {
        id: Date.now().toString(),
        text: insight,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      toast({
        title: "Trend Analysis Complete",
        description: `Analysis for ${metric} has been generated.`,
      });
    } catch (error) {
      console.error('Error getting trend analysis:', error);
      toast({
        title: "Error",
        description: "Failed to get trend analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForecast = async (metric: string) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('forecasting', {
        body: { metric_name: metric, forecast_days: 30 },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get forecast');
      }

      const forecast = response.data;
      const lastPrediction = forecast.predictions[forecast.predictions.length - 1];
      const insight = `🔮 30-Day Forecast for ${metric}:\n\n• Predicted Value: ${lastPrediction.predicted_value}\n• Range: ${lastPrediction.confidence_interval.lower} - ${lastPrediction.confidence_interval.upper}\n• Model Accuracy: ${forecast.model_accuracy}%\n\nInsights:\n${forecast.insights.map((i: string) => `• ${i}`).join('\n')}`;

      const botResponse: Message = {
        id: Date.now().toString(),
        text: insight,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      toast({
        title: "Forecast Complete",
        description: `30-day forecast for ${metric} has been generated.`,
      });
    } catch (error) {
      console.error('Error getting forecast:', error);
      toast({
        title: "Error",
        description: "Failed to get forecast. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-secondary/20 bg-gradient-to-br from-secondary/10 to-transparent h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-semibold">
          <Bot className="h-6 w-6 text-secondary" />
          AI Business Assistant
          <Sparkles className="h-4 w-4 text-warning animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-6">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 p-3 rounded-lg animate-fade-in",
                  message.isBot
                    ? "bg-muted/50"
                    : "bg-primary/10 ml-8"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.isBot
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground"
                )}>
                  {message.isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground leading-relaxed">
                    {message.text}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 p-3 rounded-lg bg-muted/50 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-secondary rounded-full animate-bounce bounce-delay-2" />
                    <div className={`w-2 h-2 bg-secondary rounded-full animate-bounce ${styles.bounceDelay}`} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTrendAnalysis('revenue')}
            disabled={isLoading}
            className="text-xs"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Revenue Trend
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleForecast('revenue')}
            disabled={isLoading}
            className="text-xs"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Revenue Forecast
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about revenue, churn, predictions..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}