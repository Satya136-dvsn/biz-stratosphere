import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Company {
  id: string;
  name: string;
  subdomain: string | null;
  settings: any;
  subscription_tier: string;
  max_users: number;
  created_at: string;
  updated_at: string;
}

export interface UserPermission {
  id: string;
  resource_type: string;
  resource_id: string | null;
  permission: 'read' | 'write' | 'delete' | 'admin';
  granted_by: string;
  created_at: string;
}

export function useCompany() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCompanyData();
    } else {
      setCompany(null);
      setPermissions([]);
      setLoading(false);
    }
  }, [user]);

  const fetchCompanyData = async () => {
    try {
      // Get user's profile and company
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          companies (*)
        `)
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;

      if (profile.companies) {
        setCompany(profile.companies as Company);
      }

      // Get user's permissions
      const { data: userPermissions, error: permError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user?.id);

      if (permError) throw permError;

      setPermissions(userPermissions || []);
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (resourceType: string, permission: 'read' | 'write' | 'delete' | 'admin', resourceId?: string) => {
    // Super admin and company admin have all permissions
    const profile = user?.user_metadata;
    if (profile?.role === 'super_admin' || profile?.role === 'company_admin') {
      return true;
    }

    // Check specific permissions
    return permissions.some(p => 
      p.resource_type === resourceType &&
      p.permission === permission &&
      (p.resource_id === null || p.resource_id === resourceId)
    );
  };

  const updateCompany = async (updates: Partial<Company>) => {
    if (!company) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', company.id)
        .select()
        .single();

      if (error) throw error;

      setCompany(data);
      return { data, error: null };
    } catch (error) {
      console.error('Error updating company:', error);
      return { data: null, error };
    }
  };

  const grantPermission = async (
    userId: string,
    resourceType: string,
    permission: 'read' | 'write' | 'delete' | 'admin',
    resourceId?: string
  ) => {
    if (!company) return;

    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .insert({
          user_id: userId,
          company_id: company.id,
          resource_type: resourceType,
          resource_id: resourceId || null,
          permission,
          granted_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh permissions if it's for the current user
      if (userId === user?.id) {
        await fetchCompanyData();
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error granting permission:', error);
      return { data: null, error };
    }
  };

  const revokePermission = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('id', permissionId);

      if (error) throw error;

      await fetchCompanyData();
      return { error: null };
    } catch (error) {
      console.error('Error revoking permission:', error);
      return { error };
    }
  };

  return {
    company,
    permissions,
    loading,
    hasPermission,
    updateCompany,
    grantPermission,
    revokePermission,
    refetch: fetchCompanyData,
  };
}