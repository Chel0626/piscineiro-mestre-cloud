'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { calculatorFormSchema, CalculatorFormData } from '@/lib/validators/calculatorSchema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

interface ProductSuggestion {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface ProductCalculatorProps {
  poolVolume?: number; // Volume em m³
  onProductsSelected?: (products: ProductSuggestion[]) => void;
}

export function ProductCalculator({ poolVolume, onProductsSelected }: ProductCalculatorProps) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  
  const form = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorFormSchema),
    defaultValues: {
      ph: undefined,
      cloro: undefined,
      alcalinidade: undefined,
    },
  });

  const watchedValues = useWatch({ control: form.control });

  const calcularProdutos = (data: Partial<CalculatorFormData>): ProductSuggestion[] => {
    const volume = poolVolume || 0;
    if (volume === 0) return [];
    
    const suggestions: ProductSuggestion[] = [];

    // CÁLCULOS BASEADOS EM ESPECIFICAÇÕES TÉCNICAS DA INDÚSTRIA

    // 1. CLORO GRANULADO (Dicloro ou Tricloro)
    // Meta: 1-3 ppm (ideal 2-3 ppm)
    // Cálculo: Para elevar 1 ppm = 10g por m³
    const cloroAtual = data.cloro ?? 0;
    const cloroIdeal = 3.0;
    
    if (cloroAtual < cloroIdeal) {
      const cloroFaltante = cloroIdeal - cloroAtual;
      // 10g por m³ para elevar 1 ppm
      const cloroNecessario = 10 * volume * cloroFaltante;
      
      suggestions.push({
        id: 'cloro-granulado',
        name: 'Cloro Granulado',
        quantity: Math.round(cloroNecessario),
        unit: 'g'
      });
    }

    // Tratamento de choque/oxidação quando cloro está muito baixo ou zerado
    if (cloroAtual <= 0.5) {
      // Choque: 20-30g por m³ (usando 25g como média)
      const choqueOxidacao = 25 * volume;
      suggestions.push({
        id: 'cloro-choque',
        name: 'Cloro Granulado (Tratamento de Choque)',
        quantity: Math.round(choqueOxidacao),
        unit: 'g'
      });
    }

    // 2. PASTILHAS DE CLORO (Manutenção preventiva)
    // 1 pastilha de 200g para cada 45m³ por semana
    const pastilhas = Math.ceil(volume / 45);
    if (pastilhas > 0) {
      suggestions.push({
        id: 'pastilha-cloro',
        name: 'Pastilha de Cloro 200g (manutenção semanal)',
        quantity: pastilhas,
        unit: 'unidades'
      });
    }

    // 3. ALCALINIDADE TOTAL
    // Meta: 80-120 ppm (ideal 100-120 ppm)
    // Cálculo: Para elevar 10 ppm = 170g por m³
    const alcalinidadeAtual = data.alcalinidade ?? 100;
    const alcalinidadeIdeal = 120;
    
    if (alcalinidadeAtual < alcalinidadeIdeal) {
      const alcalinidadeFaltante = alcalinidadeIdeal - alcalinidadeAtual;
      // 170g por m³ para elevar 10 ppm
      const elevadorNecessario = (170 * volume * alcalinidadeFaltante) / 10;
      
      suggestions.push({
        id: 'elevador-alcalinidade',
        name: 'Elevador de Alcalinidade',
        quantity: Math.round(elevadorNecessario),
        unit: 'g'
      });
    }

    // 4. pH
    // Meta: 7.2-7.6 (ideal 7.4)
    const phAtual = data.ph ?? 7.4;
    
    // REDUTOR DE pH (para pH alto)
    if (phAtual > 7.6) {
      const diferencaPh = phAtual - 7.4;
      // 100ml por m³ para reduzir 0.2 no pH
      const redutorNecessario = (100 * volume * diferencaPh) / 0.2;
      
      suggestions.push({
        id: 'redutor-ph',
        name: 'Redutor de pH (Ácido)',
        quantity: Math.round(redutorNecessario),
        unit: 'ml'
      });
    }
    
    // ELEVADOR DE pH / BARRILHA (para pH baixo)
    if (phAtual < 7.2) {
      const diferencaPh = 7.4 - phAtual;
      // 100g por m³ para elevar 0.2 no pH
      const barrilhaNecessaria = (100 * volume * diferencaPh) / 0.2;
      
      suggestions.push({
        id: 'elevador-ph',
        name: 'Barrilha / Elevador de pH',
        quantity: Math.round(barrilhaNecessaria),
        unit: 'g'
      });
    }

    // 5. ALGICIDA
    // Manutenção preventiva: 50-100ml por 10m³ (usando 80ml como média)
    // Tratamento corretivo: 200-300ml por 10m³
    const algicidaAtual = cloroAtual; // Usar cloro como proxy para necessidade de algicida
    
    if (algicidaAtual < 1.0) {
      // Água com tendência a algas - tratamento corretivo
      const algicidaChoque = (250 * volume) / 10;
      suggestions.push({
        id: 'algicida-choque',
        name: 'Algicida (Tratamento de Choque)',
        quantity: Math.round(algicidaChoque),
        unit: 'ml'
      });
    } else {
      // Manutenção preventiva semanal
      const algicidaManutencao = (80 * volume) / 10;
      suggestions.push({
        id: 'algicida-manutencao',
        name: 'Algicida (Manutenção Semanal)',
        quantity: Math.round(algicidaManutencao),
        unit: 'ml'
      });
    }

    // 6. CLARIFICANTE
    // Para água cristalina (manutenção): 30-50ml por m³
    // Para água turva (decantação): 100-150ml por m³
    
    // Manutenção preventiva
    const clarificanteManutencao = 40 * volume;
    suggestions.push({
      id: 'clarificante-manutencao',
      name: 'Clarificante Líquido (Manutenção)',
      quantity: Math.round(clarificanteManutencao),
      unit: 'ml'
    });
    
    // Para água turva (se cloro baixo, sugere água turva)
    if (cloroAtual < 1.5) {
      const clarificanteDecantacao = 120 * volume;
      suggestions.push({
        id: 'clarificante-decantacao',
        name: 'Clarificante Líquido (Decantação)',
        quantity: Math.round(clarificanteDecantacao),
        unit: 'ml'
      });
    }

    // 7. CLARIFICANTE GEL (Forma sólida - sachês/pastilhas)
    // 1 unidade (sachê de 50g) para cada 10-15m³
    const clarificanteGel = Math.ceil(volume / 12);
    if (clarificanteGel > 0) {
      suggestions.push({
        id: 'clarificante-gel',
        name: 'Clarificante Gel / Sachê',
        quantity: clarificanteGel,
        unit: 'unidades'
      });
    }

    // 8. SULFATO DE ALUMÍNIO (Decantante para água muito turva)
    // Uso: 40-60g por m³ (usando 50g como média)
    if (cloroAtual < 1.0) {
      const sulfatoAluminio = 50 * volume;
      suggestions.push({
        id: 'sulfato-aluminio',
        name: 'Sulfato de Alumínio (Decantante)',
        quantity: Math.round(sulfatoAluminio),
        unit: 'g'
      });
    }

    // 9. LIMPA BORDAS (Manutenção da linha d'água)
    // Aplicação direta - quantidade por aplicação: 200ml
    suggestions.push({
      id: 'limpa-bordas',
      name: 'Limpa Bordas',
      quantity: 200,
      unit: 'ml'
    });

    return suggestions;
  };

  const recomendacoes = calcularProdutos(watchedValues);

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      
      // Notificar produtos selecionados
      if (onProductsSelected) {
        const selected = recomendacoes.filter(p => newSet.has(p.id));
        onProductsSelected(selected);
      }
      
      return newSet;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de Produtos</CardTitle>
        <CardDescription>
          Insira os parâmetros atuais para calcular a dosagem recomendada.<br />
          <strong>Valores Ideais:</strong> pH 7.2-7.6 | Cloro 2-3 ppm | Alcalinidade 100-120 ppm
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="ph"
                render={({ field }) => {
                  const phValues = [6.8, 7.0, 7.2, 7.4, 7.6, 7.8, 8.0];
                  const currentIndex = phValues.indexOf(Number(field.value)) >= 0 ? phValues.indexOf(Number(field.value)) : 3;
                  return (
                    <FormItem>
                      <FormLabel>pH</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(phValues[Math.max(0, currentIndex - 1)])} disabled={currentIndex === 0}>-</Button>
                          <span className="min-w-[40px] text-center font-mono text-lg">{phValues[currentIndex]}</span>
                          <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(phValues[Math.min(phValues.length - 1, currentIndex + 1)])} disabled={currentIndex === phValues.length - 1}>+</Button>
                        </div>
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="cloro"
                render={({ field }) => {
                  const cloroValues = [0, 1, 2, 3, 4];
                  const currentIndex = cloroValues.indexOf(Number(field.value)) >= 0 ? cloroValues.indexOf(Number(field.value)) : 0;
                  return (
                    <FormItem>
                      <FormLabel>Cloro (ppm)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(cloroValues[Math.max(0, currentIndex - 1)])} disabled={currentIndex === 0}>-</Button>
                          <span className="min-w-[40px] text-center font-mono text-lg">{cloroValues[currentIndex]}</span>
                          <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(cloroValues[Math.min(cloroValues.length - 1, currentIndex + 1)])} disabled={currentIndex === cloroValues.length - 1}>+</Button>
                        </div>
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="alcalinidade"
                render={({ field }) => {
                  // Alcalinidade de 0 até 200, de 10 em 10
                  const alcalinidadeValues = Array.from({ length: 21 }, (_, i) => i * 10);
                  const currentIndex = alcalinidadeValues.indexOf(Number(field.value)) >= 0 ? alcalinidadeValues.indexOf(Number(field.value)) : 8; // default 80
                  return (
                    <FormItem>
                      <FormLabel>Alcalinidade (ppm)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(alcalinidadeValues[Math.max(0, currentIndex - 1)])} disabled={currentIndex === 0}>-</Button>
                          <span className="min-w-[40px] text-center font-mono text-lg">{alcalinidadeValues[currentIndex]}</span>
                          <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(alcalinidadeValues[Math.min(alcalinidadeValues.length - 1, currentIndex + 1)])} disabled={currentIndex === alcalinidadeValues.length - 1}>+</Button>
                        </div>
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
            </div>
          </form>
        </Form>
        <div className="mt-6">
            <h4 className="font-semibold mb-3">Recomendações de Produtos:</h4>
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
                          {produto.name}: <span className="font-bold text-blue-600">{produto.quantity}{produto.unit}</span>
                        </label>
                      </div>
                    ))}
                    {selectedProducts.size > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        ✓ {selectedProducts.size} produto(s) selecionado(s) para abater do estoque
                      </p>
                    )}
                </div>
            ) : (
                <p className="text-sm text-gray-500">Aguardando parâmetros...</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}