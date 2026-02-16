// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState } from 'react';
import { useRuleTemplates, RuleTemplate } from '@/hooks/useRuleTemplates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DollarSign, Users, TrendingUp, Activity, Rocket,
    AlertTriangle, Percent, Calendar, UserPlus, Search, Star
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
    DollarSign,
    Users,
    TrendingUp,
    Activity,
    Rocket,
    AlertTriangle,
    Percent,
    Calendar,
    UserPlus,
};

const DIFFICULTY_COLORS = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

interface TemplateCardProps {
    template: RuleTemplate;
    onUse: (template: RuleTemplate) => void;
}

function TemplateCard({ template, onUse }: TemplateCardProps) {
    const Icon = ICON_MAP[template.icon] || Activity;

    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className={DIFFICULTY_COLORS[template.difficulty]}>
                                    {template.difficulty}
                                </Badge>
                                {template.is_featured && (
                                    <Badge variant="default" className="bg-amber-500">
                                        <Star className="h-3 w-3 mr-1" />
                                        Featured
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <CardDescription className="mt-3">{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                    {template.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                        </Badge>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                    <div>
                        <span className="font-medium">Trigger:</span> {template.trigger_type}
                    </div>
                    <div>
                        <span className="font-medium">Action:</span> {template.action_type}
                    </div>
                    <div>
                        <span className="font-medium">Schedule:</span> {template.schedule_type}
                    </div>
                    <div>
                        <span className="font-medium">Used:</span> {template.usage_count}× times
                    </div>
                </div>

                <Button onClick={() => onUse(template)} className="w-full" size="sm">
                    Use This Template
                </Button>
            </CardContent>
        </Card>
    );
}

interface TemplateBrowserProps {
    onSelectTemplate: (template: RuleTemplate) => void;
}

export function TemplateBrowser({ onSelectTemplate }: TemplateBrowserProps) {
    const { templates, isLoading, getFeaturedTemplates, getTemplatesByCategory, searchTemplates } =
        useRuleTemplates();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('featured');

    const displayedTemplates = searchQuery
        ? searchTemplates(searchQuery)
        : activeTab === 'featured'
            ? getFeaturedTemplates()
            : getTemplatesByCategory(activeTab);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold mb-2">Rule Templates</h2>
                <p className="text-muted-foreground">
                    Choose from our curated collection of pre-configured automation rules
                </p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search templates..."
                    className="pl-10"
                />
            </div>

            {/* Category Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="featured">
                        <Star className="h-4 w-4 mr-2" />
                        Featured
                    </TabsTrigger>
                    <TabsTrigger value="revenue">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Revenue
                    </TabsTrigger>
                    <TabsTrigger value="customer">
                        <Users className="h-4 w-4 mr-2" />
                        Customer
                    </TabsTrigger>
                    <TabsTrigger value="performance">
                        <Activity className="h-4 w-4 mr-2" />
                        Performance
                    </TabsTrigger>
                    <TabsTrigger value="growth">
                        <Rocket className="h-4 w-4 mr-2" />
                        Growth
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    {displayedTemplates.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No templates found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayedTemplates.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onUse={onSelectTemplate}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{templates.length}</div>
                        <p className="text-sm text-muted-foreground">Total Templates</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{getFeaturedTemplates().length}</div>
                        <p className="text-sm text-muted-foreground">Featured</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                            {templates.reduce((sum, t) => sum + t.usage_count, 0)}
                        </div>
                        <p className="text-sm text-muted-foreground">Times Used</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
