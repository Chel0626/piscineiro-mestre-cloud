import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface VisitProductRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  productsToRequest: string;
  requestDate: string;
  userId: string;
}

export function useVisitProductRequests() {
  const { user, tenant } = useAuth();
  const [requests, setRequests] = useState<VisitProductRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user || !tenant) {
        setRequests([]);
        return;
      }
      setIsLoading(true);
      const { data, error } = await supabase
        .from('visits')
        .select('id, client_id, client_name, client_phone, products_to_request, created_at, user_id')
        .eq('tenant_id', tenant.id)
        .neq('products_to_request', null)
        .order('created_at', { ascending: false });
      setIsLoading(false);
      if (error) {
        console.error('Error fetching visit product requests:', error);
        return;
      }
      const formatted: VisitProductRequest[] = data.map((item: any) => ({
        id: item.id,
        clientId: item.client_id,
        clientName: item.client_name,
        clientPhone: item.client_phone,
        productsToRequest: item.products_to_request,
        requestDate: item.created_at,
        userId: item.user_id,
      }));
      setRequests(formatted);
    };
    fetchRequests();
  }, [user, tenant]);

  return { requests, isLoading };
}
