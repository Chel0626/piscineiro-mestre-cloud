import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface CalculatorModalProps {
  open: boolean;
  onClose: () => void;
  poolVolume: number;
  clientName: string;
}

interface ProductSuggestion {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ open, onClose, poolVolume, clientName }) => {
  const [ph, setPh] = useState(7.4);
  const [cloro, setCloro] = useState(0);
  const [alcalinidade, setAlcalinidade] = useState(100);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const phValues = [6.8, 7.0, 7.2, 7.4, 7.6, 7.8, 8.0];
  const cloroValues = [0, 1, 2, 3, 4];
  const alcalinidadeValues = Array.from({ length: 21 }, (_, i) => i * 10); // 0-200

  const calcularProdutos = (): ProductSuggestion[] => {
    const volume = poolVolume || 0;
    if (volume === 0) return [];
    
    const suggestions: ProductSuggestion[] = [];

    // 1. CLORO GRANULADO
    const cloroIdeal = 3.0;
    if (cloro < cloroIdeal) {
      const cloroFaltante = cloroIdeal - cloro;
      const cloroNecessario = 10 * volume * cloroFaltante;
      suggestions.push({
        id: 'cloro-granulado',
        name: 'Cloro Granulado',
        quantity: Math.round(cloroNecessario),
        unit: 'g'
      });
    }

    // Tratamento de choque
    if (cloro <= 0.5) {
      const choqueOxidacao = 25 * volume;
      suggestions.push({
        id: 'cloro-choque',
        name: 'Cloro Granulado (Tratamento de Choque)',
        quantity: Math.round(choqueOxidacao),
        unit: 'g'
      });
    }

    // 2. PASTILHAS DE CLORO
    const pastilhas = Math.ceil(volume / 45);
    if (pastilhas > 0) {
      suggestions.push({
        id: 'pastilha-cloro',
        name: 'Pastilha de Cloro 200g (manutenção semanal)',
        quantity: pastilhas,
        unit: 'unidades'
      });
    }

    // 3. ALCALINIDADE
    const alcalinidadeIdeal = 120;
    if (alcalinidade < alcalinidadeIdeal) {
      const alcalinidadeFaltante = alcalinidadeIdeal - alcalinidade;
      const elevadorNecessario = (170 * volume * alcalinidadeFaltante) / 10;
      suggestions.push({
        id: 'elevador-alcalinidade',
        name: 'Elevador de Alcalinidade',
        quantity: Math.round(elevadorNecessario),
        unit: 'g'
      });
    }

    // 4. pH
    if (ph > 7.6) {
      const diferencaPh = ph - 7.4;
      const redutorNecessario = (100 * volume * diferencaPh) / 0.2;
      suggestions.push({
        id: 'redutor-ph',
        name: 'Redutor de pH (Ácido)',
        quantity: Math.round(redutorNecessario),
        unit: 'ml'
      });
    }
    
    if (ph < 7.2) {
      const diferencaPh = 7.4 - ph;
      const barrilhaNecessaria = (100 * volume * diferencaPh) / 0.2;
      suggestions.push({
        id: 'elevador-ph',
        name: 'Barrilha / Elevador de pH',
        quantity: Math.round(barrilhaNecessaria),
        unit: 'g'
      });
    }

    // 5. ALGICIDA
    if (cloro < 1.0) {
      const algicidaChoque = (250 * volume) / 10;
      suggestions.push({
        id: 'algicida-choque',
        name: 'Algicida (Tratamento de Choque)',
        quantity: Math.round(algicidaChoque),
        unit: 'ml'
      });
    } else {
      const algicidaManutencao = (80 * volume) / 10;
      suggestions.push({
        id: 'algicida-manutencao',
        name: 'Algicida (Manutenção Semanal)',
        quantity: Math.round(algicidaManutencao),
        unit: 'ml'
      });
    }

    // 6. CLARIFICANTE
    const clarificanteManutencao = 40 * volume;
    suggestions.push({
      id: 'clarificante-manutencao',
      name: 'Clarificante Líquido (Manutenção)',
      quantity: Math.round(clarificanteManutencao),
      unit: 'ml'
    });
    
    if (cloro < 1.5) {
      const clarificanteDecantacao = 120 * volume;
      suggestions.push({
        id: 'clarificante-decantacao',
        name: 'Clarificante Líquido (Decantação)',
        quantity: Math.round(clarificanteDecantacao),
        unit: 'ml'
      });
    }

    // 7. CLARIFICANTE GEL
    const clarificanteGel = Math.ceil(volume / 12);
    if (clarificanteGel > 0) {
      suggestions.push({
        id: 'clarificante-gel',
        name: 'Clarificante Gel / Sachê',
        quantity: clarificanteGel,
        unit: 'unidades'
      });
    }

    // 8. SULFATO DE ALUMÍNIO
    const sulfatoAluminio = 40 * volume;
    suggestions.push({
      id: 'sulfato-aluminio',
      name: 'Sulfato de Alumínio (Decantante)',
      quantity: Math.round(sulfatoAluminio),
      unit: 'g'
    });

    // 9. LIMPA BORDAS
    suggestions.push({
      id: 'limpa-bordas',
      name: 'Limpa Bordas',
      quantity: 200,
      unit: 'ml'
    });

    return suggestions;
  };

