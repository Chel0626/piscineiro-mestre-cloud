import { z } from 'zod';

export const piscineiroProfileSchema = z.object({
  // Informações básicas
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  sobrenome: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  
  // Localização
  cidade: z.string().min(2, 'Cidade é obrigatória').optional(),
  estado: z.string().min(2, 'Estado é obrigatório').optional(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido').optional(),
  endereco: z.string().optional(),
  
  // Informações profissionais
  empresa: z.string().optional(),
  experiencia: z.enum(['iniciante', 'intermediario', 'avancado', 'expert']).optional(),
  especialidades: z.array(z.string()).optional(),
  certificacoes: z.array(z.string()).optional(),
  
  // Sobre
  biografia: z.string().max(500, 'Biografia deve ter no máximo 500 caracteres').optional(),
  site: z.string().url('URL inválida').optional().or(z.literal('')),
  instagram: z.string().optional(),
  whatsapp: z.string().optional(),
  
  // Configurações
  disponivel: z.boolean().optional(),
  aceitaEmergencia: z.boolean().optional(),
  raioAtendimento: z.number().min(1).max(100).optional(),
  
  // Avatar
  avatarUrl: z.string().url().optional().or(z.literal('')),
  
  // Timestamps
  criadoEm: z.date().optional(),
  atualizadoEm: z.date().optional(),
});

export type PiscineiroProfile = z.infer<typeof piscineiroProfileSchema>;

export const especialidadesOptions = [
  'Manutenção preventiva',
  'Limpeza de piscinas',
  'Tratamento químico',
  'Reparo de equipamentos',
  'Instalação de equipamentos',
  'Manutenção de bombas',
  'Sistema de aquecimento',
  'Automação',
  'Piscinas de vinil',
  'Piscinas de fibra',
  'Piscinas de alvenaria',
  'Hidromassagem',
  'Cascatas e fontes',
  'Iluminação aquática',
];

export const estadosBrasil = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];