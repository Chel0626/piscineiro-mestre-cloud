'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  minQuantity?: number;
}

export function useClientStock(clientId: string | null) {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setIsLoading(false);
      return;
    }

    const fetchStock = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('client_id', clientId);

        if (error) throw error;

        const items: StockItem[] = (data || []).map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          minQuantity: item.min_quantity
        }));

        setStock(items);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Erro ao buscar estoque:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchStock();

    const channel = supabase
      .channel(`products:${clientId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'products', 
        filter: `client_id=eq.${clientId}` 
      }, (payload) => {
        fetchStock();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const updateStock = async (itemId: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Erro ao atualizar estoque:', err);
      throw err;
    }
  };

  const addStockItem = async (item: Omit<StockItem, 'id'>) => {
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          client_id: clientId,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          min_quantity: item.minQuantity
        });

      if (error) throw error;
    } catch (err: any) {
      console.error('Erro ao adicionar item:', err);
      throw err;
    }
  };

  return { stock, isLoading, error, updateStock, addStockItem };
}
