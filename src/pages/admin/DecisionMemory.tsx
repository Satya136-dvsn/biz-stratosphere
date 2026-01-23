
import { useState } from 'react';
import { useDecisionMemory, Decision, DecisionType, OutcomeStatus } from '@/hooks/useDecisionMemory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { BrainCircuit, CheckCircle, XCircle, AlertTriangle, Filter, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function DecisionMemoryAdmin() {
    const { useDecisions, updateOutcome } = useDecisionMemory();
    const { toast } = useToast();

    // Filters
    const [typeFilter, setTypeFilter] = useState<DecisionType | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<OutcomeStatus | 'all'>('all');
    const [confidenceFilter, setConfidenceFilter] = useState<string>('all');

    // Fetch Data
    const { data: decisions = [], isLoading } = useDecisions({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        confidenceLevel: confidenceFilter !== 'all' ? confidenceFilter : undefined,
    });

    // Update Outcome Modal State
    const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
    const [actualOutcome, setActualOutcome] = useState('');
    const [outcomeStatus, setOutcomeStatus] = useState<OutcomeStatus>('success');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleUpdateOutcome = async () => {
        if (!selectedDecision) return;
        setIsUpdating(true);
        try {
            await updateOutcome.mutateAsync({
                id: selectedDecision.decision_id,
                actual_outcome: actualOutcome,
                outcome_status: outcomeStatus
            });
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsUpdating(false);
        }
    };

    const openUpdateDialog = (decision: Decision) => {
        setSelectedDecision(decision);
        setActualOutcome(decision.actual_outcome || '');
        setOutcomeStatus(decision.outcome_status || 'pending');
        setIsDialogOpen(true);
    };

    const getConfidenceBadgeColor = (level?: string) => {
        switch (level) {
            case 'high': return 'bg-green-100 text-green-800 border-green-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failure': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'partial': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            default: return <div className="h-2 w-2 rounded-full bg-gray-300" />;
        }
    };

    // Highlight logic
    const isHighlight = (d: Decision) => {
        // High confidence but failed
        if (d.ai_confidence_level === 'high' && d.outcome_status === 'failure') return 'bg-red-50/50 border-l-4 border-l-red-500';
        // Low confidence but accepted (and maybe success?)
        if (d.ai_confidence_level === 'low' && d.human_action === 'accepted') return 'bg-yellow-50/50 border-l-4 border-l-yellow-500';
        return '';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Decision Memory™</h1>
                <p className="text-muted-foreground">
                    System of record for AI-assisted decisions. Monitor confidence, outcomes, and performance.
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="w-[200px]">
                            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Decision Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="ai_chat">AI Chat</SelectItem>
                                    <SelectItem value="ml_prediction">ML Prediction</SelectItem>
                                    <SelectItem value="automation">Automation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[200px]">
                            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Outcome Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="success">Success</SelectItem>
                                    <SelectItem value="partial">Partial</SelectItem>
                                    <SelectItem value="failure">Failure</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[200px]">
                            <Select value={confidenceFilter} onValueChange={(v) => setConfidenceFilter(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Confidence Level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Levels</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Decisions Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Context</TableHead>
                                <TableHead>Confidence</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Outcome</TableHead>
                                <TableHead className="text-right">Manage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {decisions.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No decisions recorded yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        Loading decisions...
                                    </TableCell>
                                </TableRow>
                            )}
                            {decisions.map((decision) => (
                                <TableRow key={decision.decision_id} className={isHighlight(decision)}>
                                    <TableCell className="whitespace-nowrap font-medium text-xs">
                                        {format(new Date(decision.created_at), 'MMM d, h:mm a')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {decision.decision_type.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[300px]">
                                        <div className="truncate text-sm" title={JSON.stringify(decision.input_context, null, 2)}>
                                            {decision.expected_outcome}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getConfidenceBadgeColor(decision.ai_confidence_level)}`}>
                                                {(decision.ai_confidence_score * 100).toFixed(0)}% {decision.ai_confidence_level}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="capitalize text-sm">
                                        {decision.human_action}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(decision.outcome_status)}
                                            <span className="capitalize text-sm">{decision.outcome_status}</span>
                                        </div>
                                        {decision.actual_outcome && (
                                            <div className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={decision.actual_outcome}>
                                                {decision.actual_outcome}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => openUpdateDialog(decision)}>
                                            Update
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Update Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Outcome</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="status">Outcome Status</Label>
                            <Select value={outcomeStatus} onValueChange={(v: OutcomeStatus) => setOutcomeStatus(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="success">Success</SelectItem>
                                    <SelectItem value="partial">Partial</SelectItem>
                                    <SelectItem value="failure">Failure</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="actual">Actual Outcome Details</Label>
                            <Input
                                id="actual"
                                value={actualOutcome}
                                onChange={(e) => setActualOutcome(e.target.value)}
                                placeholder="Describe what actually happened..."
                            />
                        </div>
                        <Button onClick={handleUpdateOutcome} disabled={isUpdating}>
                            {isUpdating ? 'Saving...' : 'Save Outcome'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
