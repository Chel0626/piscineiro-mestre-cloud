'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';

export interface TemporaryReschedule {
  id: string;
  clientId: string;
  clientName: string;
  originalDay: string;
  newDay: string;
  userId: string;
  createdAt: string;
}

export function useTemporaryReschedule(tenantId?: string, userId?: string) {
  const [reschedules, setReschedules] = useState<TemporaryReschedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReschedules = async () => {
      if (!tenantId) {
        setReschedules([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('temporary_reschedules')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('Erro ao carregar reagendamentos:', error);
        setError('Erro ao carregar reagendamentos temporários');
        return;
      }

      const formatted: TemporaryReschedule[] = data.map(item => ({
        id: item.id,
        clientId: item.client_id,
        clientName: item.client_name,
        originalDay: item.original_day,
        newDay: item.new_day,
        userId: item.user_id,
        createdAt: item.created_at
      }));
      
      setReschedules(formatted);
  };

  useEffect(() => {
    fetchReschedules();
  }, [tenantId]);

  const rescheduleClient = async (
    clientId: string, 
    clientName: string, 
    originalDay: string, 
    newDay: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!userId || !tenantId) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('temporary_reschedules')
        .insert({
          client_id: clientId,
          client_name: clientName,
          original_day: originalDay,
          new_day: newDay,
          user_id: userId,
          tenant_id: tenantId
        });

      if (error) throw error;

      await fetchReschedules();
      return { success: true };

    } catch (error: any) {
      console.error('Erro ao reagendar:', error);
      setError(error.message || 'Erro ao reagendar cliente');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const cancelReschedule = async (rescheduleId: string) => {
      try {
          const { error } = await supabase
            .from('temporary_reschedules')
            .delete()
            .eq('id', rescheduleId);
            
          if (error) throw error;
          
          setReschedules(prev => prev.filter(r => r.id !== rescheduleId));
          return { success: true };
      } catch (error: any) {
          console.error('Erro ao cancelar:', error);
          return { success: false, error: error.message };
      }
  };

  return { reschedules, isLoading, error, rescheduleClient, cancelReschedule, refetch: fetchReschedules };
}
