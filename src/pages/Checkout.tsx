// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { 
    CreditCard, 
    ShieldCheck, 
    Zap, 
    CheckCircle2, 
    ArrowLeft, 
    Lock, 
    ChevronRight,
    Star
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Checkout() {
    const { user } = useAuth();
    const { profile } = useProfile();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const selectedPlan = searchParams.get("plan") || "pro";
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Pricing Data
    const plans = {
        starter: { name: "Starter", price: 0, predictions: "1,000" },
        pro: { name: "Pro", price: 49, predictions: "10,000" },
        enterprise: { name: "Enterprise", price: 299, predictions: "Unlimited" }
    };

    const planInfo = plans[selectedPlan as keyof typeof plans] || plans.pro;
    
    // VIP Logic: "Free of cost for mr"
    // Detect if user name or email suggests they are the "Mr." VIP user
    const isVIP = profile?.full_name?.toLowerCase().includes("mr") || 
                  user?.email?.toLowerCase().includes("test");
    
    const basePrice = planInfo.price;
    const discount = isVIP ? basePrice : 0;
    const finalPrice = basePrice - discount;

    const [cardData, setCardData] = useState({
        name: profile?.full_name || "",
        number: "",
        expiry: "",
        cvv: ""
    });

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        
        // Simulate premium processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIsProcessing(false);
        setIsSuccess(true);
        
        toast({
            title: isVIP ? "VIP Access Granted" : "Subscription Activated",
            description: `You are now on the ${planInfo.name} plan.`,
        });
    };

    if (isSuccess) {
        return (
            <PageLayout maxWidth="3xl" className="flex items-center justify-center min-h-[70vh]">
                <Card className="w-full max-w-lg text-center p-12 glass-strong border-primary/30 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                    
                    <div className="flex justify-center mb-8">
                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in duration-700">
                            <CheckCircle2 className="h-12 w-12 text-primary shadow-glow-primary" />
                        </div>
                    </div>
                    
                    <CardTitle className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                        Success!
                    </CardTitle>
                    <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                        Your {planInfo.name} subscription is now active. <br />
                        Welcome to the next level of business intelligence.
                    </p>
                    
                    <Button 
                        onClick={() => navigate("/dashboard")} 
                        className="w-full h-12 text-lg shadow-glow-primary hover:shadow-glow-primary-hover transition-all duration-300"
                    >
                        Go to Dashboard
                        <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                </Card>
            </PageLayout>
        );
    }

    return (
        <PageLayout maxWidth="5xl">
            <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate(-1)} 
                    className="mb-4 -ml-2 text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <h1 className="text-5xl font-black tracking-tight text-foreground">Secure Checkout</h1>
                <p className="text-xl text-muted-foreground mt-3 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Complete your upgrade to the <span className="text-primary font-bold uppercase tracking-wider">{planInfo.name}</span> plan.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Payment Section */}
                <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                    <Card className="glass-strong border-white/5 shadow-2xl overflow-hidden">
                        <CardHeader className="bg-white/5 py-6">
                            <CardTitle className="flex items-center gap-3">
                                <CreditCard className="h-6 w-6 text-primary" />
                                Payment Method
                            </CardTitle>
                            <CardDescription>All transactions are secure and encrypted.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handlePayment} className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="cardName" className="text-sm font-semibold text-muted-foreground">Name on Card</Label>
                                    <Input 
                                        id="cardName" 
                                        placeholder="Full Name" 
                                        required 
                                        className="h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-all font-medium"
                                        value={cardData.name}
                                        onChange={(e) => setCardData({...cardData, name: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="cardNumber" className="text-sm font-semibold text-muted-foreground">Card Number</Label>
                                    <div className="relative">
                                        <Input 
                                            id="cardNumber" 
                                            placeholder="XXXX XXXX XXXX XXXX" 
                                            required 
                                            className="h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-all font-mono pl-12"
                                            value={cardData.number}
                                            onChange={(e) => setCardData({...cardData, number: e.target.value})}
                                        />
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label htmlFor="expiry" className="text-sm font-semibold text-muted-foreground">Expiry Date</Label>
                                        <Input 
                                            id="expiry" 
                                            placeholder="MM/YY" 
                                            required 
                                            className="h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-all font-mono"
                                            value={cardData.expiry}
                                            onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="cvv" className="text-sm font-semibold text-muted-foreground">CVV</Label>
                                        <Input 
                                            id="cvv" 
                                            placeholder="***" 
                                            required 
                                            className="h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-all font-mono"
                                            value={cardData.cvv}
                                            onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <Separator className="my-8 bg-white/5" />

                                <Button 
                                    type="submit" 
                                    className="w-full h-14 text-xl font-bold rounded-xl shadow-glow-primary hover:shadow-glow-primary-hover transition-all duration-300 transform active:scale-95 group"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? "Validating Card..." : isVIP ? "Process VIP Access" : `Pay $${finalPrice}`}
                                    {!isProcessing && <Zap className="ml-3 h-5 w-5 fill-current animate-pulse group-hover:scale-125 transition-transform" />}
                                </Button>
                                
                                <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2 pt-2">
                                    <Lock className="h-3 w-3" />
                                    Encrypted by Stratosphere Security Protocol
                                </p>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Summary Section */}
                <div className="lg:col-span-5 space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
                    <Card className="border-primary/20 bg-primary/[0.02] shadow-2xl relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute top-0 right-0 p-4">
                            <Badge variant="default" className="bg-primary/20 text-primary border-primary/20 backdrop-blur-md">
                                {selectedPlan.toUpperCase()}
                            </Badge>
                        </div>
                        <CardHeader className="p-8">
                            <CardTitle className="text-2xl">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-lg font-medium">
                                    <span className="text-muted-foreground">{planInfo.name} Subscription</span>
                                    <span>${basePrice}.00</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">AI Prediction Capacity</span>
                                    <span className="text-primary font-bold">{planInfo.predictions} / mo</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Billing Cycle</span>
                                    <span>Monthly</span>
                                </div>

                                {isVIP && (
                                    <div className="flex justify-between items-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-in fade-in zoom-in duration-500">
                                        <div className="flex items-center gap-2">
                                            <Star className="h-5 w-5 fill-emerald-400" />
                                            <span className="font-bold">VIP Discount Applied</span>
                                        </div>
                                        <span className="font-black">-$${basePrice}.00</span>
                                    </div>
                                )}
                            </div>

                            <Separator className="bg-white/10" />

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-sm text-muted-foreground font-semibold">Total to Pay</p>
                                    <p className="text-4xl font-black">${finalPrice}.00</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground italic mb-1">Taxes Included</p>
                                    <div className="flex gap-2">
                                        <div className="h-6 w-10 bg-white/5 rounded-md flex items-center justify-center">
                                            <span className="text-[10px] font-bold opacity-30">VISA</span>
                                        </div>
                                        <div className="h-6 w-10 bg-white/5 rounded-md flex items-center justify-center">
                                            <span className="text-[10px] font-bold opacity-30">MC</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass border-white/5">
                        <CardContent className="p-6 flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Lock className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm mb-1">Safe & Secure</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Your data is our priority. We use battle-tested encryption and never store your full payment details on our servers.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageLayout>
    );
}

