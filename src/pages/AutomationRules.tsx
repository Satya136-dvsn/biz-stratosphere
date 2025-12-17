import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Trash2, Play, Pause, Settings } from 'lucide-react';
import { useAutomationRules } from '@/hooks/useAutomationRules';
import { useState } from 'react';
import { FeatureBadge } from '@/components/ui/FeatureBadge';

export function AutomationRules() {
    const { rules, isLoading, createRule, toggleRule, deleteRule } = useAutomationRules();
    const [showWizard, setShowWizard] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold tracking-tight">Automation Rules</h2>
                        <FeatureBadge variant="prototype" size="md" />
                    </div>
                    <p className="text-muted-foreground">
                        Create rules to automate alerts and actions based on your data (UI refinement in progress)
                    </p>
                </div>
                <Button onClick={() => setShowWizard(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Rule
                </Button>
            </div>

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
                                            size="icon"
                                            variant="outline"
                                            onClick={() => toggleRule({ ruleId: rule.id, enabled: !rule.enabled })}
                                        >
                                            {rule.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Rule Creation Wizard */}
            {showWizard && <RuleWizard onClose={() => setShowWizard(false)} onCreate={createRule} />}
        </div>
    );
}

// Rule Creation Wizard Component
function RuleWizard({ onClose, onCreate }: { onClose: () => void; onCreate: (rule: any) => void }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        trigger_type: 'threshold' as 'threshold' | 'schedule' | 'data_change',
        condition: { metric: 'revenue', operator: '>' as '>' | '<' | '=' | '>=' | '<=', threshold: 0 },
        action_type: 'notification' as 'email' | 'webhook' | 'notification',
        action_config: {},
    });

    const handleCreate = () => {
        onCreate(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <CardTitle>Create Automation Rule</CardTitle>
                    <p className="text-sm text-muted-foreground">Step {step} of 3</p>
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
                        <Button variant="outline" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
                            {step === 1 ? 'Cancel' : 'Back'}
                        </Button>
                        <Button onClick={step === 3 ? handleCreate : () => setStep(step + 1)}>
                            {step === 3 ? 'Create Rule' : 'Next'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default AutomationRules;
