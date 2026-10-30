'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Package, Plus, Loader2, Trash2, Edit2, Check, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function ProductsPage() {
  const { tenant, user, authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de criação
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Estados de edição em linha (inline editing)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (tenant?.id) {
      fetchProducts();
    }
  }, [tenant]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenant?.id)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Não foi possível carregar a tabela de preços.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice) return;

    setIsSubmitting(true);
    try {
      const numericPrice = parseFloat(newPrice.replace(',', '.'));

      const { error } = await supabase
        .from('products')
        .insert([
          {
            tenant_id: tenant?.id,
            name: newName.trim(),
            price: numericPrice,
          }
        ]);

      if (error) throw error;

      toast.success('Produto adicionado!');
      setNewName('');
      setNewPrice('');
      fetchProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao adicionar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inicia o modo de edição para uma linha específica
  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditPrice(product.price.toString());
  };

  // Cancela a edição
  const cancelEditing = () => {
    setEditingId(null);
    setEditPrice('');
  };

  // Salva o novo preço no banco
  const handleUpdatePrice = async (id: string) => {
    if (!editPrice) return;
    setIsUpdating(true);
    
    try {
      const numericPrice = parseFloat(editPrice.replace(',', '.'));
      
      const { error } = await supabase
        .from('products')
        .update({ price: numericPrice })
        .eq('id', id);

      if (error) throw error;

      toast.success('Preço atualizado com sucesso!');
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar o preço.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este produto da lista?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Produto removido com sucesso!');
      fetchProducts();
    } catch (error) {
      toast.error('Erro ao remover produto.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 container mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold tracking-tight">Tabela de Preços</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Produto</CardTitle>
            <CardDescription>
              Cadastre os produtos exatamente com o mesmo nome que os técnicos usam no relatório.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProduct} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input 
                  placeholder="Nome do Produto (Ex: Cloro 10kg)" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div className="w-full sm:w-48">
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="Preço (Ex: 150.00)" 
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700 text-white">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Adicionar
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum produto cadastrado ainda.</p>
            ) : (
              <div className="divide-y">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{product.name}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4">
                      {editingId === product.id ? (
                        /* MODO DE EDIÇÃO */
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            className="w-24 h-9"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdatePrice(product.id);
                              if (e.key === 'Escape') cancelEditing();
                            }}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleUpdatePrice(product.id)}
                            disabled={isUpdating}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={cancelEditing}
                            disabled={isUpdating}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        /* MODO DE LEITURA */
                        <>
                          <p className="font-bold text-green-600">{formatCurrency(product.price)}</p>
                          <div className="flex items-center">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => startEditing(product)}
                              className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                              title="Editar Preço"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(product.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              title="Remover Produto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}