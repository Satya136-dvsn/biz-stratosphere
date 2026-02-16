// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


import { PageLayout } from "@/components/layout/PageLayout";
import { useAdminAI, MLModel } from "@/hooks/useAdminAI";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Brain, Activity, BarChart, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export const AIControl = () => {
    const { models, isLoading, toggleModel } = useAdminAI();

    return (
        <PageLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI & ML Control</h1>
                    <p className="text-muted-foreground">Manage adoption and performance of Machine Learning models.</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {models.map((model) => (
                            <Card key={model.id} className={!model.is_active ? "opacity-75 bg-muted/50" : ""}>
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Brain className="h-5 w-5 text-primary" />
                                                {model.name}
                                            </CardTitle>
                                            <CardDescription>Version {model.version} • {model.type}</CardDescription>
                                        </div>
                                        <Switch
                                            checked={model.is_active}
                                            onCheckedChange={(checked) => toggleModel({ id: model.id, active: checked })}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3" /> Accuracy</p>
                                            <p className="text-lg font-bold">{(model.accuracy * 100).toFixed(1)}%</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><BarChart className="h-3 w-3" /> Inferences</p>
                                            <p className="text-lg font-bold">{model.total_predictions.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Last used: {model.last_used_at ? new Date(model.last_used_at).toLocaleDateString() : 'Never'}
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant={model.is_active ? "default" : "secondary"}>
                                            {model.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                        <Badge variant="outline">
                                            Conf: {(model.avg_confidence * 100).toFixed(0)}%
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </PageLayout>
    );
};
