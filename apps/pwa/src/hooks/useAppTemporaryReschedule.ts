'use client';

import { useAuth } from '@/context/AuthContext';
import { useTemporaryReschedule as useSharedTemporaryReschedule, TemporaryReschedule } from '@piscineiro/shared';
import { toast } from 'sonner';
import { useCallback } from 'react';

export type { TemporaryReschedule };

export function useAppTemporaryReschedule() {
  console.log('useAppTemporaryReschedule hook called');
  const { user, tenant } = useAuth();
  const { 
    reschedules = [], 
    isLoading, 
    error, 
    rescheduleClient: sharedRescheduleClient, 
    cancelReschedule: sharedCancelReschedule 
  } = useSharedTemporaryReschedule(tenant?.id, user?.id);

  const rescheduleClient = async (
    clientId: string, 
    clientName: string, 
    originalDay: string, 
    newDay: string
  ) => {
    const result = await sharedRescheduleClient(clientId, clientName, originalDay, newDay);
    if (result.success) {
      toast.success('Cliente reagendado com sucesso!');
      return true;
    } else {
      toast.error(result.error || 'Erro ao reagendar cliente');
      return false;
    }
  };

  const cancelReschedule = async (rescheduleId: string) => {
    const result = await sharedCancelReschedule(rescheduleId);
    if (result.success) {
      toast.success('Reagendamento cancelado');
    } else {
      toast.error(result.error || 'Erro ao cancelar reagendamento');
    }
  };

  const getClientsForDay = useCallback((day: string) => {
    if (!reschedules) return [];
    return reschedules.filter(r => r.newDay === day);
  }, [reschedules]);

  const isClientMovedAway = useCallback((clientId: string, originalDay: string) => {
    if (!reschedules) return false;
    return reschedules.some(r => r.clientId === clientId && r.originalDay === originalDay);
  }, [reschedules]);

  const getClientReschedule = useCallback((clientId: string) => {
    if (!reschedules) return undefined;
    return reschedules.find(r => r.clientId === clientId);
  }, [reschedules]);

  const returnValue = { 
    reschedules, 
    isLoading, 
    rescheduleClient, 
    cancelReschedule,
    getClientsForDay,
    isClientMovedAway,
    getClientReschedule
  };
  console.log('useAppTemporaryReschedule returning:', returnValue);
  return returnValue;
}
