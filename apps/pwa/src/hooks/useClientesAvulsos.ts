import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface ClienteAvulso {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  tipoServico: string;
  valor: number;
  ph?: number;
  cloro?: number;
  alcalinidade?: number;
  descricaoServico?: string;
  timestamp: any; // Date or string
  mes: string; // YYYY-MM para faturamento
  clientId?: string;
}

export function useClientesAvulsos() {
  const { user, tenant } = useAuth();
  const [clientesAvulsos, setClientesAvulsos] = useState<ClienteAvulso[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !tenant) {
      setClientesAvulsos([]);
      setIsLoading(false);
      return;
    }

    const fetchClientesAvulsos = async () => {
      const { data, error } = await supabase
        .from('ad_hoc_clients')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('service_date', { ascending: false });

      if (error) {
        console.error('Erro ao buscar clientes avulsos:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          nome: item.name,
          endereco: item.address,
          telefone: item.phone,
          tipoServico: item.service_type,
          valor: item.service_value,
          ph: item.ph,
          cloro: item.chlorine,
          alcalinidade: item.alkalinity,
          descricaoServico: item.service_description,
          timestamp: item.service_date,
          mes: item.month,
          clientId: item.client_id
        }));
        setClientesAvulsos(mapped);
      }
      setIsLoading(false);
    };

    fetchClientesAvulsos();

    // Realtime subscription
    const subscription = supabase
      .channel('ad_hoc_clients_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_hoc_clients', filter: `tenant_id=eq.${tenant.id}` }, () => {
        fetchClientesAvulsos();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, tenant]);

  return { clientesAvulsos, isLoading };
}

// Hook para buscar clientes avulsos de um mês específico (para faturamento)
export function useClientesAvulsosMes(mes: string) {
  const { user, tenant } = useAuth();
  const [clientesAvulsos, setClientesAvulsos] = useState<ClienteAvulso[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mes || !user || !tenant) {
      setClientesAvulsos([]);
      setIsLoading(false);
      return;
    }

    const fetchClientesAvulsos = async () => {
      const { data, error } = await supabase
        .from('ad_hoc_clients')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('month', mes)
        .order('service_date', { ascending: false });

      if (error) {
        console.error('Erro ao buscar clientes avulsos do mês:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          nome: item.name,
          endereco: item.address,
          telefone: item.phone,
          tipoServico: item.service_type,
          valor: item.service_value,
          ph: item.ph,
          cloro: item.chlorine,
          alcalinidade: item.alkalinity,
          descricaoServico: item.service_description,
          timestamp: item.service_date,
          mes: item.month,
          clientId: item.client_id
        }));
        setClientesAvulsos(mapped);
      }
      setIsLoading(false);
    };

    fetchClientesAvulsos();
  }, [mes, user, tenant]);

  return { clientesAvulsos, isLoading };
}
