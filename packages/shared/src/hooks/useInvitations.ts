import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';

export interface Invitation {
  id: string;
  tenant_id: string;
  email: string;
  role: 'superadmin' | 'owner' | 'worker' | 'solo';
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
}

export function useInvitations(tenantId?: string) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!tenantId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data as Invitation[]);
    } catch (err: any) {
      console.error('Error fetching invitations:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const createInvitation = async (email: string, role: 'worker' | 'owner' = 'worker') => {
    if (!tenantId) return { success: false, error: 'No tenant ID' };

    try {
      // Generate a random token (simple version)
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          tenant_id: tenantId,
          email,
          role,
          token,
          invited_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setInvitations(prev => [data as Invitation, ...prev]);
      return { success: true, data };
    } catch (err: any) {
      console.error('Error creating invitation:', err);
      return { success: false, error: err.message };
    }
  };

  const cancelInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInvitations(prev => prev.filter(inv => inv.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Error canceling invitation:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    invitations,
    isLoading,
    error,
    fetchInvitations,
    createInvitation,
    cancelInvitation
  };
}
