import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, CreditCard, Zap } from "lucide-react";

export function SubscriptionSettings() {
    const currentPlan: string = "starter"; // This would come from DB/Context
    const usage = {
        predictions: 45,
        predictionsLimit: 100,
        seats: 2,
        seatsLimit: 3
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Current Plan</CardTitle>
                            <CardDescription>You are currently on the <span className="font-semibold text-primary capitalize">{currentPlan}</span> plan.</CardDescription>
                        </div>
                        <Badge variant="secondary" className="capitalize">{currentPlan}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>AI Predictions Usage</span>
                            <span className="text-muted-foreground">{usage.predictions} / {usage.predictionsLimit}</span>
                        </div>
                        <Progress value={(usage.predictions / usage.predictionsLimit) * 100} />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Team Seats</span>
                            <span className="text-muted-foreground">{usage.seats} / {usage.seatsLimit}</span>
                        </div>
                        <Progress value={(usage.seats / usage.seatsLimit) * 100} />
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-6">
                    <Button variant="outline" className="mr-2">Manage Billing</Button>
                    <Button>Upgrade Plan</Button>
                </CardFooter>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Starter */}
                <Card className={currentPlan === 'starter' ? 'border-primary' : ''}>
                    <CardHeader>
                        <CardTitle>Starter</CardTitle>
                        <CardDescription>For individuals and hobbyists</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">Free</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> 100 AI Predictions/mo</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> 3 Team Members</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Community Support</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline" disabled={currentPlan === 'starter'}>
                            {currentPlan === 'starter' ? 'Current Plan' : 'Downgrade'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Pro */}
                <Card className={`relative ${currentPlan === 'pro' ? 'border-primary' : ''}`}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="default">Most Popular</Badge>
                    </div>
                    <CardHeader>
                        <CardTitle>Pro</CardTitle>
                        <CardDescription>For growing teams</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">$49</span><span className="text-muted-foreground">/mo</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> 10,000 AI Predictions/mo</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> 10 Team Members</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Email Support</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Advanced Analytics</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant={currentPlan === 'pro' ? "outline" : "default"} disabled={currentPlan === 'pro'}>
                            {currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Enterprise */}
                <Card className={currentPlan === 'enterprise' ? 'border-primary' : ''}>
                    <CardHeader>
                        <CardTitle>Enterprise</CardTitle>
                        <CardDescription>For large organizations</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">Custom</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Unlimited Predictions</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Unlimited Seats</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Dedicated Account Manager</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> SSO & Audit Logs</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline">Contact Sales</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
