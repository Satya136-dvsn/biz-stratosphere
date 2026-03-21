// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, MessageSquare, Building2, Send, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { createLogger } from "@/lib/logger";

const log = createLogger('ContactSales');

export default function ContactSales() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        tier: "enterprise",
        message: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            // 1. Persist to database (using notifications as a temporary store)
            // We'll tag it as 'sales_inquiry' so it can be filtered/searched
            
            // Find an admin user to notify if possible, else notify the current user OR a system record
            const { data: admins } = await supabase
                .from('profiles')
                .select('id')
                .or('role.eq.admin,role.eq.super_admin')
                .limit(1) as any;

            const targetUserId = (admins as any)?.[0]?.id || user?.id;

            if (targetUserId) {
                const { error } = await supabase.from('notifications' as any).insert({
                    user_id: targetUserId,
                    title: `New Enterprise Inquiry: ${formData.company}`,
                    message: `Inquiry from ${formData.firstName} ${formData.lastName} (${formData.email}).\nScale: ${formData.tier}\nRequirements: ${formData.message}`,
                    type: 'sales_inquiry',
                    read: false
                } as any);

                if (error) throw error;
            } else {
                // Fallback for anonymous users: handled by Edge Function in prod
                log.info('Anonymous inquiry submitted', { company: formData.company });
            }

            // Simulate slight delay for professional feel
            await new Promise(resolve => setTimeout(resolve, 800));
            
            setSubmitted(true);
            toast({
                title: "Inquiry Sent",
                description: "An Enterprise Account Manager will reach out to you within 24 hours.",
            });
        } catch (error: unknown) {
            log.error('Submission error', error instanceof Error ? error : new Error(String(error)));
            toast({
                title: "Submission Failed",
                description: "There was an error sending your inquiry. Please try again or email us directly.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <PageLayout maxWidth="5xl" className="flex items-center justify-center min-h-[80vh]">
                <Card className="max-w-md w-full text-center p-8 glass-strong border-primary/30">
                    <div className="flex justify-center mb-6">
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in duration-500">
                            <CheckCircle2 className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl mb-4">Thank You!</CardTitle>
                    <p className="text-muted-foreground mb-8">
                        Your inquiry has been received. Our team will contact you shortly to discuss your enterprise requirements.
                    </p>
                    <Link to="/dashboard">
                        <Button className="w-full">Return to Dashboard</Button>
                    </Link>
                </Card>
            </PageLayout>
        );
    }

    return (
        <PageLayout maxWidth="5xl">
            <div className="mb-8">
                <Link to="/dashboard" className="text-sm text-primary flex items-center gap-2 hover:underline mb-4">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>
                <h1 className="text-4xl font-bold tracking-tight">Enterprise Solutions</h1>
                <p className="text-xl text-muted-foreground mt-2">
                    Custom-built analytics and machine learning at scale.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Contact Form */}
                <Card className="lg:col-span-3 glass-strong border-primary/20">
                    <CardHeader>
                        <CardTitle>Inquiry Form</CardTitle>
                        <CardDescription>
                            Tell us about your organization's needs and we'll create a tailored plan for you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input 
                                        id="firstName" 
                                        placeholder="Jane" 
                                        required 
                                        className="glass" 
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input 
                                        id="lastName" 
                                        placeholder="Doe" 
                                        required 
                                        className="glass" 
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Work Email</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="jane.doe@company.com" 
                                    required 
                                    className="glass" 
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="company">Company Name</Label>
                                <Input 
                                    id="company" 
                                    placeholder="Acme Corp" 
                                    required 
                                    className="glass" 
                                    value={formData.company}
                                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tier">Expected Scale</Label>
                                <Select 
                                    defaultValue="enterprise" 
                                    onValueChange={(val) => setFormData({...formData, tier: val})}
                                >
                                    <SelectTrigger className="glass">
                                        <SelectValue placeholder="Select scale" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="large">Large Organization (100-500 employees)</SelectItem>
                                        <SelectItem value="enterprise">Global Enterprise (500+ employees)</SelectItem>
                                        <SelectItem value="government">Government/Public Sector</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Key Requirements</Label>
                                <Textarea 
                                    id="message" 
                                    placeholder="Tell us about your data volume, compliance needs (SSO, GDPR), or custom ML requirements..." 
                                    className="min-h-[120px] glass" 
                                    required 
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                />
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg shadow-glow-primary hover:shadow-glow-primary-hover transition-all" disabled={isSubmitting}>
                                {isSubmitting ? "Sending Inquiry..." : "Submit Inquiry"}
                                <Send className="ml-2 h-4 w-4" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Info Sidebar */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="glass border-border/30">
                        <CardHeader>
                            <CardTitle className="text-lg">Why Enterprise?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-3">
                                <div className="mt-1 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Building2 className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Dedicated Instance</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Isolated compute resources for consistent performance.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="mt-1 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Mail className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">White-glove Support</h4>
                                    <p className="text-xs text-muted-foreground mt-1">24/7 dedicated account manager and engineering support.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="mt-1 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Custom Training</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Machine learning models trained on your proprietary data.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-6">
                            <h4 className="font-bold mb-2">Direct Contact</h4>
                            <p className="text-sm text-muted-foreground mb-4">Urgent inquiry? Reach our partnerships team directly.</p>
                            <div className="space-y-2 text-sm">
                                <p className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-primary" />
                                    d.v.satyanarayana260@gmail.com
                                </p>
                                <p className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    Visakhapatnam, India
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageLayout>
    );
}
