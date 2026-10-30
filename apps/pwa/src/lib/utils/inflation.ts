// Busca o índice de inflação acumulado (IPCA) entre duas datas usando a API do Banco Central
export async function fetchInflationIndex(startDate: string, endDate: string): Promise<number | null> {
  try {
    // Converte YYYY-MM-DD para DD/MM/YYYY
    const formatDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    // Endpoint do SGS Banco Central: IPCA código 433
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=${start}&dataFinal=${end}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    // Cálculo de juros compostos: ((1 + i1) * (1 + i2) * ... - 1) * 100
    let accumulated = 1;
    
    data.forEach((item: { valor: string }) => {
      const val = parseFloat(item.valor);
      if (!isNaN(val)) {
        accumulated *= (1 + val / 100);
      }
    });

    return (accumulated - 1) * 100;
  } catch (error) {
    console.error('Erro ao buscar inflação:', error);
    return null;
  }
}
