// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowRight,
    BarChart3,
    Users,
    TrendingUp,
    Zap,
    Shield,
    Globe,
    Sparkles,
    Brain,
    Check,
    Star,
    Clock,
    Lightbulb,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { cn } from '@/lib/utils';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-bg">
            {/* Navigation Header */}
            <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <img
                                src="/logo-orbit.png"
                                alt="Biz Stratosphere"
                                className="h-10 w-10 rounded-full object-contain drop-shadow-lg"
                            />
                            <div className="hidden sm:block">
                                <h2 className="text-xl font-bold text-foreground">Biz Stratosphere</h2>
                            </div>
                        </Link>

                        {/* Nav Links */}
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                            <a href="#decision-memory" className="hover:text-foreground transition-colors">Decision Memory™</a>
                            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link to="/auth">
                                <Button
                                    variant="ghost"
                                    className="text-sm font-medium hover:text-primary transition-colors"
                                >
                                    Sign In
                                </Button>
                            </Link>
                            <Link to="/auth">
                                <Button
                                    size="sm"
                                    className="shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                                >
                                    Start Free
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ─── Hero Section ─────────────────────────────────── */}
            <section className="container mx-auto px-4 pt-32 pb-28">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center space-y-8 animate-fade-in-up">
                        {/* ICP Tag */}
                        <Badge variant="outline" className="text-sm px-4 py-1.5 border-primary/40 text-primary font-semibold">
                            Built for SaaS teams who outgrew spreadsheets
                        </Badge>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
                            Know <em className="not-italic bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">why</em> your metrics change.
                            <br />
                            Not just <em className="not-italic text-muted-foreground/70">that</em> they changed.
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Biz Stratosphere is the BI platform with <strong className="text-foreground">Decision Memory™</strong> — it remembers every prediction, every action, and every outcome so your team never repeats the same mistake twice.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Link to="/dashboard">
                                <Button
                                    size="lg"
                                    className="text-lg px-8 py-6 shadow-glow-primary hover:shadow-glow-secondary transition-all duration-300 hover:scale-105"
                                >
                                    Try Live Demo
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <a href="#pricing">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="text-lg px-8 py-6 glass hover:bg-primary/10 transition-all duration-300"
                                >
                                    View Pricing
                                </Button>
                            </a>
                        </div>

                        {/* Social Proof Badges */}
                        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2 glass rounded-full px-5 py-2.5 hover-lift">
                                <Shield className="h-4 w-4 text-success" />
                                <span className="font-medium">SOC 2 Ready</span>
                            </div>
                            <div className="flex items-center gap-2 glass rounded-full px-5 py-2.5 hover-lift">
                                <Brain className="h-4 w-4 text-primary" />
                                <span className="font-medium">AI-Powered SHAP</span>
                            </div>
                            <div className="flex items-center gap-2 glass rounded-full px-5 py-2.5 hover-lift">
                                <Clock className="h-4 w-4 text-warning" />
                                <span className="font-medium">5-min Setup</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Decision Memory™ Highlight ────────────────────── */}
            <section id="decision-memory" className="container mx-auto px-4 py-20">
                <div className="max-w-5xl mx-auto glass-strong rounded-3xl p-10 md:p-16 shadow-2xl relative overflow-hidden">
                    {/* Glow */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />

                    <div className="relative grid md:grid-cols-2 gap-10 items-center">
                        <div className="space-y-6">
                            <Badge className="bg-primary/15 text-primary border-primary/30 text-sm">
                                <Lightbulb className="h-3 w-3 mr-1" />
                                Exclusive Feature
                            </Badge>
                            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                                Decision Memory™
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Every AI prediction comes with context: what was the input, what did the model say, what did your team <em>actually do</em>, and what happened next.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Full audit trail of every AI-assisted decision',
                                    'Compare predicted vs actual outcomes over time',
                                    'Learn from past decisions to improve future ones',
                                    'Export decision logs for compliance & governance',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm">
                                        <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="glass rounded-2xl p-6 space-y-4 border border-primary/20">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Sample Decision Log</div>
                            <div className="space-y-3">
                                <DecisionLogEntry
                                    model="Churn Predictor v2.1"
                                    prediction="82% likely to churn"
                                    action="Offered 20% discount"
                                    outcome="Customer retained ✓"
                                    confidence={82}
                                />
                                <DecisionLogEntry
                                    model="Revenue Forecaster"
                                    prediction="$124K next quarter"
                                    action="Increased ad spend by 15%"
                                    outcome="Actual: $131K (+5.6%)"
                                    confidence={76}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Features Grid ──────────────────────────────────── */}
            <section id="features" className="container mx-auto px-4 py-20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16 animate-fade-in">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Enterprise BI, minus the enterprise price tag
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Built for SaaS ops teams, revenue analysts, and growth leads who need real answers — not dashboards full of vanity metrics.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={<BarChart3 className="h-8 w-8" />}
                            title="Live Dashboards"
                            description="KPI monitoring with 8 chart types, real-time data sync, and one-click PDF/Excel exports."
                        />
                        <FeatureCard
                            icon={<Brain className="h-8 w-8" />}
                            title="AI Explainability"
                            description="SHAP waterfall charts show exactly why the model predicted what it did — no black boxes."
                            badge="NEW"
                        />
                        <FeatureCard
                            icon={<Users className="h-8 w-8" />}
                            title="Multi-Workspace"
                            description="Row-level security, RBAC, and tenant isolation. Every team sees only their data."
                        />
                        <FeatureCard
                            icon={<Shield className="h-8 w-8" />}
                            title="Compliance Ready"
                            description="AES-256 encryption, MFA, audit logging, and GDPR-aligned data governance."
                        />
                        <FeatureCard
                            icon={<TrendingUp className="h-8 w-8" />}
                            title="Churn & Revenue ML"
                            description="Pre-built models for churn prediction and revenue forecasting. Retrain on your data."
                        />
                        <FeatureCard
                            icon={<Zap className="h-8 w-8" />}
                            title="Automation Rules"
                            description="If-then triggers that fire webhooks, send alerts, or log decisions — on your schedule."
                        />
                    </div>
                </div>
            </section>

            {/* ─── Pricing Section ────────────────────────────────── */}
            <section id="pricing" className="container mx-auto px-4 py-20">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16 animate-fade-in">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Simple, transparent pricing
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Start free. Scale when you're ready.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <PricingCard
                            tier="Starter"
                            price="$0"
                            period="forever"
                            description="For solo founders exploring their data"
                            features={[
                                '1 workspace',
                                '5 dashboards',
                                'CSV upload (10 MB)',
                                'Basic charts',
                                'Community support',
                            ]}
                            cta="Get Started"
                            ctaLink="/auth"
                        />
                        <PricingCard
                            tier="Growth"
                            price="$49"
                            period="/month"
                            description="For SaaS teams who need AI insights"
                            features={[
                                '5 workspaces',
                                'Unlimited dashboards',
                                'CSV + Excel upload (100 MB)',
                                'AI predictions + SHAP',
                                'Decision Memory™',
                                'Automation rules',
                                'Priority support',
                            ]}
                            cta="Start 14-Day Trial"
                            ctaLink="/auth"
                            highlighted
                        />
                        <PricingCard
                            tier="Enterprise"
                            price="Custom"
                            period=""
                            description="For orgs with compliance & scale needs"
                            features={[
                                'Unlimited workspaces',
                                'SSO + SAML',
                                'Dedicated instance',
                                'Custom ML models',
                                'SLA guarantee',
                                'On-prem option',
                                'White-glove onboarding',
                            ]}
                            cta="Contact Sales"
                            ctaLink="mailto:d.v.satyanarayana260@gmail.com"
                        />
                    </div>
                </div>
            </section>

            {/* ─── Social Proof Stats ─────────────────────────────── */}
            <section className="py-20 bg-primary/5 backdrop-blur-sm">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            <StatCard value="< 5 min" label="Time to First Dashboard" />
                            <StatCard value="99.9%" label="Uptime SLA" />
                            <StatCard value="256-bit" label="AES Encryption" />
                            <StatCard value="100%" label="Explainable AI" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── CTA Section ────────────────────────────────────── */}
            <section className="container mx-auto px-4 py-28">
                <div className="max-w-4xl mx-auto text-center space-y-8 glass-strong rounded-2xl p-12 md:p-16 shadow-2xl hover-lift">
                    <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        Stop guessing. Start knowing.
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Join SaaS teams who use Decision Memory™ to make smarter, faster, evidence-based decisions.
                    </p>
                    <Link to="/auth">
                        <Button
                            size="lg"
                            className="text-lg px-12 py-7 shadow-glow-primary hover:shadow-glow-secondary transition-all duration-300 hover:scale-105 mt-4"
                        >
                            Start Your Free Trial
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════ */

