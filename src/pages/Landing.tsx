import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Users, TrendingUp, Zap, Shield, Globe, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-bg">
            {/* Hero Section */}
            <section className="container mx-auto px-4 pt-24 pb-40">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center space-y-10 animate-fade-in-up">
                        {/* Logo - Clean Icon Only */}
                        <div className="flex justify-center mb-12">
                            <img
                                src="/logo-orbit.png"
                                alt="Biz Stratosphere"
                                className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-transparent object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
                            />
                        </div>

                        <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-tight">
                            Elevate Your Business
                            <br />
                            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
                                Intelligence
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
                            Data insights that reach the stratosphere. Make data-driven decisions with
                            AI-powered analytics, real-time dashboards, and enterprise-grade intelligence.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center pt-12">
                            <Link to="/auth">
                                <Button
                                    size="lg"
                                    className="text-lg px-10 py-7 shadow-glow-primary hover:shadow-glow-secondary transition-all duration-300 hover:scale-105"
                                >
                                    Get Started Free
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Button
                                size="lg"
                                variant="outline"
                                className="text-lg px-10 py-7 glass hover:bg-primary/10 transition-all duration-300"
                            >
                                <Sparkles className="mr-2 h-5 w-5" />
                                Watch Demo
                            </Button>
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
                            title="Real-time Analytics"
                            description="Track revenue, customers, churn, and growth with live dashboards and KPI metrics."
                        />
                        <FeatureCard
                            icon={<Zap className="h-10 w-10" />}
                            title="AI-Powered Insights"
                            description="Get intelligent recommendations with Gemini AI and local ML models at zero cost."
                        />
                        <FeatureCard
                            icon={<Users className="h-10 w-10" />}
                            title="Team Collaboration"
                            description="Multi-workspace support with role-based access control for your entire team."
                        />
                        <FeatureCard
                            icon={<TrendingUp className="h-10 w-10" />}
                            title="Growth Tracking"
                            description="Monitor conversion rates, deal sizes, and trends with advanced visualizations."
                        />
                        <FeatureCard
                            icon={<Shield className="h-10 w-10" />}
                            title="Enterprise Security"
                            description="GDPR compliant with PII detection, data isolation, and secure API access."
                        />
                        <FeatureCard
                            icon={<Globe className="h-10 w-10" />}
                            title="Public API"
                            description="Integrate your data with webhooks, REST API, and automated workflows."
                        />
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
        </div>
    );
}

function FeatureCard({ icon, title, description }: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="glass rounded-2xl p-8 hover-lift transition-all duration-300 hover:shadow-glow-primary group">
            <div className="text-primary mb-6 transform group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{title}</h3>
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
