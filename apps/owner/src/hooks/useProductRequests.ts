'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface ProductRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  products: any[];
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  providedBy?: 'empresa' | 'cliente';
  requestDate: string;
  approvalDate?: string;
  userId: string;
  notes?: string;
}

export interface ProductRequestInput {
  clientId: string;
  clientName: string;
  clientPhone: string;
  products: any[];
  notes?: string;
}

export function useProductRequests() {
  const { user, tenant } = useAuth();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
        if (!user || !tenant) {
            setRequests([]);
            return;
        }

        const { data, error } = await supabase
            .from('product_requests')
            .select('*')
            .eq('tenant_id', tenant.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching requests:', error);
            return;
        }

        const formattedRequests: ProductRequest[] = data.map(item => ({
            id: item.id,
            clientId: item.client_id,
            clientName: item.client_name,
            clientPhone: item.client_phone,
            products: item.products,
            status: item.status,
            providedBy: item.provided_by,
            requestDate: item.created_at, // Usando created_at como fallback
            approvalDate: item.approval_date,
            userId: item.user_id,
            notes: item.notes
        }));

        setRequests(formattedRequests);
    };

    fetchRequests();

    if (tenant) {
        const channel = supabase
            .channel('product_requests_changes')
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
            channel.unsubscribe();
        };
    }
  }, [user, tenant]);

  const createRequest = async (input: ProductRequestInput) => {
    if (!user || !tenant) return;
    setIsLoading(true);
    try {
        const { error } = await supabase.from('product_requests').insert({
            tenant_id: tenant.id,
            user_id: user.id,
            client_id: input.clientId,
            client_name: input.clientName,
            client_phone: input.clientPhone,
            products: input.products,
            status: 'pending',
            notes: input.notes
        });

        if (error) throw error;
    } catch (error) {
        console.error('Error creating request:', error);
        throw error;
    } finally {
        setIsLoading(false);
    }
  };

  const updateStatus = async (requestId: string, status: 'approved' | 'rejected' | 'completed', providedBy?: 'empresa' | 'cliente') => {
    setIsLoading(true);
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
    } catch (error) {
        console.error('Error updating status:', error);
        throw error;
    } finally {
        setIsLoading(false);
    }
  };

  return { requests, isLoading, createRequest, updateStatus, approveRequest: (id: string, providedBy?: 'empresa' | 'cliente') => updateStatus(id, 'approved', providedBy) };
}
