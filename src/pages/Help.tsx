import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Keyboard, HelpCircle, Video, Code, Zap } from 'lucide-react';

export default function Help() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Help & Documentation</h2>
                <p className="text-muted-foreground">
                    Learn how to use Biz Stratosphere platform effectively
                </p>
            </div>

            <Tabs defaultValue="getting-started" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="getting-started" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        Getting Started
                    </TabsTrigger>
                    <TabsTrigger value="features" className="gap-2">
                        <Zap className="h-4 w-4" />
                        Features
                    </TabsTrigger>
                    <TabsTrigger value="faq" className="gap-2">
                        <HelpCircle className="h-4 w-4" />
                        FAQ
                    </TabsTrigger>
                    <TabsTrigger value="keyboard" className="gap-2">
                        <Keyboard className="h-4 w-4" />
                        Shortcuts
                    </TabsTrigger>
                    <TabsTrigger value="api" className="gap-2">
                        <Code className="h-4 w-4" />
                        API
                    </TabsTrigger>
                </TabsList>

                {/* Getting Started */}
                <TabsContent value="getting-started" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Welcome to Biz Stratosphere</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">1. Upload Your Data</h3>
                                <p className="text-sm text-muted-foreground">
                                    Navigate to the Dashboard and use the Enhanced Data Upload feature.
                                    Supports CSV, JSON files with automatic PII detection.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">2. Explore Analytics</h3>
                                <p className="text-sm text-muted-foreground">
                                    View real-time KPIs, create custom charts, and generate reports
                                    to gain insights from your data.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">3. Use AI Features</h3>
                                <p className="text-sm text-muted-foreground">
                                    Chat with your data using RAG, make ML predictions, and compare
                                    AI models for the best results.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">4. Create Reports</h3>
                                <p className="text-sm text-muted-foreground">
                                    Generate comprehensive reports with templates, export to CSV/JSON,
                                    and schedule automated reports.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Features Guide */}
                <TabsContent value="features" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <FeatureCard
                            title="AI Chatbot with RAG"
                            description="Ask questions about your data using natural language. The AI searches your uploaded datasets and provides accurate answers with source citations."
                            route="/ai-chat"
                            badge="AI"
                        />
                        <FeatureCard
                            title="ML Predictions & SHAP"
                            description="Make predictions using trained ML models (churn, revenue). Get SHAP explanations showing which features influenced the predictions."
                            route="/ml-predictions"
                            badge="ML"
                        />
                        <FeatureCard
                            title="Advanced Charts"
                            description="Create 9 types of charts: Bar, Line, Area, Pie, Scatter, Radar, Treemap, Gauge, Funnel. Full customization and export options."
                            route="/advanced-charts"
                            badge="Analytics"
                        />
                        <FeatureCard
                            title="Reports"
                            description="Generate KPI Summary, Trend Analysis, Comparison, and Custom reports. Schedule automated delivery and export to multiple formats."
                            route="/reports"
                            badge="Reports"
                        />
                        <FeatureCard
                            title="API Management"
                            description="Create API keys for programmatic access. Monitor usage, view analytics, track rate limits, and review request logs."
                            route="/api-management"
                            badge="API"
                        />
                        <FeatureCard
                            title="Workspaces"
                            description="Collaborate with your team. Create workspaces, invite members, manage roles, and track usage statistics."
                            route="/workspaces"
                            badge="Teams"
                        />
                    </div>
                </TabsContent>

                {/* FAQ */}
                <TabsContent value="faq" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Frequently Asked Questions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FAQItem
                                question="How do I upload data?"
                                answer="Navigate to the Dashboard and click on the Enhanced Data Upload section. You can upload CSV or JSON files. PII detection runs automatically to protect sensitive information."
                            />
                            <FAQItem
                                question="What AI models are available?"
                                answer="We provide two trained ML models: Churn Predictor (identifies customer churn risk) and Revenue Forecaster (predicts revenue based on business metrics). Both include SHAP explanations."
                            />
                            <FAQItem
                                question="Can I export my charts and reports?"
                                answer="Yes! Charts can be exported as PNG images or JSON data. Reports can be exported as CSV or JSON files. All exports preserve your data and customizations."
                            />
                            <FAQItem
                                question="How does the AI chatbot work?"
                                answer="The AI chatbot uses RAG (Retrieval-Augmented Generation) with Google Gemini. It searches your uploaded data using vector similarity, then generates accurate answers with source citations."
                            />
                            <FAQItem
                                question="Is my data secure?"
                                answer="Absolutely. We use Row Level Security (RLS), PII detection, audit logging, and encryption. Your data is isolated and only accessible by authorized users."
                            />
                            <FAQItem
                                question="How do I create a chart?"
                                answer="Go to Advanced Charts, select your dataset, choose a chart type, map your columns (X/Y axes), apply filters if needed, customize colors and appearance, then save your configuration."
                            />
                            <FAQItem
                                question="What are API rate limits?"
                                answer="Free tier: 1000 requests/hour, 10000/day. Track your usage in API Management. Rate limits protect system performance and ensure fair usage."
                            />
                            <FAQItem
                                question="Can I schedule automated reports?"
                                answer="Yes! In the Reports page, configure your report, set a schedule (daily, weekly, monthly), and specify delivery method. The system will generate and deliver reports automatically."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Keyboard Shortcuts */}
                <TabsContent value="keyboard" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Keyboard Shortcuts</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <ShortcutItem shortcut="Ctrl/Cmd + K" description="Open command bar" />
                                <ShortcutItem shortcut="Ctrl/Cmd + /" description="Open help" />
                                <ShortcutItem shortcut="Ctrl/Cmd + B" description="Toggle sidebar" />
                                <ShortcutItem shortcut="Ctrl/Cmd + S" description="Save current work" />
                                <ShortcutItem shortcut="Esc" description="Close modals/dialogs" />
                                <ShortcutItem shortcut="Ctrl/Cmd + Enter" description="Submit forms" />
                                <ShortcutItem shortcut="Tab" description="Navigate forward" />
                                <ShortcutItem shortcut="Shift + Tab" description="Navigate backward" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* API Documentation */}
                <TabsContent value="api" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>API Documentation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-2">Base URL</h3>
                                <code className="block p-2 bg-muted rounded text-sm">
                                    https://api.biz-stratosphere.com/v1
                                </code>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-4">Authentication</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Include your API key in the Authorization header:
                                </p>
                                <code className="block p-2 bg-muted rounded text-sm">
                                    Authorization: Bearer YOUR_API_KEY
                                </code>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-4">Common Endpoints</h3>
                                <div className="space-y-3">
                                    <APIEndpoint
                                        method="GET"
                                        path="/datasets"
                                        description="List all datasets"
                                    />
                                    <APIEndpoint
                                        method="POST"
                                        path="/datasets"
                                        description="Create new dataset"
                                    />
                                    <APIEndpoint
                                        method="GET"
                                        path="/analytics"
                                        description="Get analytics data"
                                    />
                                    <APIEndpoint
                                        method="POST"
                                        path="/charts"
                                        description="Create chart configuration"
                                    />
                                    <APIEndpoint
                                        method="POST"
                                        path="/reports/generate"
                                        description="Generate report"
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Rate Limits</h3>
                                <p className="text-sm text-muted-foreground">
                                    Free: 1000/hour, 10000/day<br />
                                    Pro: 10000/hour, 100000/day<br />
                                    Enterprise: Custom limits
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function FeatureCard({ title, description, route, badge }: {
    title: string;
    description: string;
    route: string;
    badge: string;
}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <Badge variant="outline">{badge}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{description}</p>
                <a href={route} className="text-sm text-primary hover:underline">
                    Go to {title} →
                </a>
            </CardContent>
        </Card>
    );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    return (
        <div>
            <h4 className="font-semibold mb-2">{question}</h4>
            <p className="text-sm text-muted-foreground">{answer}</p>
        </div>
    );
}

function ShortcutItem({ shortcut, description }: { shortcut: string; description: string }) {
    return (
        <div className="flex items-center justify-between p-2 border rounded">
            <span className="text-sm">{description}</span>
            <kbd className="px-2 py-1 text-xs bg-muted rounded">{shortcut}</kbd>
        </div>
    );
}

function APIEndpoint({ method, path, description }: {
    method: string;
    path: string;
    description: string;
}) {
    const methodColors: Record<string, string> = {
        GET: 'bg-blue-100 text-blue-700',
        POST: 'bg-green-100 text-green-700',
        PUT: 'bg-yellow-100 text-yellow-700',
        DELETE: 'bg-red-100 text-red-700',
    };

    return (
        <div className="flex items-center gap-3 p-2 border rounded">
            <Badge className={methodColors[method]}>{method}</Badge>
            <code className="flex-1 text-sm">{path}</code>
            <span className="text-sm text-muted-foreground">{description}</span>
        </div>
    );
}
