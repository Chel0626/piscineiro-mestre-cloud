// src/components/ClientProductManager.tsx
'use client';

import { useState } from 'react';
import { useClientProducts } from '@/hooks/useClientProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { PlusCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { STANDARD_PRODUCTS } from '@/lib/products';

export function ClientProductManager({ clientId }: { clientId: string }) {
  const { products, isLoading, addProduct, updateProductQuantity, deleteProduct } = useClientProducts(clientId);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddProduct = () => {
    if (!selectedProductId || newProductQuantity <= 0) {
      return;
    }
    const product = STANDARD_PRODUCTS.find(p => p.id === selectedProductId);
    if (product) {
      addProduct(product.name, newProductQuantity, product.unit, product.id);
      setSelectedProductId('');
      setNewProductQuantity(1);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Estoque do Cliente</CardTitle>
            <CardDescription>Gerencie os produtos disponíveis no local.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">Selecione um produto...</option>
                  {STANDARD_PRODUCTS.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.unit})
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  placeholder="Qtde."
                  className="sm:w-24"
                  value={newProductQuantity}
                  onChange={(e) => setNewProductQuantity(Number(e.target.value))}
                />
                <Button onClick={handleAddProduct} className="flex-shrink-0">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>

              {isLoading ? (
                <p className="dark:text-gray-300">Carregando produtos...</p>
              ) : products.length > 0 ? (
                <ul className="space-y-3">
                  {products.map(product => (
                    <li key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                      <span className="font-medium dark:text-gray-200">{product.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 mr-2">{product.unit}</span>
                        <Input
                          type="number"
                          className="w-20 h-8"
                          value={product.quantity}
                          onChange={(e) => updateProductQuantity(product.id, Number(e.target.value))}
                        />
                        <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)}>
                          <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">Nenhum produto em estoque.</p>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}