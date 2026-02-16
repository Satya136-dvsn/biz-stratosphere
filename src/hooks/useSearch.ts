// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SearchResult {
    id: string;
    type: 'dataset' | 'page';
    title: string;
    description?: string;
    path?: string;
    icon?: string;
}

const pages: SearchResult[] = [
    { id: 'dashboard', type: 'page', title: 'Dashboard', path: '/dashboard', icon: 'BarChart3' },
    { id: 'reports', type: 'page', title: 'Reports', path: '/reports', icon: 'FileText' },
    { id: 'enterprise', type: 'page', title: 'Enterprise', path: '/enterprise', icon: 'Building2' },
    { id: 'profile', type: 'page', title: 'Profile', path: '/profile', icon: 'User' },
    { id: 'settings', type: 'page', title: 'Settings', path: '/settings', icon: 'Settings' },
];

export function useSearch(query: string) {
    const { user } = useAuth();

    // Fetch datasets
    const { data: datasets = [] } = useQuery({
        queryKey: ['datasets', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('datasets')
                .select('id, file_name, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching datasets:', error);
                return [];
            }

            return data || [];
        },
        enabled: !!user,
    });

    // Search logic
    const results = useMemo(() => {
        if (!query || query.trim().length === 0) {
            return [];
        }

        const searchTerm = query.toLowerCase().trim();
        const matchedResults: SearchResult[] = [];

        // Search pages
        pages.forEach(page => {
            if (page.title.toLowerCase().includes(searchTerm)) {
                matchedResults.push(page);
            }
        });

        // Search datasets
        datasets.forEach(dataset => {
            if (dataset.file_name.toLowerCase().includes(searchTerm)) {
                matchedResults.push({
                    id: dataset.id,
                    type: 'dataset',
                    title: dataset.file_name,
                    description: `Uploaded ${new Date(dataset.created_at).toLocaleDateString()}`,
                    icon: 'FileUp',
                });
            }
        });

        return matchedResults.slice(0, 10); // Limit to 10 results
    }, [query, datasets]);

    return {
        results,
        isSearching: query.trim().length > 0,
        hasResults: results.length > 0,
    };
}
