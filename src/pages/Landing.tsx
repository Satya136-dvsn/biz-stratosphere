import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Users, TrendingUp, Zap, Shield, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
            {/* Hero Section */}
            <section className="container mx-auto px-4 pt-20 pb-32">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center space-y-8">
                        <div className="inline-block">
                            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
                                🚀 AI-Powered Business Intelligence Platform
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                            Elevate Your Business
                            <br />
                            <span className="bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent">
                                Intelligence
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                            Data insights that reach the stratosphere. Make data-driven decisions with
                            AI-powered analytics, real-time dashboards, and enterprise-grade intelligence.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                            <Link to="/auth">
                                <Button size="lg" className="text-lg px-8 py-6">
                                    Get Started Free
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                                Watch Demo
                            </Button>
                        </div>

                        <div className="pt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-green-500" />
                                <span>GDPR Compliant</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-yellow-500" />
                                <span>$0/month Cost</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-blue-500" />
                                <span>Enterprise Ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="container mx-auto px-4 py-20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Everything You Need to Grow</h2>
                        <p className="text-xl text-muted-foreground">
                            Powerful features for modern businesses
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<BarChart3 className="h-8 w-8" />}
                            title="Real-time Analytics"
                            description="Track revenue, customers, churn, and growth with live dashboards and KPI metrics."
                        />
                        <FeatureCard
                            icon={<Zap className="h-8 w-8" />}
                            title="AI-Powered Insights"
                            description="Get intelligent recommendations with Gemini AI and local ML models at zero cost."
                        />
                        <FeatureCard
                            icon={<Users className="h-8 w-8" />}
                            title="Team Collaboration"
                            description="Multi-workspace support with role-based access control for your entire team."
                        />
                        <FeatureCard
                            icon={<TrendingUp className="h-8 w-8" />}
                            title="Growth Tracking"
                            description="Monitor conversion rates, deal sizes, and trends with advanced visualizations."
                        />
                        <FeatureCard
                            icon={<Shield className="h-8 w-8" />}
                            title="Enterprise Security"
                            description="GDPR compliant with PII detection, data isolation, and secure API access."
                        />
                        <FeatureCard
                            icon={<Globe className="h-8 w-8" />}
                            title="Public API"
                            description="Integrate your data with webhooks, REST API, and automated workflows."
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="container mx-auto px-4 py-20 bg-primary/5">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 text-center">
                        <StatCard value="$0" label="Monthly Cost" />
                        <StatCard value="100%" label="Platform Complete" />
                        <StatCard value="90+" label="Components Built" />
                        <StatCard value="15+" label="Pages & Features" />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-4 py-32">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h2 className="text-5xl font-bold">
                        Ready to Reach the Stratosphere?
                    </h2>
                    <p className="text-xl text-muted-foreground">
                        Join businesses using AI-powered intelligence to make better decisions.
                    </p>
                    <Link to="/auth">
                        <Button size="lg" className="text-lg px-12 py-7">
                            Start Your Free Trial
                            <ArrowRight className="ml-2 h-5 w-5" />
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
        <div className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors">
            <div className="text-primary mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    );
}

function StatCard({ value, label }: { value: string; label: string }) {
    return (
        <div>
            <div className="text-4xl font-bold text-primary mb-2">{value}</div>
            <div className="text-muted-foreground">{label}</div>
        </div>
    );
}
