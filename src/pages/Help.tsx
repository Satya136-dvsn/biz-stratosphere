// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/layout/PageLayout';
import {
    BookOpen, Keyboard, HelpCircle, Code, Zap, ChevronDown, ChevronRight,
    BarChart3, Brain, MessageSquare, FileText, Settings, Users, Shield,
    Upload, LineChart, PieChart, Activity, Sparkles, Bot, Gauge, Network,
    Database, Key, Bell, Lock, Palette, Globe, Layers, Search, Terminal,
    TrendingUp, GitBranch, Workflow, LayoutDashboard, AlertTriangle,
    Mail, CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Accordion Component ──
function Accordion({ title, icon: Icon, badge, children, defaultOpen = false }: {
    title: string; icon: any; badge?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-border/40 rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
            <button onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-semibold text-base flex-1">{title}</span>
                {badge && <Badge variant="outline" className="text-xs mr-2">{badge}</Badge>}
                {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </button>
            {open && <div className="px-5 pb-5 pt-1 border-t border-border/20 space-y-4 text-sm text-muted-foreground leading-relaxed">{children}</div>}
        </div>
    );
}

// ── Section Header ──
function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h4 className="font-semibold text-foreground mb-2 text-[13px] uppercase tracking-wide">{title}</h4>
            {children}
        </div>
    );
}

