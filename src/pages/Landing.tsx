import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Users, TrendingUp, Zap, Shield, Globe, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-bg">
            {/* Hero Section */}
            <section className="container mx-auto px-4 pt-24 pb-40">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center space-y-10 animate-fade-in-up">
                        {/* Logo - Matching Sidebar Design */}
                        <div className="flex justify-center items-center gap-4 mb-12">
                            <img
                                src="/logo-orbit.png"
                                alt="Biz Stratosphere"
                                className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-transparent object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
                            />
                            <div className="text-left">
                                <h2 className="text-3xl md:text-4xl font-bold text-foreground">Biz Stratosphere</h2>
                                <p className="text-sm md:text-base text-muted-foreground font-medium">Analytics</p>
                            </div>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-tight">
                            Turn Business Data into
                            <br />
                            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
                                Actionable Insights — Faster.
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
                            Production-ready BI platform with advanced dashboards, secure multi-workspace collaboration,
                            and evolving AI-assisted analytics. Built for clarity, security, and scale.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center pt-12">
                            <Link to="/dashboard">
                                <Button
                                    size="lg"
                                    className="text-lg px-10 py-7 shadow-glow-primary hover:shadow-glow-secondary transition-all duration-300 hover:scale-105"
                                >
                                    Explore Demo Workspace
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link to="/platform-status">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="text-lg px-10 py-7 glass hover:bg-primary/10 transition-all duration-300"
                                >
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    Platform Status
                                </Button>
                            </Link>
                        </div>

                        <div className="pt-12 flex flex-wrap items-center justify-center gap-8 text-sm">
                            <div className="flex items-center gap-2 glass rounded-full px-6 py-3 hover-lift">
                                <Shield className="h-5 w-5 text-success" />
                                <span className="font-semibold">GDPR Compliant</span>
                            </div>
                            <div className="flex items-center gap-2 glass rounded-full px-6 py-3 hover-lift">
                                <Zap className="h-5 w-5 text-warning" />
                                <span className="font-semibold">$0/month Cost</span>
                            </div>
                            <div className="flex items-center gap-2 glass rounded-full px-6 py-3 hover-lift">
                                <Globe className="h-5 w-5 text-info" />
                                <span className="font-semibold">Enterprise Ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="container mx-auto px-4 py-24">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20 animate-fade-in">
                        <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                            Everything You Need to Grow
                        </h2>
                        <p className="text-xl text-muted-foreground font-medium">
                            Powerful features for modern businesses
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<BarChart3 className="h-10 w-10" />}
                            title="Dashboards & KPIs"
                            description="Real-time analytics dashboards with live KPI monitoring, time-series charts, and export capabilities (PDF, Excel, PNG)."
                        />
                        <FeatureCard
                            icon={<Zap className="h-10 w-10" />}
                            title="Advanced Custom Charts"
                            description="8 chart types with full CSV column access: bar, line, area, pie, scatter, radar, treemap, and funnel charts."
                        />
                        <FeatureCard
                            icon={<Users className="h-10 w-10" />}
                            title="Secure Multi-Workspace Collaboration"
                            description="Role-based access control (RBAC), row-level security (RLS), and multi-tenant workspace management."
                        />
                        <FeatureCard
                            icon={<Shield className="h-10 w-10" />}
                            title="Enterprise Security"
                            description="MFA authentication, AES-256 encryption, GDPR compliance principles, and secure data isolation."
                            badge="✅"
                        />
                        <FeatureCard
                            icon={<TrendingUp className="h-10 w-10" />}
                            title="AI-Assisted Insights"
                            description="Natural language queries and ML predictions with SHAP explainability (prototype stage)."
                            badge="🧪"
                        />
                        <FeatureCard
                            icon={<Globe className="h-10 w-10" />}
                            title="Data Upload & ETL"
                            description="CSV and Excel file upload with automatic ETL processing and dual storage strategy."
                        />
                    </div>
                </div>
            </section>

            {/* Architecture / Trust Section */}
            <section className="container mx-auto px-4 py-24">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Built on Enterprise-Grade Technology
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8 text-left">
                        <div className="glass rounded-xl p-6 space-y-3">
                            <h3 className="font-bold text-xl">Modern Stack</h3>
                            <p className="text-muted-foreground">
                                React 18, TypeScript 5, Supabase, PostgreSQL 14+
                            </p>
                        </div>
                        <div className="glass rounded-xl p-6 space-y-3">
                            <h3 className="font-bold text-xl">Secure by Design</h3>
                            <p className="text-muted-foreground">
                                Multi-tenant, Row-Level Security, AES-256 encryption
                            </p>
                        </div>
                        <div className="glass rounded-xl p-6 space-y-3">
                            <h3 className="font-bold text-xl">Scalable</h3>
                            <p className="text-muted-foreground">
                                Designed for enterprise BI workflows and team collaboration
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Roadmap Preview Section */}
            <section className="container mx-auto px-4 py-24 bg-secondary/10">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">What's Next</h2>
                        <p className="text-xl text-muted-foreground">Our roadmap for AI-native analytics</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="glass rounded-xl p-6 border-l-4 border-primary space-y-2">
                            <h3 className="font-bold text-lg">AI Query Hardening</h3>
                            <p className="text-sm text-muted-foreground">
                                Enhanced RAG capabilities and context-aware responses
                            </p>
                        </div>
                        <div className="glass rounded-xl p-6 border-l-4 border-secondary space-y-2">
                            <h3 className="font-bold text-lg">Automation & Alerts</h3>
                            <p className="text-sm text-muted-foreground">
                                Workflow automation and intelligent alerting system
                            </p>
                        </div>
                        <div className="glass rounded-xl p-6 border-l-4 border-accent space-y-2">
                            <h3 className="font-bold text-lg">RAG-based Chat Assistant</h3>
                            <p className="text-sm text-muted-foreground">
                                Vector-powered knowledge base for deep business insights
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-24 bg-primary/5 backdrop-blur-sm">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-4 gap-12 text-center">
                            <StatCard value="$0" label="Monthly Cost" />
                            <StatCard value="100%" label="Platform Complete" />
                            <StatCard value="90+" label="Components Built" />
                            <StatCard value="15+" label="Pages & Features" />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-4 py-40">
                <div className="max-w-4xl mx-auto text-center space-y-10 glass-strong rounded-2xl p-16 shadow-2xl hover-lift">
                    <h2 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        Ready to Reach the Stratosphere?
                    </h2>
                    <p className="text-2xl text-muted-foreground font-medium">
                        Join businesses using AI-powered intelligence to make better decisions.
                    </p>
                    <Link to="/auth">
                        <Button
                            size="lg"
                            className="text-xl px-16 py-8 shadow-glow-primary hover:shadow-glow-secondary transition-all duration-300 hover:scale-105 mt-8"
                        >
                            Start Your Free Trial
                            <ArrowRight className="ml-3 h-6 w-6" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
}

function FeatureCard({ icon, title, description, badge }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    badge?: string;
}) {
    return (
        <div className="glass rounded-2xl p-8 hover-lift transition-all duration-300 hover:shadow-glow-primary group">
            <div className="text-primary mb-6 transform group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{title}</h3>
                {badge && <span className="text-lg">{badge}</span>}
            </div>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
    );
}

function StatCard({ value, label }: { value: string; label: string }) {
    return (
        <div className="space-y-3">
            <div className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {value}
            </div>
            <div className="text-lg text-muted-foreground font-semibold">{label}</div>
        </div>
    );
}
