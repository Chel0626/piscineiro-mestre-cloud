import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/userRoles';

export interface SubscriptionState {
  hasActiveSubscription: boolean; // Se true, pode acessar o app (Free ou Pro)
  isPro: boolean; // Se true, tem recursos ilimitados
  isLoading: boolean;
  planId?: string;
  status?: string;
}

export function useSubscription(): SubscriptionState {
  const { user, authLoading, role } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    hasActiveSubscription: false,
    isPro: false,
    isLoading: true,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setState({ hasActiveSubscription: false, isPro: false, isLoading: false });
      return;
    }

    // Super Admin sempre tem acesso
    if (isSuperAdmin(user.id)) {
      setState({
        hasActiveSubscription: true,
        isPro: true,
        isLoading: false,
        planId: 'super_admin',
        status: 'active'
      });
      return;
    }

    // Workers e Solos (temporário) não precisam de assinatura individual
    if (role === 'worker' || role === 'solo') {
      setState({
        hasActiveSubscription: true,
        isPro: true,
        isLoading: false,
        planId: role === 'worker' ? 'worker_access' : 'solo_unlimited',
        status: 'active'
      });
      return;
    }
    
    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
           console.error('Error fetching subscription:', error);
        }

        if (!data) {
           setState({
            hasActiveSubscription: false,
            isPro: false,
            isLoading: false
          });
          return;
        }

        const isActive = ['active', 'trialing', 'authorized'].includes(data.status);
        const isPro = isActive && data.plan_id !== 'free';

        setState({
          hasActiveSubscription: isActive,
          isPro: isPro,
          isLoading: false,
          planId: data.plan_id,
          status: data.status
        });

      } catch (err) {
        console.error('Unexpected error in useSubscription:', err);
        setState({ hasActiveSubscription: false, isPro: false, isLoading: false });
      }
    };

    fetchSubscription();

    const channel = supabase
      .channel(`subscriptions:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchSubscription();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading, role]);

  return state;
}
