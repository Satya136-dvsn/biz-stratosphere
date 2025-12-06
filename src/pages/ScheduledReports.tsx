import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Download } from 'lucide-react';
import { useState } from 'react';

export function ScheduledReports() {
    const [reports, setReports] = useState<any[]>([]);
    const [showWizard, setShowWizard] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Scheduled Reports</h2>
                    <p className="text-muted-foreground">
                        Automatically generate and send reports on schedule
                    </p>
                </div>
                <Button onClick={() => setShowWizard(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Report
                </Button>
            </div>

            {reports.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No scheduled reports</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Create your first scheduled report to automate data delivery
                        </p>
                        <Button onClick={() => setShowWizard(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Report
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {reports.map((report, idx) => (
                        <Card key={idx}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>{report.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {report.schedule}
                                        </p>
                                    </div>
                                    <Badge>{report.enabled ? 'Active' : 'Paused'}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Type:</span> {report.report_type}
                                    </div>
                                    <div>
                                        <span className="font-medium">Recipients:</span> {report.recipients.length}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Report Creation Wizard - Simplified */}
            {showWizard && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-2xl">
                        <CardHeader>
                            <CardTitle>Create Scheduled Report</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Report Name *</Label>
                                <Input placeholder="Weekly KPI Summary" />
                            </div>
                            <div>
                                <Label>Report Type *</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="kpi_summary">KPI Summary</SelectItem>
                                        <SelectItem value="trend_analysis">Trend Analysis</SelectItem>
                                        <SelectItem value="custom">Custom Report</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Schedule *</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Recipients *</Label>
                                <Input placeholder="email@example.com (comma-separated)" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setShowWizard(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={() => {
                                    // Save logic here
                                    setShowWizard(false);
                                }}>
                                    Create Report
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
