import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RefreshCw, Zap, Database } from 'lucide-react';
import { PageLayout } from "@/components/layout/PageLayout";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define the shape of our streaming data
interface StreamEvent {
    id: string;
    timestamp: string;
    value: number;
    category: string;
    status: 'pending' | 'processed';
}

export default function StreamingETL() {
    const [isStreaming, setIsStreaming] = useState(false);
    const [events, setEvents] = useState<StreamEvent[]>([]);
    const [processedCount, setProcessedCount] = useState(0);
    const [ingestionRate, setIngestionRate] = useState(0);
    const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const { toast } = useToast();

    // Simulate streaming data generation
    useEffect(() => {
        if (isStreaming) {
            streamIntervalRef.current = setInterval(() => {
                const newEvent: StreamEvent = {
                    id: crypto.randomUUID(),
                    timestamp: new Date().toLocaleTimeString(),
                    value: Math.floor(Math.random() * 100),
                    category: ['Sales', 'Traffic', 'Errors'][Math.floor(Math.random() * 3)],
                    status: 'pending'
                };

                setEvents(prev => {
                    const newEvents = [...prev, newEvent];
                    if (newEvents.length > 50) newEvents.shift(); // Keep window small
                    return newEvents;
                });

                // Simulate ETL Processing: Immediate "processed" status flip
                // In a real app, this would be an Edge Function processing the row
                setTimeout(() => {
                    setEvents(current =>
                        current.map(e => e.id === newEvent.id ? { ...e, status: 'processed' } : e)
                    );
                    setProcessedCount(c => c + 1);
                }, 500); // 500ms processing latency

                setIngestionRate(Math.floor(Math.random() * 20) + 10); // 10-30 events/sec simulated
            }, 1000); // 1 event per second for visualization (scaled down)
        } else {
            if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
            setIngestionRate(0);
        }

        return () => {
            if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
        };
    }, [isStreaming]);

    const toggleStream = () => {
        setIsStreaming(!isStreaming);
        if (!isStreaming) {
            toast({
                title: "Stream Started",
                description: "Ingesting synthetic events into ETL pipeline...",
            });
        } else {
            toast({
                title: "Stream Paused",
                description: "Ingestion stopped.",
            });
        }
    };

    const clearStream = () => {
        setEvents([]);
        setProcessedCount(0);
        setIsStreaming(false);
    };

    return (
        <PageLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Streaming ETL Pipeline</h2>
                    <p className="text-muted-foreground">Real-time data ingestion and transformation simulation</p>
                </div>
                <div className="flex gap-2">
                    <Button variant={isStreaming ? "destructive" : "default"} onClick={toggleStream}>
                        {isStreaming ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {isStreaming ? "Pause Stream" : "Start Stream"}
                    </Button>
                    <Button variant="outline" onClick={clearStream}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingestion Rate</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{ingestionRate} ev/s</div>
                        <p className="text-xs text-muted-foreground">Current event throughput</p>
                        <Progress value={ingestionRate * 3} className="h-1 mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Processed Events</CardTitle>
                        <Database className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{processedCount}</div>
                        <p className="text-xs text-muted-foreground">Total records transformed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pipeline Latency</CardTitle>
                        <RefreshCw className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">~500ms</div>
                        <p className="text-xs text-muted-foreground">Average processing time</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Live Stream Visualization */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Live Data Stream</CardTitle>
                        <CardDescription>Real-time values from ingested events</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={events}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Event Log */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Processing Log</CardTitle>
                        <CardDescription>Recent ETL operations</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] overflow-y-auto pr-2">
                        <div className="space-y-2">
                            {events.slice().reverse().map((event) => (
                                <div key={event.id} className="flex items-center justify-between p-2 border rounded-md bg-secondary/10 text-sm">
                                    <div className="flex items-center gap-3">
                                        <Badge variant={event.status === 'processed' ? "default" : "secondary"}>
                                            {event.status}
                                        </Badge>
                                        <span>{event.category} Event</span>
                                    </div>
                                    <div className="text-muted-foreground font-mono">
                                        Val: {event.value} | {event.timestamp}
                                    </div>
                                </div>
                            ))}
                            {events.length === 0 && (
                                <div className="text-center text-muted-foreground py-8">
                                    Stream is idle. Click "Start Stream" to begin.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}
