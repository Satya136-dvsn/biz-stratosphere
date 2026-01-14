import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bell, Plus, Trash2, Play, Pause, Settings, Info, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useAutomationRules, useAutomationLogs } from '@/hooks/useAutomationRules';
import { useState } from 'react';
import { ScheduleBuilder } from '@/components/automation/ScheduleBuilder';
import { aiOrchestrator } from '@/lib/ai/orchestrator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDashboardData } from '@/hooks/useDashboardData'; // Make sure this hook exists or simulated

export function AutomationRules() {
    const { rules, isLoading, createRule, toggleRule, deleteRule, runRule, isRunning } = useAutomationRules();
    const [showWizard, setShowWizard] = useState(false);

    // AI Suggestion State
    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Mock dashboard data for AI context (in real app, fetch from hook)
    const analyticsContext = {
        avg_churn_rate: "4.2%",
        total_revenue: "$425,000",
        active_customers: 1250,
        revenue_trend: "decreasing",
        recent_tickets: "high"
    };

    const handleGenerateRules = async () => {
        setIsGenerating(true);
        try {
            const results = await aiOrchestrator.suggestAutomationRules(analyticsContext);
            setSuggestions(results);
            setShowSuggestions(true);
        } catch (err) {
            console.error("Failed to generate rules", err);
        } finally {
            setIsGenerating(false);
        }
    };

    // Helper to open wizard with suggestion
    const [wizardInitData, setWizardInitData] = useState<any>(null);
    const acceptSuggestion = (suggestion: any) => {
        setWizardInitData({
            name: suggestion.name,
            description: suggestion.reasoning,
            trigger_type: 'threshold',
            condition: { metric: 'revenue', operator: '<', threshold: 0 }, // AI should parse this better in future
            action_type: suggestion.action?.toLowerCase().includes('email') ? 'email' : 'notification',
            action_config: { title: suggestion.name, message: `Action: ${suggestion.action}` },
            schedule_type: 'manual',
            schedule_config: {},
        });
        setShowSuggestions(false);
        setShowWizard(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold tracking-tight">Automation Rules</h2>
                    </div>
                    <p className="text-muted-foreground mb-3">
                        Create and manage automation rules to monitor your business metrics in real-time.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleGenerateRules} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-purple-600" />}
                        AI Suggestions
                    </Button>
                    <Button onClick={() => { setWizardInitData(null); setShowWizard(true); }} data-testid="create-rule-button">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Rule
                    </Button>
                </div>
            </div>

            {/* AI Suggestions Dialog */}
            <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                            AI Recommended Automation Rules
                        </DialogTitle>
                        <DialogDescription>
                            Based on your current business metrics (Churn: {analyticsContext.avg_churn_rate}, Revenue Trend: {analyticsContext.revenue_trend}), here are 3 rules to optimize operations.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 mt-4">
                        {suggestions.map((option, idx) => (
                            <Card key={idx} className="border-purple-100 bg-purple-50/30">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold text-purple-900">{option.name}</h4>
                                            <p className="text-sm text-muted-foreground mt-1">{option.reasoning}</p>
                                            <div className="flex gap-2 mt-3 text-xs">
                                                <Badge variant="outline" className="bg-white">If: {option.condition}</Badge>
                                                <Badge variant="outline" className="bg-white">Then: {option.action}</Badge>
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={() => acceptSuggestion(option)}>
                                            Use Rule
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Rules List */}
            <div className="grid gap-4">
                {isLoading ? (
                    <Card>
                        <CardContent className="flex items-center justify-center py-12">
                            <p className="text-muted-foreground">Loading rules...</p>
                        </CardContent>
                    </Card>
                ) : rules.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No automation rules yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Create your first rule to automate alerts and actions
                            </p>
                            <Button onClick={() => setShowWizard(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create First Rule
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    rules.map((rule) => (
                        <Card key={rule.id} className={!rule.enabled ? 'opacity-60' : ''}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">
                                            {rule.name}
                                            <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                                                {rule.enabled ? 'Active' : 'Paused'}
                                            </Badge>
                                        </CardTitle>
                                        {rule.description && (
                                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => runRule(rule.id)}
                                            disabled={isRunning}
                                        >
                                            {isRunning ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Running...
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="h-4 w-4 mr-2" />
                                                    Run Now
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => deleteRule(rule.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 text-sm">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="font-medium">Trigger:</span>{' '}
                                            <span className="capitalize">{rule.trigger_type.replace('_', ' ')}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Action:</span>{' '}
                                            <span className="capitalize">{rule.action_type}</span>
                                        </div>
                                    </div>
                                    {rule.last_triggered && (
                                        <div className="text-xs text-muted-foreground">
                                            Last triggered: {new Date(rule.last_triggered).toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                {/* Execution Logs */}
                                <RuleExecutionLogs ruleId={rule.id} />
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Rule Creation Wizard */}
            {showWizard && <RuleWizard onClose={() => setShowWizard(false)} onCreate={createRule} initialData={wizardInitData} />}
        </div >
    );
}

// Rule Creation Wizard Component
function RuleWizard({ onClose, onCreate, initialData }: { onClose: () => void; onCreate: (rule: any) => void; initialData?: any }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(initialData || {
        name: '',
        description: '',
        trigger_type: 'threshold',
        condition: { metric: 'revenue', operator: '>', threshold: 10000 },
        action_type: 'notification',
        action_config: { title: '', message: '' },
        schedule_type: 'manual' as 'manual' | 'cron' | 'interval',
        schedule_config: {},
    });

    const handleCreate = () => {
        onCreate(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <CardTitle data-testid="wizard-title">Create Automation Rule</CardTitle>
                    <CardDescription>Step {step} of 4</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <Label>Rule Name *</Label>
                                <Input
                                    placeholder="e.g., Revenue Alert"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    data-testid="rule-name-input"
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    placeholder="What does this rule do?"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Trigger Type *</Label>
                                <Select
                                    value={formData.trigger_type}
                                    onValueChange={(value: any) => setFormData({ ...formData, trigger_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="threshold">Threshold (metric crosses value)</SelectItem>
                                        <SelectItem value="schedule">Schedule (time-based)</SelectItem>
                                        <SelectItem value="data_change">Data Change (on upload)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Configure Condition</h3>
                            {formData.trigger_type === 'threshold' && (
                                <>
                                    <div>
                                        <Label>Metric *</Label>
                                        <Select
                                            value={formData.condition.metric}
                                            onValueChange={(value) =>
                                                setFormData({
                                                    ...formData,
                                                    condition: { ...formData.condition, metric: value },
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="revenue">Revenue</SelectItem>
                                                <SelectItem value="customers">Customers</SelectItem>
                                                <SelectItem value="churn_rate">Churn Rate</SelectItem>
                                                <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Operator *</Label>
                                        <Select
                                            value={formData.condition.operator}
                                            onValueChange={(value: any) =>
                                                setFormData({
                                                    ...formData,
                                                    condition: { ...formData.condition, operator: value },
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value=">">Greater than (&gt;)</SelectItem>
                                                <SelectItem value="<">Less than (&lt;)</SelectItem>
                                                <SelectItem value="=">Equal to (=)</SelectItem>
                                                <SelectItem value=">=">Greater than or equal (≥)</SelectItem>
                                                <SelectItem value="<=">Less than or equal (≤)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Threshold Value *</Label>
                                        <Input
                                            type="number"
                                            placeholder="e.g., 10000"
                                            value={formData.condition.threshold}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    condition: { ...formData.condition, threshold: parseFloat(e.target.value) },
                                                })
                                            }
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <ScheduleBuilder
                            value={{
                                type: formData.schedule_type,
                                config: formData.schedule_config,
                            }}
                            onChange={(schedule) => setFormData({
                                ...formData,
                                schedule_type: schedule.type,
                                schedule_config: schedule.config,
                            })}
                        />
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Configure Action</h3>
                            <div>
                                <Label>Action Type *</Label>
                                <Select
                                    value={formData.action_type}
                                    onValueChange={(value: any) => setFormData({ ...formData, action_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="notification">In-App Notification</SelectItem>
                                        <SelectItem value="email">Email Alert</SelectItem>
                                        <SelectItem value="webhook">Webhook</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {formData.action_type === 'notification' && (
                                <div>
                                    <Label>Notification Message</Label>
                                    <Textarea
                                        placeholder="Alert: {metric} has crossed {threshold}!"
                                        value={formData.action_config.message || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                action_config: { ...formData.action_config, message: e.target.value },
                                            })
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={step === 1 ? onClose : () => setStep(step - 1)} data-testid="wizard-back-button">
                            {step === 1 ? 'Cancel' : 'Back'}
                        </Button>
                        <Button onClick={step === 4 ? handleCreate : () => setStep(step + 1)} data-testid="wizard-next-button">
                            {step === 4 ? 'Create Rule' : 'Next'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Helper component to display recent execution logs for a rule
function RuleExecutionLogs({ ruleId }: { ruleId: string }) {
    const { data: logs = [], isLoading } = useAutomationLogs(ruleId);

    if (isLoading) {
        return <p className="text-xs text-muted-foreground mt-2">Loading executions...</p>;
    }

    if (logs.length === 0) {
        return <p className="text-xs text-muted-foreground mt-2">No executions yet. Click "Run Now" to test this rule.</p>;
    }

    const latestLog = logs[0];
    const statusColor = latestLog.status === 'success' ? 'text-green-600' :
        latestLog.status === 'skipped' ? 'text-yellow-600' :
            'text-red-600';

    return (
        <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs font-medium mb-1">Last Execution:</p>
            <div className="text-xs space-y-1">
                <p>
                    <span className="text-muted-foreground">Status:</span>{' '}
                    <span className={statusColor + ' font-medium capitalize'}>{latestLog.status}</span>
                </p>
                {latestLog.condition_result && (
                    <p>
                        <span className="text-muted-foreground">Condition:</span>{' '}
                        {latestLog.condition_result.matched ? 'Met' : 'Not met'}
                        {latestLog.condition_result.currentValue !== undefined &&
                            ` (value: ${latestLog.condition_result.currentValue})`}
                    </p>
                )}
                <p className="text-muted-foreground">
                    {new Date(latestLog.executed_at).toLocaleString()}
                </p>
            </div>
        </div>
    );
}

export default AutomationRules;