function FeatureCard({ icon, title, description, badge }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    badge?: string;
}) {
    return (
        <div className="glass rounded-2xl p-7 hover-lift transition-all duration-300 hover:shadow-glow-primary group">
            <div className="text-primary mb-5 transform group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{title}</h3>
                {badge && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/40 text-primary">
                        {badge}
                    </Badge>
                )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
    );
}

function PricingCard({
    tier,
    price,
    period,
    description,
    features,
    cta,
    ctaLink,
    highlighted = false,
}: {
    tier: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    cta: string;
    ctaLink: string;
    highlighted?: boolean;
}) {
    return (
        <div
            className={cn(
                'rounded-2xl p-7 flex flex-col transition-all duration-300',
                highlighted
                    ? 'glass-strong border-2 border-primary/50 shadow-glow-primary scale-[1.03]'
                    : 'glass border border-border/30 hover-lift'
            )}
        >
            {highlighted && (
                <Badge className="bg-primary text-primary-foreground self-start mb-4 text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                </Badge>
            )}
            <h3 className="text-xl font-bold">{tier}</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">{description}</p>
            <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">{price}</span>
                {period && <span className="text-muted-foreground text-sm">{period}</span>}
            </div>
            <ul className="space-y-2.5 mb-8 flex-1">
                {features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-success shrink-0" />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>
            <Link to={ctaLink}>
                <Button
                    className={cn(
                        'w-full',
                        highlighted
                            ? 'shadow-md hover:shadow-lg'
                            : 'variant-outline'
                    )}
                    variant={highlighted ? 'default' : 'outline'}
                >
                    {cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
        </div>
    );
}

function DecisionLogEntry({
    model,
    prediction,
    action,
    outcome,
    confidence,
}: {
    model: string;
    prediction: string;
    action: string;
    outcome: string;
    confidence: number;
}) {
    return (
        <div className="p-3 bg-muted/30 rounded-lg space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{model}</span>
                <Badge variant="outline" className="text-[10px]">{confidence}%</Badge>
            </div>
            <p className="text-muted-foreground">
                <span className="text-primary">Predicted:</span> {prediction}
            </p>
            <p className="text-muted-foreground">
                <span className="text-secondary">Action:</span> {action}
            </p>
            <p className="text-success text-xs font-medium">{outcome}</p>
        </div>
    );
}

function StatCard({ value, label }: { value: string; label: string }) {
    return (
        <div className="space-y-2">
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {value}
            </div>
            <div className="text-sm text-muted-foreground font-medium">{label}</div>
        </div>
    );
}
