// PoolCalculator.ts
// Lógica Avançada de Tratamento Químico (Genco/Cris Água)

export type WaterAspect =
  | 'CRYSTAL'
  | 'CLOUDY'
  | 'MILKY'
  | 'GREEN'
  | 'DARK_GREEN';

export interface TreatmentInputs {
  poolVolume: number; // m³
  ph: number;
  alkalinity: number; // ppm
  chlorine: number; // ppm
  aspect: WaterAspect;
}

export interface TreatmentStep {
  order: number;
  product: string;
  amount: number;
  unit: string;
  instruction: string;
}

export interface TreatmentResult {
  status: 'OK' | 'WARNING' | 'CRITICAL';
  steps: TreatmentStep[];
  warnings: string[];
}

export function calculateTreatment({ poolVolume, ph, alkalinity, chlorine, aspect }: TreatmentInputs): TreatmentResult {
  const steps: TreatmentStep[] = [];
  const warnings: string[] = [];
  let order = 1;
  let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';

  // Lógica alinhada com VisitForm.tsx

  // 1. Ajuste de pH
  if (ph > 7.6) {
    const diferencaPh = ph - 7.4;
    const redutorNecessario = (15 * poolVolume * diferencaPh) / 0.2;
    steps.push({
      order: order++,
      product: 'Redutor de pH',
      amount: Math.round(redutorNecessario),
      unit: 'ml',
      instruction: 'Reduzir pH para 7.4'
    });
    status = 'WARNING';
  } else if (ph < 7.2) {
    // VisitForm não tem lógica explícita para elevar pH na função calcularProdutos, 
    // mas vamos manter uma lógica básica de segurança ou usar a lógica de alcalinidade se ela também estiver baixa.
    // Se alcalinidade estiver ok mas pH baixo, usa barrilha.
    if (alkalinity >= 80) {
       const diferencaPh = 7.4 - ph;
       // Estimativa: 10g/m3 para subir 0.2 (aprox)
       const barrilha = (10 * poolVolume * diferencaPh) / 0.2;
       steps.push({
        order: order++,
        product: 'Barrilha Leve',
        amount: Math.round(barrilha),
        unit: 'g',
        instruction: 'Elevar pH para 7.4'
       });
       status = 'WARNING';
    }
  }

  // 2. Ajuste de Alcalinidade
  if (alkalinity <= 70) {
    const aumentoDesejado = 120 - alkalinity;
    const elevadorNecessario = (aumentoDesejado / 10) * 17 * poolVolume;
    steps.push({
      order: order++,
      product: 'Elevador de Alcalinidade',
      amount: Math.round(elevadorNecessario),
      unit: 'g',
      instruction: 'Ajustar alcalinidade para 120ppm'
    });
    status = 'WARNING';
  }

  // 3. Cloro (Assumindo Multiação e 7 dias como padrão do VisitForm)
  const daysUntilNext = 7;
  if (chlorine === 0) {
    // VisitForm: 30g * volume
    steps.push({
      order: order++,
      product: 'Cloro Multiação',
      amount: Math.round(30 * poolVolume),
      unit: 'g',
      instruction: 'Cloração de choque (nível zero)'
    });
  } else if (chlorine >= 1 && chlorine <= 2) {
    // VisitForm: volume * 2 * days
    steps.push({
      order: order++,
      product: 'Cloro Multiação (Manutenção)',
      amount: Math.round(poolVolume * 2 * daysUntilNext),
      unit: 'g',
      instruction: 'Manutenção semanal'
    });
  }

  // 4. Tratamento por Aspecto (VisitForm Logic)
  if (aspect === 'GREEN' || aspect === 'DARK_GREEN') {
    // VisitForm: Sulfato (20*vol), Barrilha (20*vol), Cloro Choque (30*vol)
    status = 'CRITICAL';
    steps.push({
      order: order++,
      product: 'Sulfato de Alumínio (Decantação)',
      amount: Math.round(20 * poolVolume),
      unit: 'g',
      instruction: 'Decantação'
    });
    steps.push({
      order: order++,
      product: 'Barrilha (Elevador de pH)',
      amount: Math.round(20 * poolVolume),
      unit: 'g',
      instruction: 'Decantação'
    });
    steps.push({
      order: order++,
      product: 'Cloro Granulado (Choque)',
      amount: Math.round(30 * poolVolume),
      unit: 'g',
      instruction: 'Choque'
    });
    warnings.push('Água verde: Escovar e decantar.');
  } else if (aspect === 'CLOUDY' || aspect === 'MILKY') {
    // VisitForm: Clarificante 6 * volume
    steps.push({
      order: order++,
      product: 'Clarificante (Dosagem Reforçada)',
      amount: Math.round(6 * poolVolume),
      unit: 'ml',
      instruction: 'Água turva/leitosa'
    });
    // VisitForm: Algicida 6 * volume
    steps.push({
      order: order++,
      product: 'Algicida',
      amount: Math.round(6 * poolVolume),
      unit: 'ml',
      instruction: 'Prevenção'
    });
  } else if (aspect === 'CRYSTAL') {
    // VisitForm: Clarificante 1.5 * volume
    steps.push({
      order: order++,
      product: 'Clarificante',
      amount: Math.round(1.5 * poolVolume),
      unit: 'ml',
      instruction: 'Polimento'
    });
    // VisitForm: Algicida 6 * volume
    steps.push({
      order: order++,
      product: 'Algicida',
      amount: Math.round(6 * poolVolume),
      unit: 'ml',
      instruction: 'Manutenção'
    });
  }

  // Pastilhas (VisitForm logic)
  const pastilhas = poolVolume / 25;
  if (pastilhas >= 0.5) {
    steps.push({
      order: order++,
      product: 'Pastilha de Cloro',
      amount: Math.ceil(pastilhas),
      unit: pastilhas > 1 ? 'unidades' : 'unidade',
      instruction: 'Reposição no flutuador/skimmer'
    });
  }

  return {
    status,
    steps,
    warnings,
  };
}
