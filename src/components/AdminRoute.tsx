// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading, roleLoading, isAdmin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Wait until both auth + role are resolved to avoid redirect flicker.
        // However, if we're not loading and user is missing, go to auth.
        // If we have a user but are still roleLoading, we wait.
        if (!loading) {
            if (!user) {
                navigate('/auth');
            } else if (!roleLoading && !isAdmin()) {
                navigate('/dashboard');
            }
        }
    }, [user, loading, roleLoading, isAdmin, navigate]);

    // If we're loading either base auth or specific role, show the loader.
    // BUT only if we have a user. If no user, the useEffect will redirect.
    if (loading || (user && roleLoading)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-40" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">VERIFYING_AUTHORITY...</span>
                </div>
            </div>
        );
    }

    // Final check to prevent rendering children if not admin
    if (!user || !isAdmin()) {
        return null;
    }

    return <>{children}</>;
};
