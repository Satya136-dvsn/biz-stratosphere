// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    BarChart3,
    Users,
    TrendingUp,
    Zap,
    Shield,
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
        <div className="min-h-screen bg-[hsl(220_20%_5%)]">
            {/* ─── Nav ─── */}
            <nav className="fixed top-0 w-full z-50 bg-[hsl(220_20%_5%/0.85)] backdrop-blur-xl border-b border-[hsl(220_16%_12%)]">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-14">
                        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                            <img
                                src="/logo-orbit.png"
                                alt="Biz Stratosphere"
                                className="h-8 w-8 rounded-lg object-contain"
                            />
                            <span className="text-sm font-bold text-foreground tracking-tight hidden sm:block">
                                Biz Stratosphere
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-muted-foreground">
                            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                            <a href="#decision-memory" className="hover:text-foreground transition-colors">Decision Memory™</a>
                            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link to="/auth">
                                <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground hover:text-foreground h-8">
                                    Sign In
                                </Button>
                            </Link>
                            <Link to="/auth">
                                <Button size="sm" className="text-[13px] h-8 bg-primary hover:bg-primary/90 text-white">
                                    Start Free
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ─── Hero ─── */}
            <section className="relative container mx-auto px-4 pt-32 pb-24 overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-40 left-1/3 w-[300px] h-[300px] bg-secondary/4 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-4xl mx-auto relative">
                    <div className="text-center space-y-6 animate-fade-in-up">
                        {/* Tag */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[12px] font-semibold">
                            <Sparkles className="h-3 w-3" />
                            Built for SaaS teams who outgrew spreadsheets
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                            Know{' '}
                            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
                                why
                            </span>{' '}
                            your metrics change.
                            <br />
                            <span className="text-muted-foreground/40">Not just that they changed.</span>
                        </h1>

                        <p className="text-base md:text-lg text-muted-foreground/70 max-w-2xl mx-auto leading-relaxed">
                            Biz Stratosphere is the BI platform with{' '}
                            <strong className="text-foreground font-semibold">Decision Memory™</strong> — it remembers every prediction,
                            every action, and every outcome so your team never repeats the same mistake twice.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                            <Link to="/dashboard">
                                <Button size="lg" className="text-sm px-6 py-5 bg-primary hover:bg-primary/90 text-white shadow-glow-primary transition-all duration-200 hover:-translate-y-0.5">
                                    Try Live Demo
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <a href="#pricing">
                                <Button size="lg" variant="outline" className="text-sm px-6 py-5 border-[hsl(220_16%_18%)] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-200">
                                    View Pricing
                                </Button>
                            </a>
                        </div>

                        {/* Trust badges */}
                        <div className="pt-8 flex flex-wrap items-center justify-center gap-4 text-[12px]">
                            {[
                                { icon: Shield, label: "SOC 2 Ready", color: "text-emerald-400" },
                                { icon: Brain, label: "AI-Powered SHAP", color: "text-primary" },
                                { icon: Clock, label: "5-min Setup", color: "text-amber-400" },
                            ].map(({ icon: Icon, label, color }) => (
                                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(220_16%_14%)] bg-[hsl(220_18%_7%)] text-muted-foreground">
                                    <Icon className={cn("h-3 w-3", color)} />
                                    <span className="font-medium">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Decision Memory™ ─── */}
            <section id="decision-memory" className="container mx-auto px-4 py-20">
                <div className="max-w-5xl mx-auto rounded-2xl border border-[hsl(220_16%_14%)] bg-[hsl(220_18%_7%)] p-8 md:p-14 relative overflow-hidden">
                    {/* Glow */}
                    <div className="absolute -top-24 -right-24 w-56 h-56 bg-primary/6 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-secondary/5 rounded-full blur-[80px] pointer-events-none" />

                    <div className="relative grid md:grid-cols-2 gap-10 items-center">
                        <div className="space-y-5">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[11px] font-semibold">
                                <Lightbulb className="h-3 w-3" />
                                Exclusive Feature
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                                Decision Memory™
                            </h2>
                            <p className="text-muted-foreground/70 leading-relaxed">
                                Every AI prediction comes with context: what was the input, what did the model say,
                                what did your team <em>actually do</em>, and what happened next.
                            </p>
                            <ul className="space-y-2.5">
                                {[
                                    'Full audit trail of every AI-assisted decision',
                                    'Compare predicted vs actual outcomes over time',
                                    'Learn from past decisions to improve future ones',
                                    'Export decision logs for compliance & governance',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-xl border border-[hsl(220_16%_14%)] bg-[hsl(220_20%_5.5%)] p-5 space-y-3">
                            <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold">
                                Sample Decision Log
                            </div>
                            <DecisionLogEntry
                                model="Churn Predictor v2.1"
                                prediction="82% likely to churn"
                                action="Offered 20% discount"
                                outcome="Customer retained"
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
            </section>

            {/* ─── Features ─── */}
            <section id="features" className="container mx-auto px-4 py-20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                            Enterprise BI, minus the enterprise price tag
                        </h2>
                        <p className="text-muted-foreground/60 max-w-xl mx-auto">
                            Built for SaaS ops teams, revenue analysts, and growth leads who need real answers.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <FeatureCard icon={<BarChart3 className="h-5 w-5" />} title="Live Dashboards" description="KPI monitoring with 8 chart types, real-time data sync, and one-click PDF/Excel exports." />
                        <FeatureCard icon={<Brain className="h-5 w-5" />} title="AI Explainability" description="SHAP waterfall charts show exactly why the model predicted what it did." badge="NEW" />
                        <FeatureCard icon={<Users className="h-5 w-5" />} title="Multi-Workspace" description="Row-level security, RBAC, and tenant isolation. Every team sees only their data." />
                        <FeatureCard icon={<Shield className="h-5 w-5" />} title="Compliance Ready" description="AES-256 encryption, MFA, audit logging, and GDPR-aligned data governance." />
                        <FeatureCard icon={<TrendingUp className="h-5 w-5" />} title="Churn & Revenue ML" description="Pre-built models for churn prediction and revenue forecasting. Retrain on your data." />
                        <FeatureCard icon={<Zap className="h-5 w-5" />} title="Automation Rules" description="If-then triggers that fire webhooks, send alerts, or log decisions — on your schedule." />
                    </div>
                </div>
            </section>

            {/* ─── Pricing ─── */}
            <section id="pricing" className="container mx-auto px-4 py-20">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                            Simple, transparent pricing
                        </h2>
                        <p className="text-muted-foreground/60">Start free. Scale when you're ready.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <PricingCard
                            tier="Starter" price="$0" period="forever"
                            description="For solo founders exploring their data"
                            features={['1 workspace', '5 dashboards', 'CSV upload (10 MB)', 'Basic charts', 'Community support']}
                            cta="Get Started" ctaLink="/auth"
                        />
                        <PricingCard
                            tier="Growth" price="$49" period="/month"
                            description="For SaaS teams who need AI insights"
                            features={['5 workspaces', 'Unlimited dashboards', 'CSV + Excel upload (100 MB)', 'AI predictions + SHAP', 'Decision Memory™', 'Automation rules', 'Priority support']}
                            cta="Start 14-Day Trial" ctaLink="/auth" highlighted
                        />
                        <PricingCard
                            tier="Enterprise" price="Custom" period=""
                            description="For orgs with compliance & scale needs"
                            features={['Unlimited workspaces', 'SSO + SAML', 'Dedicated instance', 'Custom ML models', 'SLA guarantee', 'On-prem option', 'White-glove onboarding']}
                            cta="Contact Sales" ctaLink="/contact-sales"
                        />
                    </div>
                </div>
            </section>

            {/* ─── Stats ─── */}
            <section className="py-16 border-y border-[hsl(220_16%_12%)] bg-[hsl(220_18%_6%)]">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <StatCard value="< 5 min" label="Time to First Dashboard" />
                        <StatCard value="99.9%" label="Uptime SLA" />
                        <StatCard value="256-bit" label="AES Encryption" />
                        <StatCard value="100%" label="Explainable AI" />
                    </div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="container mx-auto px-4 py-24">
                <div className="max-w-3xl mx-auto text-center rounded-2xl border border-[hsl(220_16%_14%)] bg-[hsl(220_18%_7%)] p-10 md:p-14 relative overflow-hidden">
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/6 rounded-full blur-[100px] pointer-events-none" />
                    <div className="relative space-y-5">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                            Stop guessing.{' '}
                            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                Start knowing.
                            </span>
                        </h2>
                        <p className="text-muted-foreground/60 max-w-lg mx-auto">
                            Join SaaS teams who use Decision Memory™ to make smarter, faster, evidence-based decisions.
                        </p>
                        <Link to="/auth">
                            <Button size="lg" className="text-sm px-8 py-5 bg-primary hover:bg-primary/90 text-white shadow-glow-primary mt-2 transition-all duration-200 hover:-translate-y-0.5">
                                Start Your Free Trial
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

/* ═══════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════ */

function FeatureCard({ icon, title, description, badge }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    badge?: string;
}) {
    return (
        <div className="group rounded-xl border border-[hsl(220_16%_14%)] bg-[hsl(220_18%_7%)] p-6 transition-all duration-200 hover:border-[hsl(220_16%_20%)] hover:-translate-y-0.5">
            <div className="text-primary mb-4">{icon}</div>
            <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
                {badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-[13px] text-muted-foreground/60 leading-relaxed">{description}</p>
        </div>
    );
}

function PricingCard({
    tier, price, period, description, features, cta, ctaLink, highlighted = false,
}: {
    tier: string; price: string; period: string; description: string;
    features: string[]; cta: string; ctaLink: string; highlighted?: boolean;
}) {
    return (
        <div className={cn(
            'rounded-xl p-6 flex flex-col transition-all duration-200',
            highlighted
                ? 'border-2 border-primary/30 bg-[hsl(220_18%_8%)] shadow-glow-primary'
                : 'border border-[hsl(220_16%_14%)] bg-[hsl(220_18%_7%)]'
        )}>
            {highlighted && (
                <div className="inline-flex items-center gap-1 self-start mb-3 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    <Star className="h-3 w-3" />
                    Most Popular
                </div>
            )}
            <h3 className="text-lg font-bold">{tier}</h3>
            <p className="text-[12px] text-muted-foreground/50 mt-0.5 mb-4">{description}</p>
            <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-bold font-mono">{price}</span>
                {period && <span className="text-muted-foreground/50 text-sm">{period}</span>}
            </div>
            <ul className="space-y-2 mb-6 flex-1">
                {features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>
            <Link to={ctaLink}>
                <Button
                    className={cn(
                        'w-full text-[13px]',
                        highlighted
                            ? 'bg-primary hover:bg-primary/90 text-white'
                            : ''
                    )}
                    variant={highlighted ? 'default' : 'outline'}
                >
                    {cta}
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
            </Link>
        </div>
    );
}

function DecisionLogEntry({
    model, prediction, action, outcome, confidence,
}: {
    model: string; prediction: string; action: string; outcome: string; confidence: number;
}) {
    return (
        <div className="p-3 rounded-lg border border-[hsl(220_16%_14%)] bg-[hsl(220_18%_7%)] space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-[13px]">{model}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[hsl(220_16%_18%)] text-muted-foreground">
                    {confidence}%
                </span>
            </div>
            <p className="text-muted-foreground/60 text-[12px]">
                <span className="text-primary font-medium">Predicted:</span> {prediction}
            </p>
            <p className="text-muted-foreground/60 text-[12px]">
                <span className="text-secondary font-medium">Action:</span> {action}
            </p>
            <div className="flex items-center gap-1.5 pt-0.5">
                <Check className="h-3 w-3 text-emerald-400" />
                <p className="text-emerald-400 text-[11px] font-semibold">{outcome}</p>
            </div>
        </div>
    );
}

function StatCard({ value, label }: { value: string; label: string }) {
    return (
        <div className="space-y-1.5">
            <div className="text-2xl md:text-3xl font-bold font-mono bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {value}
            </div>
            <div className="text-[11px] text-muted-foreground/50 font-medium">{label}</div>
        </div>
    );
}
