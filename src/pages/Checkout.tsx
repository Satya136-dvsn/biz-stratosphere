// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    Star,
    Smartphone,
    Landmark,
    Wallet,
    QrCode,
    Globe,
    Banknote,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Payment Method Tab Config ──────────────────────────────────────
type PaymentMethod = "card" | "upi" | "netbanking" | "wallet";

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { id: "card", label: "Card", icon: <CreditCard className="h-4 w-4" /> },
    { id: "upi", label: "UPI", icon: <Smartphone className="h-4 w-4" /> },
    { id: "netbanking", label: "Net Banking", icon: <Landmark className="h-4 w-4" /> },
    { id: "wallet", label: "Wallets", icon: <Wallet className="h-4 w-4" /> },
];

const popularBanks = [
    { name: "State Bank of India", code: "SBI" },
    { name: "HDFC Bank", code: "HDFC" },
    { name: "ICICI Bank", code: "ICICI" },
    { name: "Axis Bank", code: "AXIS" },
    { name: "Kotak Mahindra Bank", code: "KOTAK" },
    { name: "Punjab National Bank", code: "PNB" },
    { name: "Bank of Baroda", code: "BOB" },
    { name: "Yes Bank", code: "YES" },
];

const walletProviders = [
    { name: "PayPal", icon: "P", color: "from-blue-500 to-blue-600" },
    { name: "Google Pay", icon: "G", color: "from-white to-gray-200" },
    { name: "Apple Pay", icon: "A", color: "from-gray-800 to-black" },
    { name: "Amazon Pay", icon: "a", color: "from-amber-400 to-amber-500" },
    { name: "Paytm", icon: "₹", color: "from-sky-400 to-blue-500" },
    { name: "PhonePe", icon: "P", color: "from-indigo-500 to-purple-600" },
];

