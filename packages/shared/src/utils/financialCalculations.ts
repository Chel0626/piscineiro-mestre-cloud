export interface ClientFinancialData {
  serviceValue: number;       // Valor total digitado no cadastro
  planType?: string;          // 'mensal', 'semestral', 'anual'
  contractStartDate?: string; // Ex: '2026-07-15'
}

/**
 * Retorna o valor que o cliente gera para um mês/ano específico do financeiro
 */
export function getClientRevenueForMonth(client: ClientFinancialData, targetYear: number, targetMonth: number): number {
  const value = client.serviceValue || 0;
  const plan = client.planType || 'mensal';

  // Se for mensal, ele gera receita todo santo mês
  if (plan === 'mensal') {
    return value;
  }

  // Se não tem data de contrato cadastrada, por segurança tratamos como mensal ou 0
  if (!client.contractStartDate) return plan === 'mensal' ? value : 0;

  const [contractYear, contractMonth] = client.contractStartDate.split('-').map(Number);

  // O valor total entra APENAS no mês e ano em que o contrato começou/renovou
  if (contractYear === targetYear && contractMonth === targetMonth) {
    return value;
  }

  // Nos demais meses do plano semestral/anual, a receita daquele contrato é zero (pois já foi paga/lançada no mês inicial)
  return 0;
}