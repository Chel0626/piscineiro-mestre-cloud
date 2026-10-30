'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useClients } from './useClients';
import { usePayments } from './usePayments';

export interface BillingData {
  totalMensal: number;
  totalAnual: number;
  clientesAtivos: number;
  proximoVencimento: string;
  recebimentosPendentes: number;
  recebimentosAvulsos: number;
}

export function useBilling(): BillingData {
  const { user, tenant, authLoading } = useAuth();
  const { clients } = useClients();
  const { getPaymentStatus } = usePayments();
  const [recebimentosAvulsos, setRecebimentosAvulsos] = useState(0);

  useEffect(() => {
    if (!user || !tenant) return;

    const fetchAvulsos = async () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('ad_hoc_clients')
            .select('service_value')
            .eq('tenant_id', tenant.id)
            .eq('status', 'paid')
            .gte('service_date', firstDay)
            .lte('service_date', lastDay);
            
        if (error) {
            console.error('Error fetching avulsos:', error);
            return;
        }
        
        const total = (data || []).reduce((acc, curr) => acc + (Number(curr.service_value) || 0), 0);
        setRecebimentosAvulsos(total);
    };

    fetchAvulsos();
    
    const channel = supabase
        .channel(`billing_avulsos:${tenant.id}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'ad_hoc_clients',
            filter: `tenant_id=eq.${tenant.id}`
        }, () => {
            fetchAvulsos();
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [user, tenant]);
  if (authLoading) {
    return {
      totalMensal: 0,
      totalAnual: 0,
      clientesAtivos: 0,
      proximoVencimento: '',
      recebimentosPendentes: 0,
      recebimentosAvulsos: 0
    };
  }

  const activeClients = clients.filter(c => c.active);
    const totalMensal = activeClients.reduce((acc, c) => acc + (c.serviceValue || 0), 0);
    const totalAnual = totalMensal * 12;
  
  const pendentes = activeClients.filter(c => {
      const status = getPaymentStatus(c);
      return status === 'pending' || status === 'overdue';
    }).reduce((acc, c) => acc + (c.serviceValue || 0), 0);
    
  const today = new Date();
  const currentDay = today.getDate();
  
  let nextDueDay = 32;
  let foundThisMonth = false;

  activeClients.forEach(c => {
      const dueDay = parseInt(c.paymentDate || '5');
      if (dueDay >= currentDay) {
          if (dueDay < nextDueDay) {
              nextDueDay = dueDay;
              foundThisMonth = true;
          }
      }
  });
  
  if (!foundThisMonth && activeClients.length > 0) {
      // Next month, find the smallest due day
      nextDueDay = activeClients.reduce((min, c) => Math.min(min, parseInt(c.paymentDate || '5')), 32);
  }
  
  const proximoVencimento = activeClients.length === 0 ? '-' : (foundThisMonth ? `${nextDueDay}/${today.getMonth() + 1}` : `${nextDueDay}/${today.getMonth() + 2 > 12 ? 1 : today.getMonth() + 2}`);

  return {
      totalMensal,
      totalAnual,
      clientesAtivos: activeClients.length,
      proximoVencimento,
      recebimentosPendentes: pendentes,
      recebimentosAvulsos
  };
}
