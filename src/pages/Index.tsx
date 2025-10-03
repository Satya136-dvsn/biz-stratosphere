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
          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">📊 Real-time Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Live KPIs, interactive charts, and instant insights
            </p>
          </div>
          
          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">🤖 AI Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Natural language queries powered by Gemini AI
            </p>
          </div>
          
          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">🔮 ML Predictions</h3>
            <p className="text-sm text-muted-foreground">
              Churn prediction, forecasting, anomaly detection
            </p>
          </div>
        </div>

        <div className="pt-8">
          <p className="text-lg text-muted-foreground mb-4">
            ✨ Built with React, Supabase, AI, and modern web technologies
          </p>
          <p className="text-sm text-muted-foreground">
            Ready to revolutionize your business intelligence? Head to the Dashboard!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
