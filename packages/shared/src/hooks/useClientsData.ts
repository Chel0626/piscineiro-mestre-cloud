'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { ClientFormData } from '../validators/clientSchema';
import { mapClientFromDB, mapClientToDB } from '../utils/mappers';

export interface Client extends ClientFormData {
  id: string;
}

export function useClientsData(tenantId?: string, userId?: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    if (!tenantId) {
        setClients([]);
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');

    if (error) {
        console.error('Erro ao buscar clientes:', error);
        setError(error.message);
        setIsLoading(false);
        return;
    }

    if (data) {
        const mappedClients = data.map(mapClientFromDB);
        setClients(mappedClients);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, [tenantId]);

  const createClient = async (data: ClientFormData) => {
      if (!tenantId || !userId) return { error: 'Missing tenant or user' };
      
      const dbData = {
          ...mapClientToDB(data, userId),
          tenant_id: tenantId
      };

      const { data: newClient, error } = await supabase
          .from('clients')
          .insert(dbData)
          .select()
          .single();

      if (error) return { error: error.message };
      
      await fetchClients();
      return { data: mapClientFromDB(newClient) };
  };

  const updateClient = async (id: string, data: ClientFormData) => {
      if (!tenantId || !userId) return { error: 'Missing tenant or user' };

      const dbData = mapClientToDB(data, userId);
      
      const { data: updatedClient, error } = await supabase
          .from('clients')
          .update(dbData)
          .eq('id', id)
          .select()
          .single();

      if (error) return { error: error.message };

      await fetchClients();
      return { data: mapClientFromDB(updatedClient) };
  };

  const deleteClient = async (id: string) => {
      const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id);

      if (error) return { error: error.message };

      await fetchClients();
      return { success: true };
  };

  return { clients, isLoading, error, createClient, updateClient, deleteClient, refetch: fetchClients };
}
