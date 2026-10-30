import * as z from 'zod';

// Schema principal de validação do formulário de clientes
export const clientFormSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter no mínimo 2 caracteres.' }),
  address: z.string().min(5, { message: 'O endereço parece muito curto.' }),
  neighborhood: z.string().min(2, { message: 'O bairro/condomínio parece muito curto.' }),
  phone: z.string().optional(),
  email: z.string().email({ message: 'Email inválido' }).optional().or(z.literal('')),
  poolVolume: z.number().min(0, { message: 'O volume não pode ser negativo.' }),
  serviceValue: z.number().min(0, { message: 'O valor não pode ser negativo.' }),
  
  // Frequência e dias de visita
  visitFrequency: z.enum(['weekly', 'biweekly', 'monthly'], { message: "Por favor, selecione a frequência de visitas." }),
  visitDays: z.array(z.string()).min(1, { message: "Por favor, selecione pelo menos um dia da visita." })
    .max(4, { message: "Máximo de 4 dias por semana." }),

  paymentDueDate: z.number()
    .min(1, { message: "O dia deve ser entre 1 e 31." })
    .max(31, { message: "O dia deve ser entre 1 e 31." }),

  // Novos campos integrados de Plano e Renovação de Contrato
  planType: z.enum(['mensal', 'semestral', 'anual']).optional().or(z.literal('')),
  nextRenewalDate: z.string().optional().or(z.literal('')),

  // Campos de controle de rota e histórico de reajuste
  routeOrder: z.record(z.string(), z.number()).optional(),
  reajusteHistory: z.array(z.object({
    date: z.string(),
    oldValue: z.number(),
    newValue: z.number(),
    diffValue: z.number(),
    diffPercent: z.number(),
    inflationIndex: z.number().nullable().optional(),
    reason: z.string().optional(),
  })).optional(),

  // Filtro e tratamentos
  filterModel: z.string().optional().or(z.literal('')),
  filterSandKg: z.number().optional(),
  lastSandChange: z.string().optional().or(z.literal('')),
  nextSandChange: z.string().optional().or(z.literal('')),
  
  // Datas e metadados
  contractStartDate: z.string().optional(),
  type: z.string().optional(),
  coordinates: z.any().optional(),
  visitDay: z.string().optional(), // Deprecated
  
  // Worker assignment
  workerId: z.string().optional().nullable(),
  
  // Treatment Type (Persistent)
  chlorineType: z.enum(['multiacao', 'estabilizado', 'hipoclorito', 'peroxido', 'gerador']).optional().nullable(),
  peroxideStartDate: z.string().optional().nullable(),
});

// Schema para compatibilidade com dados antigos (migração)
export const legacyClientSchema = z.object({
  name: z.string(),
  address: z.string(),
  neighborhood: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  poolVolume: z.number(),
  serviceValue: z.number(),
  visitDay: z.string(), // Campo antigo
  paymentDueDate: z.number(),
});

// Tipos inferidos para manter a consistência em todo o app
export type ClientFormData = z.infer<typeof clientFormSchema>;
export type LegacyClientData = z.infer<typeof legacyClientSchema>;

// Tipo estendido para incluir campos de pagamento (usado na leitura de dados)
export type ClientWithPayment = ClientFormData & {
  id: string;
  lastPaymentDate?: string;
  paymentStatus?: 'paid' | 'pending' | 'overdue';
};

// Função para migrar dados antigos para o novo formato
export function migrateClientData(legacyData: LegacyClientData): ClientFormData {
  return {
    ...legacyData,
    visitFrequency: 'weekly' as const,
    visitDays: [legacyData.visitDay],
    planType: 'mensal',
  };
}