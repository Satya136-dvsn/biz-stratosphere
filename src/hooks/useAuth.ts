// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from '@supabase/supabase-js';
import { setUserContext } from '@/lib/errorTracking';

export type UserRole = 'admin' | 'user' | 'super_admin';

// ─── MFA Session Binding ─────────────────────────────────
const MFA_SESSION_KEY = 'biz_mfa_verified';
const MFA_SESSION_EXPIRY_KEY = 'biz_mfa_verified_at';
const MFA_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function markMFAVerified() {
  sessionStorage.setItem(MFA_SESSION_KEY, 'true');
  sessionStorage.setItem(MFA_SESSION_EXPIRY_KEY, Date.now().toString());
}

function isMFASessionValid(): boolean {
  const verified = sessionStorage.getItem(MFA_SESSION_KEY);
  const verifiedAt = sessionStorage.getItem(MFA_SESSION_EXPIRY_KEY);
  if (verified !== 'true' || !verifiedAt) return false;
  const elapsed = Date.now() - parseInt(verifiedAt, 10);
  return elapsed < MFA_SESSION_TTL_MS;
}

function clearMFASession() {
  sessionStorage.removeItem(MFA_SESSION_KEY);
  sessionStorage.removeItem(MFA_SESSION_EXPIRY_KEY);
}

export { markMFAVerified, isMFASessionValid, clearMFASession };

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Bind Sentry user context for error tracking
        if (session?.user) {
          setUserContext({
            id: session.user.id,
            email: session.user.email ?? undefined,
          });
        } else {
          setUserContext({ id: '' }); // clear on sign out
          clearMFASession();
        }

        // Fetch user role when session changes
        if (session?.user) {
          setTimeout(() => fetchUserRole(session.user.id), 0);
        } else {
          setUserRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    // Phase 1: Fetch role from profiles (Single Source of Truth)
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (data && data.role) {
      // Map DB role 'admin' to Frontend 'super_admin' or just use 'admin'
      // For simplicity and matching migration, we use 'admin'
      setUserRole(data.role as UserRole);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };
      return { data, error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email,
          },
        },
      });

      if (error) return { error };
      return { data, error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      return { error };
    }
    return { error: null };
  };

  const hasRole = (role: UserRole) => userRole === role;

  const isAdmin = () => userRole === 'admin' || userRole === 'super_admin';

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!session,
    userRole,
    hasRole,
    isAdmin,
  };
}