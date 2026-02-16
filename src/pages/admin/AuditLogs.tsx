// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useAdminAudit, AuditLogEntry } from "@/hooks/useAdminAudit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AuditLogs = () => {
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState("");
    const [userFilter, setUserFilter] = useState("");

    const { logs, isLoading } = useAdminAudit(page, actionFilter, userFilter);

    return (
        <PageLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Security Audit Logs</h1>
                    <p className="text-muted-foreground">Track all system actions and security events.</p>
                </div>

                <div className="flex gap-4">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter by Action..."
                            className="pl-8"
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter by User (Email/ID)..."
                            className="pl-8"
                            value={userFilter}
                            onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Event Stream</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Actor</TableHead>
                                        <TableHead>Resource</TableHead>
                                        <TableHead>Metadata</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No logs found.</TableCell>
                                        </TableRow>
                                    ) : logs.map((log: AuditLogEntry) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(log.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-xs">{log.action}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    <span>{log.actor_email || 'System'}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{log.actor_id.slice(0, 8)}...</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <span className="text-muted-foreground">{log.resource_type}:</span> {log.resource_id}
                                            </TableCell>
                                            <TableCell>
                                                <ScrollArea className="h-12 w-48 rounded border p-1 bg-muted/50">
                                                    <pre className="text-[10px]">{JSON.stringify(log.metadata, null, 2)}</pre>
                                                </ScrollArea>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        <div className="flex justify-end mt-4 gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Previous</Button>
                            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={logs.length < 50}>Next</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
};