// ── Step List ──
function StepList({ steps }: { steps: string[] }) {
    return (
        <ol className="list-decimal list-inside space-y-1.5">
            {steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
    );
}

// ── Sidebar Nav ──
const sections = [
    { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
    { id: 'dashboard', label: 'Dashboard & KPIs', icon: LayoutDashboard },
    { id: 'data', label: 'Data Upload & Datasets', icon: Upload },
    { id: 'charts', label: 'Advanced Charts', icon: BarChart3 },
    { id: 'reports', label: 'Reports & Exports', icon: FileText },
    { id: 'ai-chat', label: 'AI Chat (RAG)', icon: MessageSquare },
    { id: 'ai-analytics', label: 'AI Analytics', icon: Sparkles },
    { id: 'ml', label: 'ML Predictions & SHAP', icon: Brain },
    { id: 'agent', label: 'Agent Playground', icon: Bot },
    { id: 'decisions', label: 'Decision History', icon: GitBranch },
    { id: 'workspaces', label: 'Workspaces & Teams', icon: Users },
    { id: 'api', label: 'API Management', icon: Key },
    { id: 'profile', label: 'Profile & Settings', icon: Settings },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
    { id: 'api-ref', label: 'API Reference', icon: Code },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
];

export default function Help() {
    const [activeSection, setActiveSection] = useState('getting-started');

    const scrollTo = (id: string) => {
        setActiveSection(id);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <PageLayout maxWidth="7xl">
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight">Help & Documentation</h1>
                <p className="text-lg text-muted-foreground mt-2">
                    Comprehensive guide to every feature in Biz Stratosphere.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
                {/* Sidebar Navigation */}
                <nav className="hidden lg:block sticky top-4 self-start max-h-[calc(100vh-120px)] overflow-y-auto space-y-0.5 pr-2">
                    {sections.map(s => (
                        <button key={s.id} onClick={() => scrollTo(s.id)}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                                activeSection === s.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}>
                            <s.icon className="h-3.5 w-3.5 shrink-0" />
                            {s.label}
                        </button>
                    ))}
                </nav>

                {/* Main Content */}
                <div className="space-y-6">

                    {/* ═══════════ GETTING STARTED ═══════════ */}
                    <section id="getting-started">
                        <Accordion title="Getting Started" icon={BookOpen} defaultOpen>
                            <p>Biz Stratosphere is a full-stack business analytics and AI platform. It combines real-time dashboards, machine learning predictions, RAG-powered AI chat, advanced charting, and team collaboration — all inside a premium corporate interface.</p>
                            <SectionBlock title="Quick Start (5 Minutes)">
                                <StepList steps={[
                                    "Sign up or log in at the Authentication page. Any valid email address is supported for registration.",
                                    "You'll land on the Dashboard with live KPI cards (Revenue, Customers, Growth, Satisfaction).",
                                    "Upload your first dataset via the Data Upload widget — CSV and JSON files are accepted, with automatic PII detection.",
                                    "Explore your data in Advanced Charts — choose from 9 chart types with full customization.",
                                    "Ask questions about your data in AI Chat — the RAG engine searches your datasets and returns cited answers.",
                                    "Generate polished reports in the Reports section — export as CSV, JSON, or schedule automated delivery.",
                                    "Invite teammates via Workspaces to collaborate on datasets and analytics."
                                ]} />
                            </SectionBlock>
                            <SectionBlock title="System Requirements">
                                <p>Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+). No installation required — Biz Stratosphere runs entirely in the browser.</p>
                            </SectionBlock>
                        </Accordion>
                    </section>

                    {/* ═══════════ DASHBOARD ═══════════ */}
                    <section id="dashboard">
                        <Accordion title="Dashboard & KPIs" icon={LayoutDashboard} badge="Core">
                            <p>The Dashboard is your command center. It displays real-time Key Performance Indicators (KPIs), quick-action shortcuts, and a data upload widget — all in a unified, responsive layout.</p>
                            <SectionBlock title="KPI Cards">
                                <p>Four animated KPI cards are displayed at the top:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li><strong>Total Revenue</strong> — Aggregated revenue across all data sources, with percentage change from the previous period.</li>
                                    <li><strong>Active Customers</strong> — Count of unique active customers with trend analysis.</li>
                                    <li><strong>Growth Rate</strong> — Month-over-month or year-over-year growth percentage.</li>
                                    <li><strong>Satisfaction Score</strong> — Customer satisfaction metric (e.g., NPS or CSAT) with trend indicators.</li>
                                </ul>
                                <p>Each card features an animated count-up effect, a colored accent line, and a trend arrow (↑ green / ↓ red).</p>
                            </SectionBlock>
                            <SectionBlock title="Quick Actions">
                                <p>A grid of shortcut buttons for frequently used actions: Upload Data, Create Report, View Charts, AI Chat, ML Predictions, and API Keys. Each button navigates directly to the corresponding page.</p>
                            </SectionBlock>
                            <SectionBlock title="Revenue & Customer Charts">
                                <p>The dashboard includes inline Revenue and Customer trend charts rendered with Recharts. These display the last 7-12 data points with premium gradient fills, JetBrains Mono axis fonts, and glassmorphism tooltips.</p>
                            </SectionBlock>
                        </Accordion>
                    </section>

                    {/* ═══════════ DATA UPLOAD ═══════════ */}
                    <section id="data">
                        <Accordion title="Data Upload & Datasets" icon={Upload} badge="Core">
                            <p>Biz Stratosphere supports CSV and JSON file uploads. All uploaded data is stored securely in Supabase with Row Level Security, ensuring only you (and your workspace members) can access it.</p>
                            <SectionBlock title="How to Upload">
                                <StepList steps={[
                                    "Navigate to the Dashboard or the Upload History page.",
                                    "Click the upload area or drag-and-drop your CSV/JSON file.",
                                    "The system automatically scans for Personally Identifiable Information (PII) — names, emails, phone numbers, SSNs — and flags them.",
                                    "Review the PII detection results and choose to redact or keep.",
                                    "Click 'Upload' to persist the file. It becomes available across AI Chat, Charts, Reports, and ML Predictions."
                                ]} />
                            </SectionBlock>
                            <SectionBlock title="PII Detection">
                                <p>The platform uses regex-based pattern matching and NLP heuristics to detect sensitive fields. Detected PII is highlighted with a warning badge. You can choose to mask, redact, or ignore the detection for each field.</p>
                            </SectionBlock>
                            <SectionBlock title="Upload History">
                                <p>All past uploads are logged with filename, size, row count, column count, upload date, and PII status. You can re-download, preview, or delete past uploads from the Upload History page.</p>
                            </SectionBlock>
                            <SectionBlock title="Supported Formats">
                                <ul className="list-disc list-inside space-y-1">
                                    <li><strong>CSV</strong> — Comma-separated values with auto-detected headers and delimiters.</li>
                                    <li><strong>JSON</strong> — Array of objects (flat structure) or nested JSON with automatic flattening.</li>
                                </ul>
                            </SectionBlock>
                        </Accordion>
                    </section>

                    {/* ═══════════ ADVANCED CHARTS ═══════════ */}
                    <section id="charts">
                        <Accordion title="Advanced Charts" icon={BarChart3} badge="Analytics">
                            <p>Create stunning, interactive visualizations from your uploaded datasets. The chart engine supports 9 chart types, full axis customization, color theming, and one-click export.</p>
                            <SectionBlock title="Chart Types">
                                <ul className="list-disc list-inside space-y-1">
                                    <li><strong>Bar Chart</strong> — Vertical or horizontal bars with gradient fills. Ideal for category comparisons.</li>
                                    <li><strong>Line Chart</strong> — Smooth or stepped lines for trend analysis over time.</li>
                                    <li><strong>Area Chart</strong> — Filled area under lines for volume-based trends.</li>
                                    <li><strong>Pie Chart</strong> — Proportional distribution with labels and legends.</li>
                                    <li><strong>Scatter Plot</strong> — X/Y correlation analysis with optional size encoding.</li>
                                    <li><strong>Radar Chart</strong> — Multi-dimensional comparison (e.g., performance profiles).</li>
                                    <li><strong>Treemap</strong> — Hierarchical data with nested rectangles sized by value.</li>
                                    <li><strong>Gauge Chart</strong> — Single KPI with a radial gauge (min/max/current).</li>
                                    <li><strong>Funnel Chart</strong> — Conversion pipeline visualization (e.g., sales funnel).</li>
                                </ul>
                            </SectionBlock>
                            <SectionBlock title="How to Create a Chart">
                                <StepList steps={[
                                    "Navigate to Advanced Charts.",
                                    "Select a dataset from the dropdown (populated from your uploads).",
                                    "Choose a chart type from the 9 available options.",
                                    "Map your columns to the X-axis, Y-axis, and optional group/color dimensions.",
                                    "Apply filters (e.g., date range, category filter) to narrow the data.",
                                    "Customize colors, labels, legend position, gridlines, and tooltip format.",
                                    "Click 'Save Configuration' to persist the chart. It will appear on your chart dashboard."
                                ]} />
                            </SectionBlock>
                            <SectionBlock title="Export Options">
                                <p>Charts can be exported as <strong>PNG images</strong> (high-resolution) or <strong>JSON data</strong> (raw chart configuration + data). Use the export button in the top-right corner of any chart.</p>
                            </SectionBlock>
                        </Accordion>
                    </section>

                    {/* ═══════════ REPORTS ═══════════ */}
                    <section id="reports">
                        <Accordion title="Reports & Exports" icon={FileText} badge="Reports">
                            <p>Generate comprehensive business reports with customizable templates, scheduling, and multi-format export.</p>
                            <SectionBlock title="Report Types">
                                <ul className="list-disc list-inside space-y-1">
                                    <li><strong>KPI Summary</strong> — Overview of all key metrics with period-over-period comparisons.</li>
                                    <li><strong>Trend Analysis</strong> — Time-series analysis of selected metrics with forecasting.</li>
                                    <li><strong>Comparison Report</strong> — Side-by-side comparison of segments, products, or time periods.</li>
                                    <li><strong>Custom Report</strong> — Build your own report by selecting metrics, charts, and narrative sections.</li>
                                </ul>
                            </SectionBlock>
                            <SectionBlock title="Scheduled Reports">
                                <p>Automate report generation on a schedule (daily, weekly, monthly). Configure delivery via the Scheduled Reports page. Each scheduled report runs at the configured time and stores the output for later access.</p>
                            </SectionBlock>
                            <SectionBlock title="Export Formats">
                                <p>Reports can be exported as <strong>CSV</strong> (tabular data), <strong>JSON</strong> (structured data), or viewed directly in the browser with interactive charts embedded.</p>
                            </SectionBlock>
                        </Accordion>
                    </section>

                    {/* ═══════════ AI CHAT ═══════════ */}
                    <section id="ai-chat">
                        <Accordion title="AI Chat (RAG)" icon={MessageSquare} badge="AI">
                            <p>Chat with your data using natural language. The AI uses Retrieval-Augmented Generation (RAG) to search your uploaded datasets, retrieve relevant context, and generate accurate answers with source citations.</p>
                            <SectionBlock title="How It Works">
                                <StepList steps={[
                                    "Navigate to AI Chat from the sidebar.",
                                    "Type a question in natural language (e.g., 'What was our top revenue product last quarter?').",
                                    "The RAG engine converts your question into a vector embedding and searches your datasets for relevant rows/documents.",
                                    "The top matching results are passed as context to Google Gemini (or your configured LLM provider).",
                                    "The AI generates a comprehensive answer with source citations linking back to the original data."
                                ]} />
                            </SectionBlock>
                            <SectionBlock title="Conversation Management">
                                <p>All conversations are saved and can be resumed later. You can create new conversations, rename them, or delete old ones from the sidebar panel. Each conversation maintains its own context history.</p>
                            </SectionBlock>
                            <SectionBlock title="Provider Configuration">
                                <p>The AI Chat supports multiple LLM providers: <strong>Google Gemini</strong> (default cloud), <strong>Ollama</strong> (local, free), and custom API endpoints. Switch providers from the Settings page under "AI Configuration."</p>
                            </SectionBlock>
                        </Accordion>
                    </section>

                    {/* ═══════════ AI ANALYTICS ═══════════ */}
                    <section id="ai-analytics">
                        <Accordion title="AI Analytics" icon={Sparkles} badge="AI">
                            <p>AI Analytics provides automated insight generation from your data. It identifies trends, anomalies, and correlations without requiring manual query writing.</p>
                            <SectionBlock title="Features">
                                <ul className="list-disc list-inside space-y-1">
                                    <li><strong>Automated Insights</strong> — The system analyzes your datasets and surfaces key findings (e.g., "Revenue increased 23% in Q3").</li>
                                    <li><strong>Anomaly Detection</strong> — Flags unusual data points that deviate from expected patterns.</li>
                                    <li><strong>Correlation Analysis</strong> — Identifies relationships between variables in your data.</li>
                                    <li><strong>Natural Language Summaries</strong> — Each insight includes a plain-English explanation of what was found and why it matters.</li>
                                </ul>
                            </SectionBlock>
                        </Accordion>
                    </section>

                    {/* ═══════════ ML PREDICTIONS ═══════════ */}
                    <section id="ml">
                        <Accordion title="ML Predictions & SHAP" icon={Brain} badge="ML">
                            <p>Make predictions using pre-trained machine learning models. Each prediction comes with SHAP (SHapley Additive exPlanations) values showing which features influenced the result.</p>
                            <SectionBlock title="Available Models">
                                <ul className="list-disc list-inside space-y-1">
                                    <li><strong>Churn Predictor</strong> — Predicts customer churn probability based on usage patterns, engagement metrics, and account attributes. Input fields: tenure, monthly charges, contract type, support tickets, etc.</li>
                                    <li><strong>Revenue Forecaster</strong> — Predicts expected revenue based on business metrics like marketing spend, customer count, seasonal indices, and historical trends.</li>
                                </ul>
                            </SectionBlock>
                            <SectionBlock title="SHAP Explanations">
                                <p>Every prediction includes a SHAP waterfall chart showing the contribution of each feature. Red bars push the prediction higher; blue bars push it lower. This makes the AI's reasoning transparent and auditable.</p>
                            </SectionBlock>
                            <SectionBlock title="How to Use">
                                <StepList steps={[
                                    "Navigate to ML Predictions.",
                                    "Select a model (Churn or Revenue).",
                                    "Fill in the input fields with your data (or use the auto-fill from a dataset row).",
                                    "Click 'Predict' to get the result.",
                                    "Review the SHAP explanation chart to understand the key drivers."
                                ]} />
                            </SectionBlock>
                        </Accordion>
                    </section>

                    {/* ═══════════ AGENT PLAYGROUND ═══════════ */}
                    <section id="agent">
                        <Accordion title="Agent Playground" icon={Bot} badge="AI">
                            <p>The Agent Playground is an experimental environment where you can interact with AI agents for complex multi-step tasks like data analysis, report generation, and strategic recommendations.</p>
                            <SectionBlock title="How It Works">
                                <p>Describe a high-level business task (e.g., "Analyze our Q3 sales data and recommend actions to reduce churn"). The agent breaks it into sub-tasks, executes them sequentially, and presents the final results with supporting data and visualizations.</p>
                            </SectionBlock>
                        </Accordion>
                    </section>

                    {/* ═══════════ DECISION HISTORY ═══════════ */}
                    <section id="decisions">
                        <Accordion title="Decision History" icon={GitBranch}>
                            <p>Every AI-assisted decision made on the platform is logged in the Decision History. This provides a full audit trail of what was decided, when, by whom, and which AI model was used.</p>
                            <SectionBlock title="What Is Logged">
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Decision timestamp and user who initiated it.</li>
                                    <li>AI model and provider used (Gemini, Ollama, etc.).</li>
                                    <li>Input data and context provided to the AI.</li>
                                    <li>The AI's response and any actions taken.</li>
                                    <li>Confidence score and risk assessment.</li>
                                </ul>
                            </SectionBlock>
                        </Accordion>
                    </section>

                    {/* ═══════════ WORKSPACES ═══════════ */}
                    <section id="workspaces">
                        <Accordion title="Workspaces & Teams" icon={Users} badge="Teams">
                            <p>Workspaces enable team collaboration. Each workspace is an isolated environment with its own datasets, charts, reports, and member permissions.</p>
                            <SectionBlock title="Creating a Workspace">
                                <StepList steps={[
                                    "Navigate to Workspaces from the sidebar.",
                                    "Click 'INSTANTIATE_NODE' (top right).",
                                    "Enter a name and optional description.",
                                    "Click 'INSTANTIATE' — your workspace is live."
                                ]} />
                            </SectionBlock>
                            <SectionBlock title="Member Roles">
                                <ul className="list-disc list-inside space-y-1">
                                    <li><strong>Owner</strong> — Full control. Can delete workspace, manage billing, and all members.</li>
                                    <li><strong>Admin</strong> — Can invite/remove members, manage datasets, and configure settings.</li>
                                    <li><strong>Member</strong> — Can view and create data, charts, and reports. Cannot manage members.</li>
                                    <li><strong>Viewer</strong> — Read-only access to all workspace content.</li>
                                </ul>
                            </SectionBlock>
                            <SectionBlock title="Inviting Members">
                                <p>Open the workspace settings (gear icon), enter the member's email, select a role, and click 'TRANSMIT'. They will receive an invitation link valid for 7 days.</p>
                            </SectionBlock>
                        </Accordion>
                    </section>

                    {/* ═══════════ API MANAGEMENT ═══════════ */}
                    <section id="api">
                        <Accordion title="API Management" icon={Key} badge="API">
                            <p>Create and manage API keys for programmatic access to your Biz Stratosphere data. Monitor usage, track rate limits, and review request logs.</p>
                            <SectionBlock title="Creating an API Key">
                                <StepList steps={[
                                    "Navigate to API Management.",
                                    "Click 'Create API Key'.",
                                    "Enter a name for the key (e.g., 'Production Server').",
                                    "Select permissions (read, write, admin).",
                                    "Copy the generated key — it is only shown once.",
                                ]} />
                            </SectionBlock>
                            <SectionBlock title="Rate Limits">
                                <ul className="list-disc list-inside space-y-1">
                                    <li><strong>Free</strong> — 1,000 requests/hour, 10,000/day</li>
                                    <li><strong>Pro</strong> — 10,000 requests/hour, 100,000/day</li>
                                    <li><strong>Enterprise</strong> — Custom limits</li>
                                </ul>
                            </SectionBlock>
                        </Accordion>
                    </section>

                    {/* ═══════════ PROFILE & SETTINGS ═══════════ */}
                    <section id="profile">
                        <Accordion title="Profile & Settings" icon={Settings}>
                            <SectionBlock title="Profile">
                                <p>Update your display name, avatar (uploaded to Supabase Storage), bio, company name, and timezone. Your profile information is visible to workspace members.</p>
                            </SectionBlock>
                            <SectionBlock title="Settings Tabs">
                                <ul className="list-disc list-inside space-y-1">
                                    <li><strong>General</strong> — Theme (dark/light/system), language, timezone, notification preferences.</li>
                                    <li><strong>Subscription</strong> — View your current plan (Free, Pro, Enterprise), upgrade via Contact Sales.</li>
                                    <li><strong>AI Configuration</strong> — Select AI provider (Gemini, Ollama), set temperature, model version.</li>
                                    <li><strong>Security</strong> — Change password, enable MFA (TOTP-based), manage active sessions.</li>
                                    <li><strong>Notifications</strong> — Configure email, push, and in-app notification preferences for different event types.</li>
                                </ul>
                            </SectionBlock>
                        </Accordion>
                    </section>

                    {/* ═══════════ SECURITY ═══════════ */}
                    <section id="security">
                        <Accordion title="Security & Privacy" icon={Shield}>
                            <SectionBlock title="Data Security">
                                <ul className="list-disc list-inside space-y-1">
                                    <li><strong>Row Level Security (RLS)</strong> — Every Supabase table uses RLS policies to ensure users can only access their own data.</li>
                                    <li><strong>PII Detection</strong> — Automated scanning of uploaded data for personally identifiable information.</li>
                                    <li><strong>Audit Logging</strong> — All sensitive actions (logins, data access, role changes) are logged in an immutable audit trail.</li>
                                    <li><strong>Encryption</strong> — Data is encrypted at rest (AES-256) and in transit (TLS 1.3).</li>
                                </ul>
                            </SectionBlock>
                            <SectionBlock title="Multi-Factor Authentication (MFA)">
                                <p>Enable TOTP-based MFA from Settings → Security. Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit code to verify. MFA is required for all subsequent logins.</p>
                            </SectionBlock>
                        </Accordion>
                    </section>

                    {/* ═══════════ BILLING ═══════════ */}
                    <section id="billing">
                        <Accordion title="Billing & Plans" icon={CreditCard}>
                            <SectionBlock title="Available Plans">
                                <ul className="list-disc list-inside space-y-1">
                                    <li><strong>Free</strong> — 5 datasets, 1,000 API calls/day, basic charts, community support.</li>
                                    <li><strong>Pro ($29/mo)</strong> — Unlimited datasets, 100,000 API calls/day, all chart types, ML predictions, priority support.</li>
                                    <li><strong>Enterprise (Custom)</strong> — Dedicated instance, SSO, custom ML models, SLA, 24/7 support.</li>
                                </ul>
                            </SectionBlock>
                            <SectionBlock title="Payment Process">
                                <p>To upgrade, navigate to Settings → Subscription → "Upgrade." You will be redirected to the <strong>Contact Sales</strong> page where you can submit an inquiry. Our team will process your request and activate your new plan within 24 hours.</p>
                            </SectionBlock>
                        </Accordion>
                    </section>

                    {/* ═══════════ SHORTCUTS ═══════════ */}
                    <section id="shortcuts">
                        <Accordion title="Keyboard Shortcuts" icon={Keyboard}>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {[
                                    ['Ctrl/⌘ + K', 'Open command bar (global search)'],
                                    ['Ctrl/⌘ + /', 'Open help page'],
                                    ['Ctrl/⌘ + B', 'Toggle sidebar'],
                                    ['Ctrl/⌘ + S', 'Save current work'],
                                    ['Esc', 'Close modals and dialogs'],
                                    ['Ctrl/⌘ + Enter', 'Submit forms'],
                                    ['Tab', 'Navigate forward through elements'],
                                    ['Shift + Tab', 'Navigate backward through elements'],
                                ].map(([key, desc]) => (
                                    <div key={key} className="flex items-center justify-between p-2.5 border border-border/30 rounded-lg bg-white/[0.02]">
                                        <span className="text-sm">{desc}</span>
                                        <kbd className="px-2 py-1 text-xs bg-muted rounded font-mono">{key}</kbd>
                                    </div>
                                ))}
                            </div>
                        </Accordion>
                    </section>

                    {/* ═══════════ API REFERENCE ═══════════ */}
                    <section id="api-ref">
                        <Accordion title="API Reference" icon={Code}>
                            <SectionBlock title="Base URL">
                                <code className="block p-3 bg-muted/50 rounded-lg text-sm font-mono">https://api.biz-stratosphere.com/v1</code>
                            </SectionBlock>
                            <SectionBlock title="Authentication">
                                <p className="mb-2">Include your API key in the Authorization header:</p>
                                <code className="block p-3 bg-muted/50 rounded-lg text-sm font-mono">Authorization: Bearer YOUR_API_KEY</code>
                            </SectionBlock>
                            <SectionBlock title="Endpoints">
                                <div className="space-y-2">
                                    {[
                                        ['GET', '/datasets', 'List all datasets in your workspace', 'bg-blue-500/20 text-blue-400'],
                                        ['POST', '/datasets', 'Create/upload a new dataset', 'bg-green-500/20 text-green-400'],
                                        ['GET', '/datasets/:id', 'Get dataset details and rows', 'bg-blue-500/20 text-blue-400'],
                                        ['DELETE', '/datasets/:id', 'Delete a dataset', 'bg-red-500/20 text-red-400'],
                                        ['GET', '/analytics', 'Get aggregated analytics data', 'bg-blue-500/20 text-blue-400'],
                                        ['POST', '/charts', 'Create a chart configuration', 'bg-green-500/20 text-green-400'],
                                        ['POST', '/reports/generate', 'Generate a report', 'bg-green-500/20 text-green-400'],
                                        ['POST', '/predict', 'Make an ML prediction', 'bg-green-500/20 text-green-400'],
                                        ['POST', '/chat', 'Send a message to AI Chat', 'bg-green-500/20 text-green-400'],
                                    ].map(([method, path, desc, color]) => (
                                        <div key={path+method} className="flex items-center gap-3 p-2.5 border border-border/30 rounded-lg">
                                            <Badge className={`${color} text-xs font-mono`}>{method}</Badge>
                                            <code className="flex-1 text-sm font-mono">{path}</code>
                                            <span className="text-xs text-muted-foreground hidden sm:block">{desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </SectionBlock>
                            <SectionBlock title="Error Codes">
                                <ul className="list-disc list-inside space-y-1">
                                    <li><strong>400</strong> — Bad Request (invalid parameters)</li>
                                    <li><strong>401</strong> — Unauthorized (missing or invalid API key)</li>
                                    <li><strong>403</strong> — Forbidden (insufficient permissions)</li>
                                    <li><strong>404</strong> — Not Found</li>
                                    <li><strong>429</strong> — Rate Limit Exceeded</li>
                                    <li><strong>500</strong> — Internal Server Error</li>
                                </ul>
                            </SectionBlock>
                        </Accordion>
                    </section>

                    {/* ═══════════ FAQ ═══════════ */}
                    <section id="faq">
                        <Accordion title="Frequently Asked Questions" icon={HelpCircle}>
                            {[
                                ['How do I upload data?', 'Navigate to the Dashboard and click on the Data Upload area. Drag-and-drop your CSV or JSON file. PII detection runs automatically. Review the results and click Upload to persist. Files are available across all platform features.'],
                                ['What AI models are available?', 'Two pre-trained ML models are included: Churn Predictor (estimates customer churn probability) and Revenue Forecaster (predicts revenue). Both include SHAP explanations. For chat, the platform uses Google Gemini (cloud) or Ollama (local).'],
                                ['Can I export charts and reports?', 'Yes. Charts can be exported as high-resolution PNG images or raw JSON data. Reports can be exported as CSV or JSON. All exports preserve your data, formatting, and customizations.'],
                                ['How does the AI chatbot work?', 'The chatbot uses RAG (Retrieval-Augmented Generation). Your question is converted to a vector embedding, which is used to search your uploaded datasets via pgvector similarity. The top results are passed as context to the LLM, which generates a cited answer.'],
                                ['Is my data secure?', 'Yes. Row Level Security (RLS) ensures data isolation per user. PII is automatically detected. All actions are logged in an immutable audit trail. Data is encrypted at rest (AES-256) and in transit (TLS 1.3). MFA is available for additional account protection.'],
                                ['How do I invite team members?', 'Go to Workspaces, open the settings (gear icon) on your workspace card, enter the team member\'s email, select a role (Admin, Member, or Viewer), and click TRANSMIT. They receive a 7-day invite link.'],
                                ['What are the API rate limits?', 'Free tier: 1,000 requests/hour and 10,000/day. Pro tier: 10,000/hour and 100,000/day. Enterprise: Custom limits. Track your usage on the API Management page.'],
                                ['Can I use local AI models?', 'Yes. Install Ollama on your machine, then go to Settings → AI Configuration and switch the provider to "Ollama." This runs AI inference locally at zero cost with full data privacy.'],
                                ['How do billing and payments work?', 'Upgrades are handled through the Contact Sales page. Submit an inquiry with your plan choice and our team will activate your subscription within 24 hours. The Free tier has no charges.'],
                                ['What happens if I delete a workspace?', 'Deleting a workspace removes all associated datasets, charts, reports, and member access. This action is irreversible. Only workspace owners can delete workspaces.'],
                            ].map(([q, a]) => (
                                <div key={q} className="border-b border-border/20 last:border-0 pb-4 last:pb-0">
                                    <h4 className="font-semibold text-foreground mb-1.5">{q}</h4>
                                    <p>{a}</p>
                                </div>
                            ))}
                        </Accordion>
                    </section>

                    {/* ═══════════ FOOTER ═══════════ */}
                    <Card className="glass border-primary/20 mt-8">
                        <CardContent className="p-6 text-center">
                            <h3 className="font-bold text-lg mb-2">Still Need Help?</h3>
                            <p className="text-sm text-muted-foreground mb-1">
                                Contact us at <strong className="text-primary">d.v.satyanarayana260@gmail.com</strong>
                            </p>
                            <p className="text-xs text-muted-foreground">
                                © 2026 Biz Stratosphere by VenkataSatyanarayana Duba. All rights reserved.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageLayout>
    );
}
