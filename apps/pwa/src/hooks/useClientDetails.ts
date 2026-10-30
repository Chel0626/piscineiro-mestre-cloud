'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ClientFormData } from '@/lib/validators/clientSchema';
import { VisitFormData } from '@/components/VisitForm';
import { mapClientFromDB, mapVisitFromDB } from '@/lib/supabase-mappers';

// Tipos de dados
interface ClientDetails extends ClientFormData {
  id: string;
  tenant_id?: string;
  inventory?: import('@/components/InventoryCard').InventoryItem[];
}

interface Visit extends VisitFormData {
  id: string;
  timestamp: string;
}

export function useClientDetails(clientId: string | null) {
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setIsLoading(false);
      return;
    }

    const fetchClient = async () => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();
        
        if (error) {
            console.error("Erro ao buscar detalhes do cliente:", error);
            toast.error('Não foi possível carregar os dados do cliente.');
            setClient(null);
        } else if (data) {
            setClient(mapClientFromDB(data));
        }
        setIsLoading(false);
    };

    const fetchVisits = async () => {
        const { data, error } = await supabase
            .from('client_visits')
            .select('*')
            .eq('client_id', clientId)
            .order('date', { ascending: false })
            .limit(20);
        
        if (error) {
            console.error("Erro ao buscar visitas:", error);
        } else if (data) {
            setVisits(data.map(mapVisitFromDB));
        }
    };

    fetchClient();
    fetchVisits();

    // Realtime subscriptions
    const clientSub = supabase
        .channel(`client_${clientId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients', filter: `id=eq.${clientId}` }, (payload) => {
            fetchClient();
        })
        .subscribe();

    const visitsSub = supabase
        .channel(`visits_${clientId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'visits', filter: `client_id=eq.${clientId}` }, (payload) => {
            fetchVisits();
        })
        .subscribe();

    return () => {
        clientSub.unsubscribe();
        visitsSub.unsubscribe();
    };
  }, [clientId]);

  return { client, visits, isLoading };
}
