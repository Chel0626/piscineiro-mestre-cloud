'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
}

export function useClientProducts(clientId: string) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('client_products')
            .select('*')
            .eq('client_id', clientId);
        
        if (error) {
            console.error("Erro ao buscar produtos do cliente:", error);
            toast.error("Não foi possível carregar o estoque de produtos.");
        } else if (data) {
            setProducts(data.map(p => ({
                id: p.id,
                name: p.name,
                quantity: Number(p.quantity),
                unit: p.unit
            })));
        }
        setIsLoading(false);
    };

    fetchProducts();

    const subscription = supabase
        .channel(`products_${clientId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'client_products', filter: `client_id=eq.${clientId}` }, (payload) => {
            fetchProducts();
        })
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
  }, [clientId]);

  const addProduct = async (name: string, quantity: number, unit?: string, id?: string) => {
    if (!user) return;
    try {
      // Check if product already exists for this client by name
      const { data: existing } = await supabase
        .from('client_products')
        .select('id, quantity')
        .eq('client_id', clientId)
        .eq('name', name)
        .maybeSingle();

      if (existing) {
         await updateProductQuantity(existing.id, Number(existing.quantity) + quantity);
         return;
      }

      const { error } = await supabase
        .from('client_products')
        .insert({
            client_id: clientId,
            user_id: user.id,
            name,
            quantity,
            unit
        });

      if (error) throw error;
      toast.success("Produto adicionado ao estoque!");
    } catch (error) {
      console.error(error);
      toast.error("Falha ao adicionar produto.");
    }
  };

  const updateProductQuantity = async (productId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('client_products')
        .update({ quantity: newQuantity })
        .eq('id', productId);

      if (error) throw error;
      toast.success("Quantidade atualizada.");
    } catch {
      toast.error("Falha ao atualizar a quantidade.");
    }
  };
  
  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('client_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      toast.success("Produto removido do estoque.");
    } catch {
      toast.error("Falha ao remover produto.");
    }
  };

  return { products, isLoading, addProduct, updateProductQuantity, deleteProduct };
}
