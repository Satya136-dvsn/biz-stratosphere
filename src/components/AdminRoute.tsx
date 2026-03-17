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
        if (!loading && !roleLoading) {
            if (!user) {
                navigate('/auth');
            } else if (!isAdmin()) {
                navigate('/dashboard'); // or /unauthorized
            }
        }
    }, [user, loading, roleLoading, isAdmin, navigate]);

    if (loading || roleLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return isAdmin() ? <>{children}</> : null;
};
