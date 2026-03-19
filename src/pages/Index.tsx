import { BarChart3, Bot, Cpu, Sparkles } from 'lucide-react';

// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="text-center space-y-8 p-8 max-w-4xl">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI-Powered Business Intelligence
          </h1>
          <p className="text-2xl text-muted-foreground">
            Your Complete Data Analytics & Machine Learning Platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 rounded-xl border bg-card/40 backdrop-blur-sm hover:shadow-xl transition-all hover:scale-[1.02] border-primary/10 group">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Real-time Analytics</h3>
            <p className="text-sm text-muted-foreground font-medium">
              Live KPIs, interactive charts, and instant insights
            </p>
          </div>
          
          <div className="p-6 rounded-xl border bg-card/40 backdrop-blur-sm hover:shadow-xl transition-all hover:scale-[1.02] border-secondary/10 group">
            <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-4 group-hover:scale-110 transition-transform">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">AI Assistant</h3>
            <p className="text-sm text-muted-foreground font-medium">
              Natural language queries powered by Gemini AI
            </p>
          </div>
          
          <div className="p-6 rounded-xl border bg-card/40 backdrop-blur-sm hover:shadow-xl transition-all hover:scale-[1.02] border-accent/10 group">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">ML Predictions</h3>
            <p className="text-sm text-muted-foreground font-medium">
              Churn prediction, forecasting, anomaly detection
            </p>
          </div>
        </div>

        <div className="pt-8 space-y-4">
          <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground font-medium">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Built with React, Supabase, AI, and modern web technologies</span>
          </div>
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-[0.2em] opacity-60">
            Ready to revolutionize your business intelligence? Head to the Dashboard!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
