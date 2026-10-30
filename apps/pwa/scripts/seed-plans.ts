
import { initializeApp, cert, getApps, getApp, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env.local
dotenv.config({ path: '.env.local' });

// Processa a chave privada para garantir que esteja no formato correto
let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

// Limpa qualquer tipo de aspas (simples ou duplas) no início e fim
privateKey = privateKey.replace(/^["']|["']$/g, '');

// Se a chave contém \n LITERAL (como string), converte para quebras reais
if (privateKey.includes('\\n')) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey,
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
} else {
    getApp();
}

const db = getFirestore();

async function seedPlans() {
  const plans = [
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
      price: 49.90,
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
      description: 'Economize 20% com o plano anual',
      price: 479.00, // Equivalente a ~39,90/mês
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

  console.log('Iniciando seed de planos...');

  for (const plan of plans) {
    const { id, ...data } = plan;
    await db.collection('subscription_plans').doc(id).set(data);
    console.log(`Plano ${plan.name} criado/atualizado.`);
  }

  console.log('Seed concluído!');
}

seedPlans().catch(console.error);
