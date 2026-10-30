'use client';

import { useState } from 'react';

export interface ProductTemplate {
  id: string;
  name: string;
  category: 'chemical' | 'equipment' | 'maintenance';
  description?: string;
}

const DEFAULT_PRODUCTS: ProductTemplate[] = [
  // Produtos Químicos
  { id: 'clarificante', name: 'Clarificante', category: 'chemical', description: 'Para clarificar água turva' },
  { id: 'algicida', name: 'Algicida', category: 'chemical', description: 'Previne e elimina algas' },
  { id: 'cloro-granulado', name: 'Cloro Granulado', category: 'chemical', description: 'Desinfetante em grânulos' },
  { id: 'cloro-liquido', name: 'Cloro Líquido', category: 'chemical', description: 'Hipoclorito de sódio' },
  { id: 'cloro-pastilha', name: 'Cloro em Pastilha', category: 'chemical', description: 'Tricloro para dosagem automática' },
  { id: 'redutor-ph', name: 'Redutor de pH', category: 'chemical', description: 'Ácido muriático ou bissulfato' },
  { id: 'elevador-ph', name: 'Elevador de pH', category: 'chemical', description: 'Barrilha ou carbonato de sódio' },
  { id: 'elevador-alcalinidade', name: 'Elevador de Alcalinidade', category: 'chemical', description: 'Bicarbonato de sódio' },
  { id: 'anticalcario', name: 'Anticalcário', category: 'chemical', description: 'Previne incrustações de calcário' },
  { id: 'floculante', name: 'Floculante', category: 'chemical', description: 'Aglutina sujeira para filtração' },
  { id: 'sulfato-aluminio', name: 'Sulfato de Alumínio', category: 'chemical', description: 'Clarificante e floculante' },
  
  // Equipamentos e Manutenção
  { id: 'filtro-cartucho', name: 'Filtro Cartucho', category: 'equipment', description: 'Elemento filtrante descartável' },
  { id: 'areia-filtro', name: 'Areia para Filtro', category: 'equipment', description: 'Meio filtrante granular' },
  { id: 'vedacao-bomba', name: 'Vedação da Bomba', category: 'equipment', description: 'Reparo para vedação' },
  { id: 'cesta-skimmer', name: 'Cesta do Skimmer', category: 'equipment', description: 'Para retenção de detritos' },
  { id: 'aspirador', name: 'Aspirador Manual', category: 'equipment', description: 'Limpeza de fundo' },
  { id: 'escova', name: 'Escova para Piscina', category: 'maintenance', description: 'Limpeza de paredes e fundo' },
  { id: 'peneira', name: 'Peneira/Puçá', category: 'maintenance', description: 'Remoção de folhas e detritos' },
  { id: 'kit-teste', name: 'Kit de Teste', category: 'maintenance', description: 'Medição de pH e cloro' },
];

export function useProductCatalog() {
  const [catalog, setCatalog] = useState<ProductTemplate[]>(DEFAULT_PRODUCTS);

  // Função para filtrar produtos por categoria
  const getProductsByCategory = (category: string) => {
    return catalog.filter(product => product.category === category);
  };

  // Função para buscar produtos por nome
  const searchProducts = (searchTerm: string) => {
    if (!searchTerm.trim()) return catalog;
    
    const term = searchTerm.toLowerCase();
    return catalog.filter(product => 
      product.name.toLowerCase().includes(term) || 
      (product.description && product.description.toLowerCase().includes(term))
    );
  };

  // Função para adicionar produto customizado ao catálogo (futuramente pode salvar no Firebase)
  const addCustomProduct = (name: string, category: 'chemical' | 'equipment' | 'maintenance', description?: string) => {
    const customProduct: ProductTemplate = {
      id: `custom-${Date.now()}`,
      name,
      category,
      description
    };
    setCatalog(prev => [...prev, customProduct]);
    return customProduct;
  };

  return {
    catalog,
    getProductsByCategory,
    searchProducts,
    addCustomProduct
  };
}
