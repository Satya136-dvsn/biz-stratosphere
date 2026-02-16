// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
    user_id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    company_name: string | null;
    role: string | null;
    created_at: string;
    updated_at: string;
}

export function useProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch profile data
    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        async function fetchProfile() {
            try {
                setLoading(true);
                setError(null);

                const { data, error: fetchError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (fetchError) {
                    throw fetchError;
                }

                setProfile(data);
            } catch (err: any) {
                console.error('Error fetching profile:', err);
                setError(err.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [user?.id]);

    // Update profile
    const updateProfile = async (updates: Partial<Omit<UserProfile, 'user_id' | 'created_at' | 'updated_at'>>) => {
        if (!user?.id) {
            setError('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }

        try {
            setUpdating(true);
            setError(null);

            const { data, error: updateError } = await supabase
                .from('profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id)
                .select()
                .single();

            if (updateError) {
                throw updateError;
            }

            setProfile(data);
            return { success: true, data };
        } catch (err: any) {
            console.error('Error updating profile:', err);
            const errorMessage = err.message || 'Failed to update profile';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setUpdating(false);
        }
    };

    return {
        profile,
        loading,
        updating,
        error,
        updateProfile,
    };
}
