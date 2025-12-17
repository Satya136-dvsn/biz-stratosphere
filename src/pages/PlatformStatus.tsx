import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureBadge } from "@/components/ui/FeatureBadge";
import { CheckCircle2, Beaker, Construction, AlertCircle, BarChart3, Shield, Zap, Database } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/layout/Footer";

export default function PlatformStatus() {
    return (
        <>
            <SEO
                title="Platform Status - Biz Stratosphere"
                description="Transparent view of production-ready, prototype, and planned features in Biz Stratosphere Business Intelligence Platform"
            />

            <div className="min-h-screen bg-gradient-bg py-16 px-4">
                <div className="container mx-auto max-w-6xl space-y-12">
                    {/* Hero Section */}
                    <div className="text-center space-y-6 animate-fade-in-up">
                        <div className="flex justify-center">
                            <img
                                src="/logo-orbit.png"
                                alt="Biz Stratosphere"
                                className="h-20 w-20 rounded-full bg-transparent object-contain drop-shadow-2xl"
                            />
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                            Platform Status
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            Transparent visibility into what's production-ready, what's evolving, and what's on the roadmap
                        </p>
                    </div>

                    {/* Production-Ready Features */}
                    <Card className="border-2 border-green-500/20 shadow-lg">
                        <CardHeader className="bg-green-500/5">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                                <div>
                                    <CardTitle className="text-2xl">Production-Ready</CardTitle>
                                    <CardDescription>Battle-tested, stable, and fully functional</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <FeatureItem
                                    icon={<Shield className="h-5 w-5" />}
                                    title="Authentication & Workspaces"
                                    description="User authentication, multi-workspace support, role-based access control (RBAC), row-level security (RLS)"
                                    badge={<FeatureBadge variant="production" size="sm" />}
                                />

                                <FeatureItem
                                    icon={<Database className="h-5 w-5" />}
                                    title="Data Upload & ETL"
                                    description="CSV and Excel file upload, automatic ETL processing, dual storage strategy (raw + transformed)"
                                    badge={<FeatureBadge variant="production" size="sm" />}
                                />

                                <FeatureItem
                                    icon={<BarChart3 className="h-5 w-5" />}
                                    title="Dashboards & KPIs"
                                    description="Real-time analytics dashboard, KPI monitoring, time-series visualization, export capabilities"
                                    badge={<FeatureBadge variant="production" size="sm" />}
                                />

                                <FeatureItem
                                    icon={<Zap className="h-5 w-5" />}
                                    title="Advanced Charts"
                                    description="8 chart types (bar, line, area, pie, scatter, radar, treemap, funnel), full CSV column access, customization options"
                                    badge={<FeatureBadge variant="production" size="sm" />}
                                />

                                <FeatureItem
                                    icon={<Shield className="h-5 w-5" />}
                                    title="Security Foundations"
                                    description="Row-Level Security (RLS), Multi-Factor Authentication (MFA), AES-256 encryption, GDPR compliance principles"
                                    badge={<FeatureBadge variant="production" size="sm" />}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Prototype Features */}
                    <Card className="border-2 border-amber-500/20 shadow-lg">
                        <CardHeader className="bg-amber-500/5">
                            <div className="flex items-center gap-3">
                                <Beaker className="h-8 w-8 text-amber-600" />
                                <div>
                                    <CardTitle className="text-2xl">Prototype Features</CardTitle>
                                    <CardDescription>Evolving capabilities with ongoing development</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <FeatureItem
                                    icon={<Zap className="h-5 w-5" />}
                                    title="AI Natural Language Queries"
                                    description="Conversational AI for data insights using Google Gemini API. Currently in active development."
                                    badge={<FeatureBadge variant="prototype" size="sm" />}
                                />

                                <FeatureItem
                                    icon={<BarChart3 className="h-5 w-5" />}
                                    title="ML Model Training & Predictions"
                                    description="Machine learning model serving with SHAP explainability. Prototype implementation with MLflow tracking."
                                    badge={<FeatureBadge variant="prototype" size="sm" />}
                                />

                                <FeatureItem
                                    icon={<Zap className="h-5 w-5" />}
                                    title="Automation Rules Engine"
                                    description="Workflow automation and alert rules. Core engine implemented, UI refinement in progress."
                                    badge={<FeatureBadge variant="prototype" size="sm" />}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Planned Features */}
                    <Card className="border-2 border-gray-500/20 shadow-lg">
                        <CardHeader className="bg-gray-500/5">
                            <div className="flex items-center gap-3">
                                <Construction className="h-8 w-8 text-gray-600" />
                                <div>
                                    <CardTitle className="text-2xl">Planned Enhancements</CardTitle>
                                    <CardDescription>On the roadmap for future releases</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <FeatureItem
                                    icon={<Zap className="h-5 w-5" />}
                                    title="AI Chatbot with RAG"
                                    description="Retrieval-Augmented Generation for context-aware business intelligence queries"
                                    badge={<FeatureBadge variant="planned" size="sm" />}
                                />

                                <FeatureItem
                                    icon={<BarChart3 className="h-5 w-5" />}
                                    title="Observability & Monitoring Dashboard"
                                    description="System health metrics, performance monitoring, and operational insights"
                                    badge={<FeatureBadge variant="planned" size="sm" />}
                                />

                                <FeatureItem
                                    icon={<Shield className="h-5 w-5" />}
                                    title="Data Retention & Compliance Tools"
                                    description="Automated data lifecycle management, compliance reporting, and audit trails"
                                    badge={<FeatureBadge variant="planned" size="sm" />}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* CSV Capability Transparency */}
                    <Card className="border-2 border-blue-500/20 shadow-lg">
                        <CardHeader className="bg-blue-500/5">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-8 w-8 text-blue-600" />
                                <div>
                                    <CardTitle className="text-2xl">CSV Capability & Limitations</CardTitle>
                                    <CardDescription>Transparent specifications for data processing</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Scale Limits</h3>
                                    <div className="space-y-2 text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-600 font-bold">✓</span>
                                            <span><strong>Sweet spot:</strong> 1–10K rows (excellent performance)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-amber-600 font-bold">⚠</span>
                                            <span><strong>Acceptable:</strong> 10K–50K rows (performance limitations apply)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-red-600 font-bold">✗</span>
                                            <span><strong>Not recommended:</strong> 50K+ rows (timeouts / display limits likely)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="font-semibold text-lg mb-2">Advanced Charts Limits</h3>
                                    <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                                        <li>Maximum 500 rows fetched per query</li>
                                        <li>No pagination currently available</li>
                                        <li>Chart performance degrades beyond ~1000 data points</li>
                                        <li><em>Pagination and sampling features planned for future release</em></li>
                                    </ul>
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="font-semibold text-lg mb-2">Data Validation Behavior</h3>
                                    <p className="text-muted-foreground mb-2">
                                        Some invalid rows may be skipped during ingestion; a detailed validation report is planned.
                                    </p>
                                    <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                                        <li>Bad dates fall back to current timestamp</li>
                                        <li>Non-numeric values in numeric fields are skipped</li>
                                        <li>Outliers are not automatically detected</li>
                                        <li className="font-semibold">Recommendation: Clean data before upload for best results</li>
                                    </ul>
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="font-semibold text-lg mb-2">Geo Data Handling</h3>
                                    <p className="text-muted-foreground">
                                        Latitude/Longitude columns are accepted and stored. Scatter plots are possible for coordinate visualization.
                                        <br />
                                        <strong>Note:</strong> Map visualization (Leaflet/Mapbox) is planned but not yet implemented.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Disclaimer */}
                    <Card className="border-2 bg-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                            <div className="space-y-4 text-center">
                                <p className="text-lg font-medium leading-relaxed">
                                    "Biz Stratosphere is a production-ready BI core with advanced visualization.
                                    AI and automation features are evolving incrementally."
                                </p>
                                <p className="text-muted-foreground">
                                    "The platform is intentionally optimized for analytical clarity over raw data volume at this stage."
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Footer Links */}
                    <div className="text-center space-y-4 pt-8">
                        <div className="flex flex-wrap justify-center gap-6 text-sm">
                            <a href="/" className="text-primary hover:underline font-medium">
                                ← Back to Home
                            </a>
                            <a href="/dashboard" className="text-primary hover:underline font-medium">
                                View Dashboard
                            </a>
                            <a href="/auth" className="text-primary hover:underline font-medium">
                                Get Started
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <Footer />
        </>
    );
}

interface FeatureItemProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    badge: React.ReactNode;
}

function FeatureItem({ icon, title, description, badge }: FeatureItemProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-start gap-3">
                <div className="mt-1 text-primary">{icon}</div>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{title}</h3>
                        {badge}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
            </div>
        </div>
    );
}