  const recomendacoes = calcularProdutos();

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const enviarParaWhatsApp = () => {
    const produtosSelecionados = recomendacoes.filter(p => selectedProducts.has(p.id));
    if (produtosSelecionados.length === 0) {
      alert('Selecione pelo menos um produto');
      return;
    }

    const mensagem = `*Relatório de Dosagem - ${clientName}*\n\n` +
      `📊 *Parâmetros Medidos:*\n` +
      `• pH: ${ph}\n` +
      `• Cloro: ${cloro} ppm\n` +
      `• Alcalinidade: ${alcalinidade} ppm\n\n` +
      `💊 *Produtos Recomendados:*\n` +
      produtosSelecionados.map(p => `• ${p.name}: ${p.quantity}${p.unit}`).join('\n') +
      `\n\n🏊 Volume da piscina: ${poolVolume}m³ (${poolVolume * 1000}L)` +
      `\n\n✅ Produtos calculados com base nas necessidades atuais da piscina.`;

    // Abrir WhatsApp Web
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Calculadora de Dosagem - {clientName}
            <Badge variant="secondary">Volume: {poolVolume}m³ ({poolVolume * 1000}L)</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Parâmetros */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Parâmetros Atuais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* pH */}
              <div className="space-y-2">
                <label className="text-sm font-medium">pH</label>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const idx = phValues.indexOf(ph);
                      if (idx > 0) setPh(phValues[idx - 1]);
                    }}
                    disabled={ph === phValues[0]}
                  >
                    -
                  </Button>
                  <span className="min-w-[60px] text-center font-mono text-lg font-semibold">{ph}</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const idx = phValues.indexOf(ph);
                      if (idx < phValues.length - 1) setPh(phValues[idx + 1]);
                    }}
                    disabled={ph === phValues[phValues.length - 1]}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Cloro */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cloro (ppm)</label>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const idx = cloroValues.indexOf(cloro);
                      if (idx > 0) setCloro(cloroValues[idx - 1]);
                    }}
                    disabled={cloro === cloroValues[0]}
                  >
                    -
                  </Button>
                  <span className="min-w-[60px] text-center font-mono text-lg font-semibold">{cloro}</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const idx = cloroValues.indexOf(cloro);
                      if (idx < cloroValues.length - 1) setCloro(cloroValues[idx + 1]);
                    }}
                    disabled={cloro === cloroValues[cloroValues.length - 1]}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Alcalinidade */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Alcalinidade (ppm)</label>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const idx = alcalinidadeValues.indexOf(alcalinidade);
                      if (idx > 0) setAlcalinidade(alcalinidadeValues[idx - 1]);
                    }}
                    disabled={alcalinidade === alcalinidadeValues[0]}
                  >
                    -
                  </Button>
                  <span className="min-w-[60px] text-center font-mono text-lg font-semibold">{alcalinidade}</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const idx = alcalinidadeValues.indexOf(alcalinidade);
                      if (idx < alcalinidadeValues.length - 1) setAlcalinidade(alcalinidadeValues[idx + 1]);
                    }}
                    disabled={alcalinidade === alcalinidadeValues[alcalinidadeValues.length - 1]}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              <strong>Valores Ideais:</strong> pH 7.2-7.6 | Cloro 2-3 ppm | Alcalinidade 100-120 ppm
            </p>
          </div>

          {/* Recomendações */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Recomendações de Produtos</h3>
            {recomendacoes.length > 0 ? (
              <div className="space-y-2">
                {recomendacoes.map((produto) => (
                  <div key={produto.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Checkbox
                      id={produto.id}
                      checked={selectedProducts.has(produto.id)}
                      onCheckedChange={() => handleProductToggle(produto.id)}
                      className="h-5 w-5"
                    />
                    <label htmlFor={produto.id} className="flex-1 text-sm font-medium cursor-pointer">
                      {produto.name}: <span className="font-bold text-blue-600 dark:text-blue-400">{produto.quantity}{produto.unit}</span>
                    </label>
                  </div>
                ))}
                {selectedProducts.size > 0 && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ {selectedProducts.size} produto(s) selecionado(s)
                    </p>
                    <Button onClick={enviarParaWhatsApp} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Enviar por WhatsApp
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Aguardando parâmetros...</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
