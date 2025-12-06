import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAutomationLogs } from '@/hooks/useAutomationRules';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

export function AutomationLogs() {
    const { data: logs = [], isLoading } = useAutomationLogs();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Automation Logs</h2>
                <p className="text-muted-foreground">
                    View the execution history of your automation rules
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Execution History</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-center py-8 text-muted-foreground">Loading logs...</p>
                    ) : logs.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No execution logs yet</p>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log: any) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-4 p-4 rounded-lg border"
                                >
                                    <div className="mt-1">
                                        {log.status === 'success' && (
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        )}
                                        {log.status === 'failure' && (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                        )}
                                        {log.status === 'skipped' && (
                                            <MinusCircle className="h-5 w-5 text-gray-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Badge variant={
                                                log.status === 'success' ? 'default' :
                                                    log.status === 'failure' ? 'destructive' : 'secondary'
                                            }>
                                                {log.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(log.executed_at).toLocaleString()}
                                            </span>
                                        </div>
                                        {log.error_message && (
                                            <p className="text-sm text-red-500">{log.error_message}</p>
                                        )}
                                        {log.condition_result && (
                                            <div className="text-xs text-muted-foreground">
                                                Condition: {JSON.stringify(log.condition_result)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
