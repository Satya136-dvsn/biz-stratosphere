import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface RuleTemplate {
    id: string;
    category: string;
    name: string;
    description: string;
    icon: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    trigger_type: string;
    condition: any;
    action_type: string;
    action_config: any;
    schedule_type: string;
    schedule_config: any;
    advanced_config: any;
    tags: string[];
    is_featured: boolean;
    usage_count: number;
}

export function useRuleTemplates() {
    const [templates, setTemplates] = useState<RuleTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('automation_rule_templates')
                .select('*')
                .order('is_featured', { ascending: false })
                .order('usage_count', { ascending: false });

            if (error) throw error;
            setTemplates(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getTemplatesByCategory = (category: string) => {
        return templates.filter((t) => t.category === category);
    };

    const getFeaturedTemplates = () => {
        return templates.filter((t) => t.is_featured);
    };

    const getTemplatesByDifficulty = (difficulty: string) => {
        return templates.filter((t) => t.difficulty === difficulty);
    };

    const searchTemplates = (query: string) => {
        const lowerQuery = query.toLowerCase();
        return templates.filter(
            (t) =>
                t.name.toLowerCase().includes(lowerQuery) ||
                t.description.toLowerCase().includes(lowerQuery) ||
                t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
    };

    const createRuleFromTemplate = async (
        templateId: string,
        ruleName: string,
        customizations?: any
    ): Promise<{ success: boolean; ruleId?: string; error?: string }> => {
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) {
                return { success: false, error: 'User not authenticated' };
            }

            const { data, error } = await supabase.rpc('create_rule_from_template', {
                p_user_id: userData.user.id,
                p_template_id: templateId,
                p_rule_name: ruleName,
                p_customizations: customizations || {},
            });

            if (error) throw error;

            return { success: true, ruleId: data };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    return {
        templates,
        isLoading,
        error,
        getTemplatesByCategory,
        getFeaturedTemplates,
        getTemplatesByDifficulty,
        searchTemplates,
        createRuleFromTemplate,
        refetch: fetchTemplates,
    };
}