export default function Checkout() {
    const { user } = useAuth();
    const { profile } = useProfile();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const selectedPlan = searchParams.get("plan") || "pro";
    const [activeMethod, setActiveMethod] = useState<PaymentMethod>("card");

    // ── Plan Pricing ──
    const plans: Record<string, { name: string; price: number; predictions: string }> = {
        starter: { name: "Starter", price: 0, predictions: "1,000" },
        pro: { name: "Pro", price: 49, predictions: "10,000" },
        enterprise: { name: "Enterprise", price: 299, predictions: "Unlimited" }
    };
    const planInfo = plans[selectedPlan] || plans.pro;
    
    // ── VIP Logic ──
    const isVIP = profile?.full_name?.toLowerCase().includes("mr") || 
                  user?.email?.toLowerCase().includes("test");
    const basePrice = planInfo.price;
    const discount = isVIP ? basePrice : 0;
    const finalPrice = basePrice - discount;

    // ── Payment State ──
    const [cardData, setCardData] = useState({ name: profile?.full_name || "", number: "", expiry: "", cvv: "" });
    const [upiId, setUpiId] = useState("");
    const [selectedBank, setSelectedBank] = useState("");
    const [selectedWallet, setSelectedWallet] = useState("");

    // ── Contact Sales redirect ──
    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(`/contact-sales?plan=${selectedPlan}&method=${activeMethod}`);
    };

    // ── Success State (kept for future use) ──

    return (
        <PageLayout maxWidth="5xl">
            <style>{`
                @keyframes progress {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
            `}</style>

            {/* Header */}
            <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate(-1)} 
                    className="mb-4 -ml-2 text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <h1 className="text-5xl font-black tracking-tight text-foreground">Secure Checkout</h1>
                <p className="text-xl text-muted-foreground mt-3 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Complete your upgrade to the <span className="text-primary font-bold uppercase tracking-wider">{planInfo.name}</span> plan.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* ═══════ LEFT: Payment Methods ═══════ */}
                <div className="lg:col-span-7 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                    <Card className="glass-strong border-white/5 shadow-2xl overflow-hidden relative">
                        <ProcessingOverlay />

                        <CardHeader className="bg-white/[0.03] border-b border-white/5 py-5">
                            <CardTitle className="flex items-center gap-3 text-lg">
                                <Lock className="h-5 w-5 text-primary" />
                                Choose Payment Method
                            </CardTitle>
                            <CardDescription>Select a method below to proceed securely.</CardDescription>
                        </CardHeader>

                        <Tabs value={activeMethod} onValueChange={(v) => setActiveMethod(v as PaymentMethod)} className="w-full">
                            <div className="px-6 pt-6">
                                <TabsList className="w-full grid grid-cols-4 h-14 bg-white/5 p-1 rounded-xl gap-1">
                                    {paymentMethods.map(m => (
                                        <TabsTrigger 
                                            key={m.id} 
                                            value={m.id} 
                                            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200 text-xs sm:text-sm font-semibold"
                                        >
                                            {m.icon}
                                            <span className="hidden sm:inline">{m.label}</span>
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            <CardContent className="p-6">
                                {/* ── Credit / Debit Card ── */}
                                <TabsContent value="card" className="mt-4 space-y-0">
                                    <form onSubmit={handlePayment} className="space-y-5">
                                        <div className="flex items-center gap-2 mb-5">
                                            <CreditCard className="h-5 w-5 text-primary" />
                                            <span className="font-bold text-sm">Credit / Debit Card</span>
                                            <div className="ml-auto flex gap-1.5">
                                                {["VISA", "MC", "AMEX", "RuPay"].map(b => (
                                                    <div key={b} className="h-6 px-2 bg-white/5 rounded flex items-center justify-center">
                                                        <span className="text-[9px] font-bold text-muted-foreground">{b}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Name on Card</Label>
                                            <Input 
                                                placeholder="Full Name" required 
                                                className="h-11 bg-white/5 border-white/10 focus:border-primary/50 font-medium"
                                                value={cardData.name}
                                                onChange={(e) => setCardData({...cardData, name: e.target.value})}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Card Number</Label>
                                            <div className="relative">
                                                <Input 
                                                    placeholder="XXXX XXXX XXXX XXXX" required 
                                                    className="h-11 bg-white/5 border-white/10 focus:border-primary/50 font-mono pl-11"
                                                    value={cardData.number}
                                                    onChange={(e) => setCardData({...cardData, number: e.target.value})}
                                                />
                                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-muted-foreground">Expiry Date</Label>
                                                <Input 
                                                    placeholder="MM/YY" required 
                                                    className="h-11 bg-white/5 border-white/10 focus:border-primary/50 font-mono"
                                                    value={cardData.expiry}
                                                    onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-muted-foreground">CVV</Label>
                                                <Input 
                                                    placeholder="•••" type="password" required maxLength={4}
                                                    className="h-11 bg-white/5 border-white/10 focus:border-primary/50 font-mono"
                                                    value={cardData.cvv}
                                                    onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full h-13 text-base font-bold rounded-xl shadow-glow-primary hover:shadow-glow-primary-hover transition-all mt-6 active:scale-[0.98]" disabled={isProcessing}>
                                            {isVIP ? "Process VIP Access" : `Pay $${finalPrice}.00`}
                                            <Zap className="ml-2 h-4 w-4 fill-current" />
                                        </Button>
                                    </form>
                                </TabsContent>

                                {/* ── UPI ── */}
                                <TabsContent value="upi" className="mt-4">
                                    <form onSubmit={handlePayment} className="space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <QrCode className="h-5 w-5 text-primary" />
                                            <span className="font-bold text-sm">UPI Payment</span>
                                        </div>

                                        {/* QR Code Simulation */}
                                        <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-white/[0.03] border border-white/5">
                                            <div className="w-40 h-40 bg-white rounded-xl p-3 flex items-center justify-center relative">
                                                <div className="grid grid-cols-8 grid-rows-8 gap-px w-full h-full">
                                                    {Array.from({ length: 64 }).map((_, i) => (
                                                        <div key={i} className={cn(
                                                            "rounded-[1px]",
                                                            Math.random() > 0.45 ? "bg-gray-900" : "bg-transparent"
                                                        )} />
                                                    ))}
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="bg-white p-1.5 rounded-md shadow-sm">
                                                        <Zap className="h-5 w-5 text-primary" />
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground text-center">
                                                Scan with any UPI app to pay
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 my-2">
                                            <Separator className="flex-1 bg-white/10" />
                                            <span className="text-xs text-muted-foreground font-semibold">OR PAY VIA UPI ID</span>
                                            <Separator className="flex-1 bg-white/10" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">UPI ID</Label>
                                            <Input 
                                                placeholder="yourname@upi" required 
                                                className="h-11 bg-white/5 border-white/10 focus:border-primary/50 font-mono"
                                                value={upiId}
                                                onChange={(e) => setUpiId(e.target.value)}
                                            />
                                        </div>

                                        <Button type="submit" className="w-full h-13 text-base font-bold rounded-xl shadow-glow-primary hover:shadow-glow-primary-hover transition-all active:scale-[0.98]" disabled={isProcessing}>
                                            {isVIP ? "Process VIP Access" : `Verify & Pay $${finalPrice}.00`}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </form>
                                </TabsContent>

                                {/* ── Net Banking ── */}
                                <TabsContent value="netbanking" className="mt-4">
                                    <form onSubmit={handlePayment} className="space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Globe className="h-5 w-5 text-primary" />
                                            <span className="font-bold text-sm">Internet Banking</span>
                                        </div>

                                        {/* Popular Banks Grid */}
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground mb-3">Popular Banks</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {popularBanks.slice(0, 8).map(bank => (
                                                    <button 
                                                        key={bank.code} 
                                                        type="button"
                                                        onClick={() => setSelectedBank(bank.code)}
                                                        className={cn(
                                                            "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 text-center group",
                                                            selectedBank === bank.code 
                                                                ? "border-primary bg-primary/10 ring-1 ring-primary/30" 
                                                                : "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "h-10 w-10 rounded-lg flex items-center justify-center text-sm font-black tracking-tight transition-colors",
                                                            selectedBank === bank.code ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground group-hover:text-foreground"
                                                        )}>
                                                            {bank.code.slice(0, 2)}
                                                        </div>
                                                        <span className="text-[10px] font-medium text-muted-foreground leading-tight">{bank.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Separator className="flex-1 bg-white/10" />
                                            <span className="text-xs text-muted-foreground font-semibold">OR SELECT</span>
                                            <Separator className="flex-1 bg-white/10" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Other Banks</Label>
                                            <Select onValueChange={(v) => setSelectedBank(v)}>
                                                <SelectTrigger className="h-11 bg-white/5 border-white/10">
                                                    <SelectValue placeholder="Select your bank" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {popularBanks.map(bank => (
                                                        <SelectItem key={bank.code} value={bank.code}>{bank.name}</SelectItem>
                                                    ))}
                                                    <SelectItem value="UNION">Union Bank of India</SelectItem>
                                                    <SelectItem value="INDIAN">Indian Bank</SelectItem>
                                                    <SelectItem value="CANARA">Canara Bank</SelectItem>
                                                    <SelectItem value="FEDERAL">Federal Bank</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Button type="submit" className="w-full h-13 text-base font-bold rounded-xl shadow-glow-primary hover:shadow-glow-primary-hover transition-all active:scale-[0.98]" disabled={isProcessing || !selectedBank}>
                                            {isVIP ? "Process VIP Access" : `Pay via Net Banking $${finalPrice}.00`}
                                            <Landmark className="ml-2 h-4 w-4" />
                                        </Button>
                                    </form>
                                </TabsContent>

                                {/* ── Wallets ── */}
                                <TabsContent value="wallet" className="mt-4">
                                    <form onSubmit={handlePayment} className="space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Banknote className="h-5 w-5 text-primary" />
                                            <span className="font-bold text-sm">Digital Wallets</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            {walletProviders.map(w => (
                                                <button
                                                    key={w.name}
                                                    type="button"
                                                    onClick={() => setSelectedWallet(w.name)}
                                                    className={cn(
                                                        "flex flex-col items-center gap-3 p-5 rounded-xl border transition-all duration-200 group",
                                                        selectedWallet === w.name 
                                                            ? "border-primary bg-primary/10 ring-1 ring-primary/30 scale-[1.02]" 
                                                            : "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg font-black shadow-lg",
                                                        w.color,
                                                        w.name === "Google Pay" ? "text-gray-800" : "text-white"
                                                    )}>
                                                        {w.icon}
                                                    </div>
                                                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{w.name}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <Button type="submit" className="w-full h-13 text-base font-bold rounded-xl shadow-glow-primary hover:shadow-glow-primary-hover transition-all active:scale-[0.98]" disabled={isProcessing || !selectedWallet}>
                                            {isVIP ? "Process VIP Access" : `Pay with ${selectedWallet || "Wallet"} $${finalPrice}.00`}
                                            <Wallet className="ml-2 h-4 w-4" />
                                        </Button>
                                    </form>
                                </TabsContent>
                            </CardContent>
                        </Tabs>

                        {/* Security Badge Footer */}
                        <div className="px-6 pb-5">
                            <p className="text-center text-[11px] text-muted-foreground/60 flex items-center justify-center gap-1.5">
                                <Lock className="h-3 w-3" />
                                256-bit SSL Encrypted • PCI DSS Compliant • Stratosphere Security Protocol
                            </p>
                        </div>
                    </Card>
                </div>

                {/* ═══════ RIGHT: Order Summary ═══════ */}
                <div className="lg:col-span-5 space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
                    <Card className="border-primary/20 bg-primary/[0.02] shadow-2xl relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute top-0 right-0 p-4">
                            <Badge variant="default" className="bg-primary/20 text-primary border-primary/20 backdrop-blur-md">
                                {selectedPlan.toUpperCase()}
                            </Badge>
                        </div>
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-2xl">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-5">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-base font-medium">
                                    <span className="text-muted-foreground">{planInfo.name} Plan</span>
                                    <span className="font-bold">${basePrice}.00</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">AI Predictions</span>
                                    <span className="text-primary font-bold">{planInfo.predictions} / mo</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Billing Cycle</span>
                                    <span>Monthly</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Payment Method</span>
                                    <span className="capitalize font-medium text-foreground">
                                        {activeMethod === "card" ? "Card" : activeMethod === "upi" ? "UPI" : activeMethod === "netbanking" ? "Net Banking" : selectedWallet || "Wallet"}
                                    </span>
                                </div>

                                {isVIP && (
                                    <div className="flex justify-between items-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-in fade-in zoom-in duration-500">
                                        <div className="flex items-center gap-2">
                                            <Star className="h-5 w-5 fill-emerald-400" />
                                            <span className="font-bold text-sm">VIP Discount</span>
                                        </div>
                                        <span className="font-black">-${basePrice}.00</span>
                                    </div>
                                )}
                            </div>

                            <Separator className="bg-white/10" />

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-muted-foreground font-semibold">Total to Pay</p>
                                    <p className="text-4xl font-black">${finalPrice}.00</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-muted-foreground italic mb-1">Taxes Included</p>
                                    <div className="flex gap-1.5">
                                        {["VISA", "MC", "UPI", "PayPal"].map(b => (
                                            <div key={b} className="h-5 px-1.5 bg-white/5 rounded flex items-center justify-center">
                                                <span className="text-[8px] font-bold opacity-30">{b}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Info Card */}
                    <Card className="glass border-white/5">
                        <CardContent className="p-5 flex items-start gap-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm mb-1">Enterprise-Grade Security</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    256-bit SSL encryption, PCI DSS Level 1 compliant. We never store your payment credentials on our servers.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Money-back Guarantee */}
                    <Card className="glass border-white/5">
                        <CardContent className="p-5 flex items-start gap-4">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm mb-1">30-Day Money-Back Guarantee</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Not satisfied? Get a full refund within 30 days, no questions asked.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageLayout>
    );
}
