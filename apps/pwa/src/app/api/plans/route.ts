import { NextResponse } from 'next/server';
import { PLANS } from '@/config/plans';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Retorna os planos definidos estaticamente no código (Vercel)
    // Isso evita leituras no Firestore e problemas de permissão/índices
    const activePlans = PLANS
      .filter(plan => plan.active)
      .sort((a, b) => a.order - b.order);

    return NextResponse.json(activePlans);
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
