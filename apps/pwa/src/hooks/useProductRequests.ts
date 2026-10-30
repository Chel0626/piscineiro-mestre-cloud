'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface ProductItem {
  id: string;
  name: string;
  quantity: number;
}

export interface ProductRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  products: ProductItem[];
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  providedBy?: 'empresa' | 'cliente';
  requestDate: string;
  approvalDate?: string;
  completedAt?: string;
  userId: string;
  notes?: string;
}

export interface ProductRequestInput {
  clientId: string;
  clientName: string;
  clientPhone: string;
  products: ProductItem[];
  notes?: string;
}

export function useProductRequests() {
  const { user, tenant, role } = useAuth();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
        if (!user || !tenant) {
            setRequests([]);
            return;
        }

        let query = supabase
            .from('product_requests')
            .select('*')
            .eq('tenant_id', tenant.id);

        // Se for funcionário, vê apenas suas próprias solicitações no histórico/lista
        if (role === 'worker') {
            query = query.eq('user_id', user.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching requests:', error);
            return;
        }

        const formatted: ProductRequest[] = data.map(item => ({
            id: item.id,
            clientId: item.client_id,
            clientName: item.client_name,
            clientPhone: item.client_phone,
            products: item.products,
            status: item.status,
            providedBy: item.provided_by,
            requestDate: item.created_at || item.request_date,
            approvalDate: item.approval_date,
            userId: item.user_id,
            notes: item.notes
        }));

        setRequests(formatted);
    };

    fetchRequests();
    
    // Realtime subscription
    const setupSubscription = async () => {
        if (!user || !tenant) return;

        const channel = supabase
            .channel(`product_requests:${tenant.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'product_requests',
                filter: `tenant_id=eq.${tenant.id}`
            }, () => {
                fetchRequests();
            })
            .subscribe();
            
        return () => {
            supabase.removeChannel(channel);
        };
    };
    
    const cleanup = setupSubscription();
    return () => {
        cleanup.then(unsub => unsub && unsub());
    };
  }, [user, tenant]);

  const getActiveRequestForClient = async (clientId: string) => {
    if (!tenant) return null;
    
    const { data, error } = await supabase
        .from('product_requests')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('client_id', clientId)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
    if (error) {
        if (error.code === 'PGRST116') return null; // No results
        console.error('Error fetching active request:', error);
        return null;
    }
    
    return {
        id: data.id,
        clientId: data.client_id,
        clientName: data.client_name,
        products: data.products || (data as any).items || [],
        status: data.status,
        providedBy: data.provided_by,
        requestDate: data.created_at || data.request_date,
        userId: data.user_id,
        notes: data.notes
    } as ProductRequest;
  };

  const createRequest = async (input: ProductRequestInput) => {
      setIsLoading(true);
      try {
          if (!user || !tenant) throw new Error('Usuário não autenticado');

          const { error } = await supabase
            .from('product_requests')
            .insert({
                client_id: input.clientId,
                client_name: input.clientName,
                client_phone: input.clientPhone,
                products: input.products,
                notes: input.notes,
                user_id: user.id,
                tenant_id: tenant.id,
                status: 'pending',
                request_date: new Date().toISOString()
            });

          if (error) throw error;
          
          toast.success('Solicitação criada com sucesso!');
      } catch (error) {
          console.error('Erro ao criar solicitação:', error);
          toast.error('Erro ao criar solicitação');
      } finally {
          setIsLoading(false);
      }
  };

  const updateStatus = async (requestId: string, status: 'approved' | 'rejected' | 'completed', providedBy?: 'empresa' | 'cliente') => {
      try {
          const updateData: any = { status };
          
          if (status === 'approved') {
            updateData.approval_date = new Date().toISOString();
            if (providedBy) updateData.provided_by = providedBy;
          } else if (status === 'completed') {
            updateData.completed_at = new Date().toISOString();
          }

          const { error } = await supabase
            .from('product_requests')
            .update(updateData)
            .eq('id', requestId);

          if (error) throw error;
          
          toast.success(`Solicitação ${status === 'approved' ? 'aprovada' : status === 'completed' ? 'concluída' : 'rejeitada'}`);
          return true;
      } catch (error) {
          console.error('Erro ao atualizar status:', error);
          toast.error('Erro ao atualizar status');
          return false;
      }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedProducts = requests.filter(r => r.status === 'approved');

  return { 
    requests, 
    pendingRequests,
    approvedProducts,
    isLoading, 
    createRequest, 
    createProductRequest: createRequest,
    updateStatus,
    approveRequest: (id: string, providedBy?: 'empresa' | 'cliente') => updateStatus(id, 'approved', providedBy),
    rejectRequest: (id: string) => updateStatus(id, 'rejected'),
    completeRequest: (id: string) => updateStatus(id, 'completed'),
    getActiveRequestForClient
  };
}
