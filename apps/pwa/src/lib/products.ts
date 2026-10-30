export interface ProductDefinition {
  id: string;
  name: string;
  unit: string;
  category: 'quimico' | 'acessorio' | 'outro';
}

export const STANDARD_PRODUCTS: ProductDefinition[] = [
  { id: 'cloro-multiacao', name: 'Cloro Multiação', unit: 'g', category: 'quimico' },
  { id: 'cloro-estabilizado', name: 'Cloro Estabilizado', unit: 'g', category: 'quimico' },
  { id: 'hipoclorito', name: 'Hipoclorito de Cálcio', unit: 'g', category: 'quimico' },
  { id: 'hipoclorito', name: 'Hipoclorito de Cálcio', unit: 'g', category: 'quimico' },
  { id: 'pastilha-cloro', name: 'Pastilha de Cloro', unit: 'unidades', category: 'quimico' },
  { id: 'algicida-manutencao', name: 'Algicida de Manutenção', unit: 'ml', category: 'quimico' },
  { id: 'algicida-choque', name: 'Algicida de Choque', unit: 'ml', category: 'quimico' },
  { id: 'clarificante', name: 'Clarificante Líquido', unit: 'ml', category: 'quimico' },
  { id: 'clarificante-gel', name: 'Clarificante Gel', unit: 'unidades', category: 'quimico' },
  { id: 'elevador-alcalinidade', name: 'Elevador de Alcalinidade', unit: 'g', category: 'quimico' },
  { id: 'redutor-ph', name: 'Redutor de pH', unit: 'ml', category: 'quimico' },
  { id: 'elevador-ph', name: 'Elevador de pH', unit: 'ml', category: 'quimico' },
  { id: 'barrilha', name: 'Barrilha Leve', unit: 'g', category: 'quimico' },
  { id: 'sulfato-aluminio', name: 'Sulfato de Alumínio', unit: 'g', category: 'quimico' },
  { id: 'limpa-bordas', name: 'Limpa Bordas', unit: 'ml', category: 'quimico' },
  { id: 'floculante', name: 'Floculante', unit: 'ml', category: 'quimico' },
  { id: 'anti-espuma', name: 'Anti-Espuma', unit: 'ml', category: 'quimico' },
  { id: 'peroxido', name: 'Peróxido', unit: 'l', category: 'quimico' },
  { id: 'tratamento-semanal', name: 'Tratamento Semanal', unit: 'unidades', category: 'quimico' },
  { id: 'sal', name: 'Sal para Gerador de Cloro', unit: 'kg', category: 'quimico' },
];

export function getProductById(id: string): ProductDefinition | undefined {
  return STANDARD_PRODUCTS.find(p => p.id === id);
}
