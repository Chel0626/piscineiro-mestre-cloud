// Funções utilitárias para o VisitForm para lidar com o novo formato de produtos
import { STANDARD_PRODUCTS } from '../config/plans';

export interface ProductUsage {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

/**
 * Converte um array de objetos de produto para uma string amigável para exibição
 */
export const formatProductsToString = (products: ProductUsage[]): string => {
  return products
    .filter(p => p.quantity > 0)
    .map(p => `• ${p.name}: ${p.quantity} ${p.unit}`)
    .join('\n');
};

/**
 * Inicializa a lista de produtos com base nas sugestões e produtos padrão
 */
export const getInitialProductsUsed = (suggested: ProductUsage[]): ProductUsage[] => {
  // Começamos com os sugeridos que foram selecionados
  const initial = [...suggested];
  
  // Podemos adicionar outros produtos comuns aqui se quisermos que apareçam na lista por padrão
  return initial;
};

const DAY_NAME_TO_INDEX: Record<string, number> = {
  'Domingo': 0,
  'Segunda-feira': 1,
  'Terça-feira': 2,
  'Quarta-feira': 3,
  'Quinta-feira': 4,
  'Sexta-feira': 5,
  'Sábado': 6,
};

/**
 * Calcula quantos dias faltam até a próxima visita programada,
 * com base nos dias da semana cadastrados para o cliente.
 * Retorna 7 como fallback se não houver dias cadastrados.
 */
export const calcularDiasAteProximaVisita = (visitDays: string[] | undefined | null): number => {
  if (!visitDays || visitDays.length === 0) return 7;

  const today = new Date();
  const todayIndex = today.getDay(); // 0=Dom, 1=Seg, ...

  const scheduledIndices = visitDays
    .map(day => DAY_NAME_TO_INDEX[day])
    .filter((idx): idx is number => idx !== undefined)
    .sort((a, b) => a - b);

  if (scheduledIndices.length === 0) return 7;

  // Busca o próximo dia estritamente após hoje
  for (const dayIdx of scheduledIndices) {
    const diff = dayIdx - todayIndex;
    if (diff > 0) return diff;
  }

  // Se nenhum dia futuro na semana, pega o primeiro da próxima semana
  return 7 - todayIndex + scheduledIndices[0];
};
