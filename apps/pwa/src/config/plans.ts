
export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  order: number;
  active: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    description: 'Para quem está começando',
    price: 0,
    interval: 'month',
    features: [
      'Até 3 clientes',
      'Gestão básica de visitas',
      'Histórico de 30 dias',
      'Suporte por email'
    ],
    order: 1,
    active: true
  },
  {
    id: 'pro_monthly',
    name: 'Profissional Mensal',
    description: 'Para piscineiros em crescimento',
    price: 29.90,
    interval: 'month',
    features: [
      'Clientes ilimitados',
      'Gestão avançada de rotas',
      'Histórico ilimitado',
      'Relatórios financeiros',
      'Suporte prioritário WhatsApp',
      'Cálculo automático de produtos'
    ],
    order: 2,
    active: true
  },
  {
    id: 'pro_yearly',
    name: 'Profissional Anual',
    description: 'Economize com o plano anual (R$ 19,90/mês)',
    price: 238.80,
    interval: 'year',
    features: [
      'Tudo do plano mensal',
      '2 meses grátis',
      'Consultoria inicial de setup',
      'Badge de Piscineiro Verificado'
    ],
    order: 3,
    active: true
  }
];

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find(p => p.id === id);
}
