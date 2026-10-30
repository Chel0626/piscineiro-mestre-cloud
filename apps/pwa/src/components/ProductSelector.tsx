'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useProductCatalog, ProductTemplate } from '@/hooks/useProductCatalog';
import { Plus, Search, Package } from 'lucide-react';
import { toast } from 'sonner';

interface ProductSelectorProps {
  onSelectProduct: (productName: string) => void;
  buttonText: string;
  buttonIcon?: React.ReactNode;
  title: string;
  description: string;
}

export function ProductSelector({ 
  onSelectProduct, 
  buttonText, 
  buttonIcon,
  title,
  description 
}: ProductSelectorProps) {
  const { catalog, searchProducts } = useProductCatalog();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customProductName, setCustomProductName] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const filteredProducts = () => {
    let products = searchTerm ? searchProducts(searchTerm) : catalog;
    
    if (selectedCategory !== 'all') {
      products = products.filter(p => p.category === selectedCategory);
    }
    
    return products;
  };

  const handleSelectFromCatalog = (product: ProductTemplate) => {
    onSelectProduct(product.name);
    setIsOpen(false);
    setSearchTerm('');
    setSelectedCategory('all');
    toast.success(`${product.name} adicionado!`);
  };

  const handleAddCustomProduct = () => {
    if (!customProductName.trim()) {
      toast.error('Digite o nome do produto.');
      return;
    }

    onSelectProduct(customProductName.trim());
    setIsOpen(false);
    setCustomProductName('');
    setShowCustomForm(false);
    toast.success(`${customProductName} adicionado!`);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'chemical': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'equipment': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'maintenance': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'chemical': return 'Químico';
      case 'equipment': return 'Equipamento';
      case 'maintenance': return 'Manutenção';
      default: return category;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {buttonIcon || <Plus className="h-4 w-4 mr-1" />}
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Controles de busca e filtro */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="chemical">Químicos</SelectItem>
                <SelectItem value="equipment">Equipamentos</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de produtos */}
          <div className="border rounded-lg max-h-80 overflow-y-auto">
            <div className="space-y-1 p-2">
              {filteredProducts().map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                  onClick={() => handleSelectFromCatalog(product)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm dark:text-gray-200">{product.name}</span>
                      <Badge variant="outline" className={getCategoryColor(product.category)}>
                        {getCategoryLabel(product.category)}
                      </Badge>
                    </div>
                    {product.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{product.description}</p>
                    )}
                  </div>
                  <Package className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
              ))}
              
              {filteredProducts().length === 0 && (
                <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                  Nenhum produto encontrado
                </div>
              )}
            </div>
          </div>

          {/* Separador */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Adicionar produto customizado */}
          {!showCustomForm ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCustomForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar produto personalizado
            </Button>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder="Nome do produto personalizado..."
                value={customProductName}
                onChange={(e) => setCustomProductName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomProduct()}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleAddCustomProduct}
                  size="sm"
                  className="flex-1"
                >
                  Adicionar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCustomForm(false);
                    setCustomProductName('');
                  }}
                  size="sm"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}