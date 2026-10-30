'use client';

import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, Clock, CheckSquare, ShoppingCart, Plus, Minus, ArrowRight, ArrowLeft, CheckCircle2, Camera, ChevronDown, MessageSquare, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { STANDARD_PRODUCTS } from '@/lib/products';
import { PhotoCapture } from './PhotoCapture';
import { useProductRequests } from '@/hooks/useProductRequests';
import { formatProductsToString, ProductUsage, calcularDiasAteProximaVisita } from '@/lib/visit-utils';

interface ProductSuggestion {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

const formSchema = z.object({
  waterCondition: z.enum(['cristalina', 'turva', 'verde', 'leitosa'], { message: 'Selecione a condição da água.' }),
  ph: z.coerce.number().min(0, { message: 'pH inválido.' }),
  cloro: z.coerce.number().min(0, { message: 'Cloro inválido.' }),
  alcalinidade: z.coerce.number().min(0, { message: 'Alcalinidade inválida.' }),
  chlorineType: z.enum(['multiacao', 'estabilizado', 'hipoclorito', 'peroxido', 'gerador'], { message: 'Selecione o tipo de tratamento.' }),
  daysUntilNext: z.coerce.number().min(1).max(30, { message: 'Dias até próxima manutenção deve ser entre 1 e 30.' }),
  productsUsed: z.string().optional(), // Ex: "Cloro 2kg, Algicida 100ml"
  checklist: z.string().optional(), // Ex: "Escovação, Aspirar, Retrolavagem"
  productsToRequest: z.string().optional(), // Ex: "Pastilha de Cloro (5), Algicida (2)"
  other_products: z.string().optional(),
  notes: z.string().optional(),
  departureTime: z.string().optional(),
});

interface VisitFormData extends z.infer<typeof formSchema> {
  photo_url?: string | null;
}

export type { VisitFormData };

interface VisitFormProps {
  onSubmit: (data: VisitFormData, structuredProducts?: ProductSuggestion[], structuredRequestedProducts?: ProductSuggestion[], photoBlob?: Blob | null, existingRequestId?: string | null) => Promise<string | null | void>;
  isLoading: boolean;
  clientId: string;
  initialData?: Partial<VisitFormData>;
  onFinish?: () => void;
}

export function VisitForm({ onSubmit, isLoading, clientId, initialData, onFinish }: VisitFormProps) {
  const { client, visits, isLoading: isClientLoading } = useClientDetails(clientId);
  const { role } = useAuth();
  const { getActiveRequestForClient } = useProductRequests();
  const [step, setStep] = useState(1);
  const [isAbsent, setIsAbsent] = useState(false);
  const notificationShownRef = useRef<string | null>(null);
  
  // Renderizar estado de erro apenas se não estiver carregando e o cliente for nulo
  if (!isClientLoading && !client && notificationShownRef.current !== clientId) {
    notificationShownRef.current = clientId;
    toast.error('Cliente não localizado para iniciar o relatório.');
  }

  // Estado para foto da piscina
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Estado para produtos sugeridos e selecionados
  const [suggestedProducts, setSuggestedProducts] = useState<ProductSuggestion[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [userEditedQuantities, setUserEditedQuantities] = useState<Record<string, string | number>>({});
  
  // Estado para produtos utilizados manualmente (com quantidades editáveis)
  const [productsUsedList, setProductsUsedList] = useState<ProductUsage[]>([]);
  
  // Estado para Checklist (agora integrado ao passo 3)
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  
  // Estado para Produtos a Solicitar (agora integrado ao passo 4)
  const [selectedProductsToRequest, setSelectedProductsToRequest] = useState<Record<string, number>>({});
  const [initialProductRequestIds, setInitialProductRequestIds] = useState<Set<string>>(new Set());
  const [activeProductRequestId, setActiveProductRequestId] = useState<string | null>(null);
  const [activeProductRequestStatus, setActiveProductRequestStatus] = useState<'pending' | 'approved' | null>(null);
  
  // Peróxido counter state
  const [peroxideCounter, setPeroxideCounter] = useState<{ days: number, date: string } | null>(null);
  
  // Opções de processos disponíveis
  const processOptions = [
    'Aspirar',
    'Peneirar',
    'Escovar Paredes e Fundo',
    'Limpar Borda',
    'Limpeza de Pré-Filtro',
    'Retrolavagem da Areia'
  ];
  
  // Opções de produtos disponíveis para solicitar (usando STANDARD_PRODUCTS)
  const productOptions = STANDARD_PRODUCTS;
  
  // Função para obter horário atual formatado
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  const form = useForm<VisitFormData>({
    defaultValues: {
      waterCondition: initialData?.waterCondition || 'cristalina',
      ph: initialData?.ph || 7.4,
      cloro: initialData?.cloro || 0,
      alcalinidade: initialData?.alcalinidade || 100,
      chlorineType: initialData?.chlorineType || 'multiacao',
      daysUntilNext: initialData?.daysUntilNext || 7, // será recalculado quando o client carregar
      productsUsed: initialData?.productsUsed || '',
      checklist: initialData?.checklist || '',
      productsToRequest: initialData?.productsToRequest || '',
      notes: initialData?.notes || '',
      departureTime: initialData?.departureTime || getCurrentTime(),
    },
  });

    // Carregar dados da última visita ou do cadastro do cliente para inicializar parâmetros
    useEffect(() => {
      // Se não temos cliente ainda, não fazemos nada
      if (!client) return;

      // Só atualizamos os valores se o form ainda estiver com os valores padrão para não sobrescrever o que o usuário já digitou
      const currentValues = form.getValues();
      const isDefaultValues = 
        currentValues.ph === 7.4 && 
        currentValues.cloro === 0 && 
        currentValues.alcalinidade === 100;

      // 1. Tentar cadastro do cliente (mais robusto/persistente)
      if (!initialData) {
        // Se o tipo de tratamento atual for o padrão ('multiacao') e o cliente tiver um tipo diferente salvo
        if (currentValues.chlorineType === 'multiacao' && client.chlorineType && client.chlorineType !== 'multiacao') {
          form.setValue('chlorineType', client.chlorineType as any);
        }
        
        // Calcular dias até próxima visita baseado nos dias cadastrados
        const diasCalculados = calcularDiasAteProximaVisita(client.visitDays);
        form.setValue('daysUntilNext', diasCalculados);
      }

      // Cálculo do contador de Peróxido (Prioridade para peroxideStartDate do cliente)
      let peroxideBaseDate: string | null = (client as any).peroxideStartDate || null;

      // Se não houver data no cadastro, tentamos buscar no histórico de visitas
      if (!peroxideBaseDate && visits && visits.length > 0) {
        const otherVisits = initialData ? visits.filter(v => (v as any).id !== (initialData as any).id) : visits;
        const lastPeroxideVisit = otherVisits.find(v => v.chlorineType === 'peroxido');
        if (lastPeroxideVisit) {
          peroxideBaseDate = lastPeroxideVisit.timestamp;
        }
      }

      if (peroxideBaseDate) {
        const lastDate = new Date(peroxideBaseDate);
        lastDate.setHours(12, 0, 0, 0);
        
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        
        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        
        let dateLabel = new Date(peroxideBaseDate).toLocaleDateString('pt-BR');
        if (diffDays === 0) dateLabel = 'Hoje';
        else if (diffDays === 1) dateLabel = 'Ontem';

        // O "Dia" do tratamento é diffDays + 1 (Se aplicou hoje, é dia 1)
        setPeroxideCounter({ days: diffDays + 1, date: dateLabel });
      } else {
        setPeroxideCounter(null);
      }

      // 2. Tentar histórico de visitas como fallback para parâmetros químicos
      if (visits && visits.length > 0 && !initialData) {
        const lastVisit = visits[0];
        
        if (isDefaultValues) {
          if (lastVisit.ph !== undefined && lastVisit.ph !== null && lastVisit.ph !== 0) {
            form.setValue('ph', lastVisit.ph);
          }
          if (lastVisit.cloro !== undefined && lastVisit.cloro !== null && lastVisit.cloro !== 0) {
            form.setValue('cloro', lastVisit.cloro);
          }
          if (lastVisit.alcalinidade !== undefined && lastVisit.alcalinidade !== null && lastVisit.alcalinidade !== 0) {
            form.setValue('alcalinidade', lastVisit.alcalinidade);
          }
          
          // Se ainda não estiver setado via registro do cliente, usa o histórico
          if (form.getValues('chlorineType') === 'multiacao' && lastVisit.chlorineType) {
            form.setValue('chlorineType', lastVisit.chlorineType as any);
          }
        }
      }
    }, [visits, client, initialData, form]);

  // Carregar processos selecionados do checklist inicial
  useEffect(() => {
    if (initialData?.checklist) {
      const processes = initialData.checklist
        .split('\n')
        .map(line => line.replace(/^[•\-]\s*/, '').trim())
        .filter(line => line.length > 0 && processOptions.includes(line));
      setSelectedProcesses(processes);
    }
  }, [initialData?.checklist]);

  // Carregar produtos solicitados iniciais
  useEffect(() => {
    if (initialData?.productsToRequest) {
      const productsMap: Record<string, number> = {};
      const lines = initialData.productsToRequest.split('\n');
      lines.forEach(line => {
        const match = line.match(/^[•\-]\s*(.+?)\s*\((\d+)\)/);
        if (match) {
          const [, productName, quantity] = match;
          if (productOptions.some(p => p.name === productName)) {
            productsMap[productName] = parseInt(quantity, 10);
          }
        }
      });
      setSelectedProductsToRequest(productsMap);
    }
  }, [initialData?.productsToRequest]);

  // Carregar solicitação de produtos pendente
  useEffect(() => {
    const checkActiveRequests = async () => {
      if (!clientId) return;
      
      console.log('🔄 Buscando solicitações ativas para o cliente:', clientId);
      const activeRequest = await getActiveRequestForClient(clientId);
      console.log('📦 Solicitação ativa encontrada:', activeRequest);

      if (activeRequest) {
        setActiveProductRequestId(activeRequest.id);
        setActiveProductRequestStatus(activeRequest.status as 'pending' | 'approved');
        
        // Unificar 'products' e 'items' para retrocompatibilidade
        const productsList = (activeRequest.products || (activeRequest as any).items || []) as any[];
        console.log('📋 Lista de produtos bruta:', productsList);

        // Parsear os produtos da requisição para o estado local
        const productsMap: Record<string, number> = {};
        const initialIds = new Set<string>();

        productsList.forEach(item => {
          console.log('🔍 Analisando item:', item);
          
          let rawName: string;
          let qty: number;
          let itemId: string | null = null;

          if (typeof item === 'object' && item !== null) {
            rawName = item.name || '';
            qty = item.quantity || 1;
            itemId = item.id || null;
          } else {
            // Legado: suporte a string pura "Nome (Qtd)"
            const cleanLine = String(item).replace(/^[•\-\*\s]+/, '').trim();
            const match = cleanLine.match(/(.+?)\s*\((\d+)\)/);
            rawName = match ? match[1] : cleanLine;
            qty = match ? parseInt(match[2], 10) : 1;
          }
          
          const cleanedName = rawName.trim().toLowerCase();
          
          // Mapa de Sinônimos Robusto
          const synonymMap: Record<string, string> = {
            'cloro 3 em 1': 'cloro-multiacao',
            'cloro 3em1': 'cloro-multiacao',
            'cloro multiacao': 'cloro-multiacao',
            'cloro multi ação': 'cloro-multiacao',
            'cloro 3 em 1 (multiação)': 'cloro-multiacao',
            'pastilha de cloro': 'pastilha-cloro',
            'pastilha cloro': 'pastilha-cloro',
            'elevador de alcalinidade': 'elevador-alcalinidade',
            'alcalinidade': 'elevador-alcalinidade',
            'barrilha': 'barrilha',
            'barrilha leve': 'barrilha',
            'elevador de ph': 'barrilha',
            'redutor de ph': 'redutor-ph',
            'redutor ph': 'redutor-ph',
            'clarificante': 'clarificante',
            'clarificante liquido': 'clarificante',
            'clarificante líquido': 'clarificante',
            'clarificante gel': 'clarificante-gel',
            'gel clarificante': 'clarificante-gel',
            'sulfato de aluminio': 'sulfato-aluminio',
            'sulfato de alumínio': 'sulfato-aluminio',
            'algicida choque': 'algicida-choque',
            'algicida de choque': 'algicida-choque',
            'algicida manutencao': 'algicida-manutencao',
            'algicida de manutenção': 'algicida-manutencao',
          };

          // Tentar pelo ID direto se existir no objeto
          let product = itemId ? productOptions.find(p => p.id === itemId) : null;

          // Se não achou por ID, tentar pelo mapa de sinônimos
          if (!product) {
            const targetId = synonymMap[cleanedName] || synonymMap[cleanedName.replace(/de /g, '').trim()];
            product = targetId ? productOptions.find(p => p.id === targetId) : null;
          }
          
          // Se ainda não achou, tenta pelo nome exato
          if (!product) {
            product = productOptions.find(p => p.name.toLowerCase() === cleanedName);
          }

          if (product) {
            productsMap[product.id] = (productsMap[product.id] || 0) + qty;
            initialIds.add(product.id);
            console.log(`✅ Produto mapeado: ${product.name} id=${product.id} qty=${qty}`);
          } else {
             console.log(`ℹ️ Item tratado apenas como texto (não mapeado): "${rawName}"`);
          }
        });
        
        console.log('🎯 Mapa final de produtos:', productsMap);
        if (Object.keys(productsMap).length > 0) {
          setSelectedProductsToRequest(prev => ({ ...prev, ...productsMap }));
          setInitialProductRequestIds(initialIds);

          // Sincronizar campo de texto do formulário com os produtos mapeados
          const productsAsText = productsList.map(p => 
            typeof p === 'object' ? `${p.name} (${p.quantity})` : p
          ).join('\n');
          form.setValue('productsToRequest', productsAsText);
        }
      }
    };
    
    checkActiveRequests();
  }, [clientId]);

  // Monitorar Chlorine Type e Cloro para sugestão automática de Sal (Gerador)
  const watchedChlorineType = form.watch('chlorineType');
  const watchedCloro = form.watch('cloro');

  // Recalcular contador de Peróxido quando o usuário muda a seleção
  useEffect(() => {
    if (watchedChlorineType === 'peroxido') {
      // Calcular o contador quando peróxido é selecionado
      let peroxideBaseDate: string | null = (client as any)?.peroxideStartDate || null;

      // Se não houver data no cadastro, tenta buscar no histórico de visitas
      if (!peroxideBaseDate && visits && visits.length > 0) {
        const otherVisits = initialData ? visits.filter(v => (v as any).id !== (initialData as any).id) : visits;
        const lastPeroxideVisit = otherVisits.find(v => v.chlorineType === 'peroxido');
        if (lastPeroxideVisit) {
          peroxideBaseDate = lastPeroxideVisit.timestamp;
        }
      }

      if (peroxideBaseDate) {
        const lastDate = new Date(peroxideBaseDate);
        lastDate.setHours(12, 0, 0, 0);
        
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        
        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        
        let dateLabel = new Date(peroxideBaseDate).toLocaleDateString('pt-BR');
        if (diffDays === 0) dateLabel = 'Hoje';
        else if (diffDays === 1) dateLabel = 'Ontem';

        // O "Dia" do tratamento é diffDays + 1 (Se aplicou hoje, é dia 1)
        setPeroxideCounter({ days: diffDays + 1, date: dateLabel });
      } else {
        setPeroxideCounter(null);
      }
    } else {
      // Limpar contador se mudar para outro tipo
      setPeroxideCounter(null);
    }
  }, [watchedChlorineType, client, visits, initialData]);

  useEffect(() => {
    const volume = client?.poolVolume || 0;
    if (watchedChlorineType === 'gerador' && volume > 0) {
      if (watchedCloro === 0) {
        const saltQty = Math.ceil(4 * volume); // 4kg por m3
        
        // Se o sal ainda não estiver na solicitação com a quantidade calculada ou maior
        if ((selectedProductsToRequest['sal'] || 0) < saltQty) {
          setSelectedProductsToRequest(prev => {
             // Só adiciona se não houver um pedido maior já
             if ((prev['sal'] || 0) >= saltQty) return prev;
             return {
               ...prev,
               'sal': saltQty
             };
          });
        }
      } else if (watchedCloro > 0) {
        // Se o cloro for maior que zero e o tipo for gerador, remove o sal automaticamente
        setSelectedProductsToRequest(prev => {
          if (!prev['sal']) return prev;
          const { sal, ...rest } = prev;
          return rest;
        });
      }
    }
  }, [watchedChlorineType, watchedCloro, client?.poolVolume]);

  // Função para calcular produtos
  const calcularProdutos = (
    waterCondition: string,
    ph: number,
    cloro: number,
    alcalinidade: number,
    chlorineType: string,
    daysUntilNext: number
  ): ProductSuggestion[] => {
    const volume = client?.poolVolume || 0;
    if (volume === 0) return [];
    
    const suggestions: ProductSuggestion[] = [];

    if (waterCondition === 'cristalina' || waterCondition === 'turva' || waterCondition === 'leitosa') {
      if (ph > 7.6) {
        const diferencaPh = ph - 7.4;
        const redutorNecessario = (15 * volume * diferencaPh) / 0.2;
        suggestions.push({ id: 'redutor-ph', name: 'Redutor de pH', quantity: Math.round(redutorNecessario), unit: 'ml' });
      }
      
      const isChlorineTreatment = chlorineType !== 'peroxido' && chlorineType !== 'gerador';

      if (chlorineType === 'peroxido') {
        const peroxidoNecessario = volume / 10; // 1L para cada 10m3
        suggestions.push({ id: 'peroxido', name: 'Peróxido', quantity: Number(peroxidoNecessario.toFixed(1)), unit: 'l' });
      }

      if (cloro === 0 && isChlorineTreatment) {
        if (chlorineType === 'multiacao') {
          suggestions.push({ id: 'cloro-multiacao', name: 'Cloro Multiação', quantity: Math.round(30 * volume), unit: 'g' });
        } else if (chlorineType === 'estabilizado' || chlorineType === 'hipoclorito') {
          suggestions.push({ id: chlorineType === 'estabilizado' ? 'cloro-estabilizado' : 'hipoclorito', name: chlorineType === 'estabilizado' ? 'Cloro Estabilizado' : 'Hipoclorito de Cálcio', quantity: Math.round(15 * volume), unit: 'g' });
        }
      } else if (cloro >= 1 && cloro <= 2 && isChlorineTreatment) {
        if (chlorineType === 'multiacao') {
          suggestions.push({ id: 'cloro-multiacao', name: 'Cloro Multiação (Manutenção)', quantity: Math.round(volume * 2 * daysUntilNext), unit: 'g' });
        } else if (chlorineType === 'estabilizado' || chlorineType === 'hipoclorito') {
          suggestions.push({ id: chlorineType === 'estabilizado' ? 'cloro-estabilizado' : 'hipoclorito', name: `${chlorineType === 'estabilizado' ? 'Cloro Estabilizado' : 'Hipoclorito de Cálcio'} (Manutenção)`, quantity: Math.round(volume * 1 * daysUntilNext), unit: 'g' });
        }
      }
      
      if (alcalinidade <= 70) {
        const aumentoDesejado = 120 - alcalinidade;
        const elevadorNecessario = (aumentoDesejado / 10) * 17 * volume;
        suggestions.push({ id: 'elevador-alcalinidade', name: 'Elevador de Alcalinidade', quantity: Math.round(elevadorNecessario), unit: 'g' });
      }
      const doseClarificante = (waterCondition === 'turva' || waterCondition === 'leitosa') ? 6 : 1.5;
      suggestions.push({ id: 'clarificante', name: waterCondition === 'cristalina' ? 'Clarificante' : 'Clarificante (Dosagem Reforçada)', quantity: Math.round(doseClarificante * volume), unit: 'ml' });
      
      // Sugestão de Clarificante em Gel (1 goma para cada 30 m³)
      const doseGel = Math.ceil(volume / 30);
      suggestions.push({ id: 'clarificante-gel', name: 'Clarificante em Gel', quantity: doseGel, unit: doseGel > 1 ? 'gomas' : 'goma' });
      
      suggestions.push({ id: 'algicida-manutencao', name: 'Algicida de Manutenção', quantity: Math.round(6 * volume), unit: 'ml' });
      const pastilhas = volume / 25;
      if (pastilhas >= 0.5 && isChlorineTreatment) {
        suggestions.push({ id: 'pastilha-cloro', name: 'Pastilha de Cloro', quantity: Math.ceil(pastilhas), unit: pastilhas > 1 ? 'unidades' : 'unidade' });
      }
    }

    if (waterCondition === 'verde') {
      suggestions.push({ id: 'sulfato-aluminio', name: 'Sulfato de Alumínio (Decantação)', quantity: Math.round(20 * volume), unit: 'g' });
      suggestions.push({ id: 'barrilha', name: 'Barrilha (Elevador de pH)', quantity: Math.round(20 * volume), unit: 'g' });
      suggestions.push({ id: 'cloro-estabilizado', name: 'Cloro Granulado (Choque)', quantity: Math.round(30 * volume), unit: 'g' });
    }

    return suggestions;
  };

  // Recalcular produtos
  useEffect(() => {
    // Escuta mudanças nos valores do formulário
    const subscription = form.watch((value) => {
      // Verificamos se temos os dados básicos necessários para o cálculo
      // O volume da piscina é essencial
      if (client?.poolVolume && value.waterCondition && value.ph !== undefined && value.cloro !== undefined && value.alcalinidade !== undefined && value.chlorineType) {
        const produtos = calcularProdutos(
          value.waterCondition,
          Number(value.ph),
          Number(value.cloro),
          Number(value.alcalinidade),
          value.chlorineType,
          Number(value.daysUntilNext || 7)
        );
        
        // Aplicar quantidades editadas pelo usuário sobre as sugestões
        const produtosComEdicao = produtos.map(p => {
          const userVal = userEditedQuantities[p.id];
          let finalQty = p.quantity;
          
          if (userVal !== undefined) {
            const numVal = typeof userVal === 'string' ? parseFloat(userVal) : userVal;
            finalQty = isNaN(numVal) ? 0 : numVal;
          }

          return {
            ...p,
            quantity: finalQty
          };
        });

        console.log(`Recalculando produtos para volume ${client.poolVolume}:`, produtosComEdicao);
        setSuggestedProducts(produtosComEdicao);
      } else {
        if (!client?.poolVolume) {
          console.warn('Volume da piscina não encontrado para o cálculo de produtos.');
        }
      }
    });
    
    // Força um cálculo inicial se o cliente já estiver carregado
    if (client?.poolVolume) {
      const currentValues = form.getValues();
      const produtos = calcularProdutos(
        currentValues.waterCondition,
        Number(currentValues.ph),
        Number(currentValues.cloro),
        Number(currentValues.alcalinidade),
        currentValues.chlorineType,
        Number(currentValues.daysUntilNext || 7)
      );
      setSuggestedProducts(produtos);
    }

    return () => subscription.unsubscribe();
  }, [form.watch, client?.poolVolume]);

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(productId)) newSelected.delete(productId);
    else newSelected.add(productId);
    setSelectedProductIds(newSelected);
    
    // Atualizar a lista estruturada de produtos utilizados
    const selectedProds = suggestedProducts.filter(p => newSelected.has(p.id));
    
    // Sincronizar campo de texto para persistência legada
    form.setValue('productsUsed', formatProductsToString(selectedProds));
  };

  const updateUsedProductQuantity = (productId: string, quantity: number | string) => {
    // Persistir a edição do usuário (inclusive strings vazias enquanto digita)
    setUserEditedQuantities(prev => ({
      ...prev,
      [productId]: quantity
    }));

    const numValue = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
    const finalNumericValue = isNaN(numValue) ? 0 : numValue;

    // Para produtos sugeridos
    if (selectedProductIds.has(productId)) {
       setSuggestedProducts(prev => {
         const updated = prev.map(p => 
           p.id === productId ? { ...p, quantity: finalNumericValue } : p
         );
         
         // Sincronizar com o campo de texto
         const selectedProds = updated.filter(p => selectedProductIds.has(p.id));
         form.setValue('productsUsed', formatProductsToString(selectedProds));
         
         return updated;
       });
    }
  };

  const toggleProcess = (process: string) => {
    setSelectedProcesses(prev => prev.includes(process) ? prev.filter(p => p !== process) : [...prev, process]);
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    setSelectedProductsToRequest(prev => {
      const updated = { ...prev };
      if (quantity <= 0) delete updated[productId];
      else updated[productId] = quantity;
      return updated;
    });
  };

  const handleSendReportWhatsApp = () => {
    if (!client?.phone) {
      toast.error('Cliente não possui telefone cadastrado.');
      return;
    }
    const data = form.getValues();
    let message = `🏊 Relatório da Manutenção - ${client.name}\n`;
    message += `\n📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    if (data.departureTime) message += `⏰ *Saída:* ${data.departureTime}\n`;
    
    message += `\n💧 Parâmetros da Água:\n`;
    if (data.ph) message += `• pH: ${data.ph} (Ideal: 7,2 - 7,6)\n`;
    if (data.cloro) message += `• Cloro: ${data.cloro} ppm (Ideal: 1 - 3 ppm)\n`;
    if (data.alcalinidade) message += `• Alcalinidade: ${data.alcalinidade} ppm (Ideal: 80 - 120 ppm)\n`;
    if (data.waterCondition) message += `• Condição: ${data.waterCondition}\n`;
    
    if (data.checklist) message += `\n🔄 Processos Realizados:\n${data.checklist}\n`;
    if (data.productsUsed) message += `\n🧪 Produtos Utilizados:\n${data.productsUsed}\n`;
    
    if (data.productsToRequest) {
      message += `\n📦 Solicitação de Produtos:\n`;
      message += `${data.productsToRequest}\n`;
    }
    
    if (data.notes) message += `\n📝 Obs Geral:\n${data.notes}\n`;
    if (data.photo_url) message += `\n📸 Foto da Piscina:\n${data.photo_url}\n`;
    
    message += `\n✅ Visita concluída!\n`;
    message += `\n🏊 _Relatório enviado automaticamente via Piscineiro Mestre_\n`;
    
    const phoneNumber = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    
    if (onFinish) {
      onFinish();
    }
  };

  const handleNext = () => {
    if (step === 3) {
      const checklistText = selectedProcesses.map(p => `• ${p}`).join('\n');
      form.setValue('checklist', checklistText);
    }
    if (step === 4) {
      const productsText = Object.entries(selectedProductsToRequest)
        .filter(([, quantity]) => quantity > 0)
        .map(([id, quantity]) => {
          const product = STANDARD_PRODUCTS.find(p => p.id === id);
          return `${product?.name || id} (${quantity})`;
        })
        .join('\n');
      form.setValue('productsToRequest', productsText);
    }
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleFinalize = async () => {
    const data = form.getValues();
    
    // Coleta produtos sugeridos que foram selecionados
    const selectedSuggested = suggestedProducts.filter(p => selectedProductIds.has(p.id));
    
    // Combina produtos sugeridos com produtos manuais
    const structuredProducts: ProductSuggestion[] = [
      ...selectedSuggested,
      ...productsUsedList.map(p => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        unit: p.unit
      }))
    ];
    
    const structuredRequestedProducts = Object.entries(selectedProductsToRequest)
      .filter(([, quantity]) => quantity > 0)
      .map(([id, quantity]) => {
        const product = STANDARD_PRODUCTS.find(p => p.id === id);
        return {
          id: id,
          name: product?.name || 'Desconhecido',
          quantity: quantity,
          unit: product?.unit || 'un'
        };
      });

    const photoUrl = await onSubmit(data, structuredProducts, structuredRequestedProducts, photoBlob, activeProductRequestId);
    
    // Atualizar o formulário com a URL final se recebida
    if (photoUrl && typeof photoUrl === 'string') {
      form.setValue('photo_url', photoUrl);
    }
    
    setStep(6); // Success step
  };

  return (
    <Form {...form}>
      <div className="space-y-4">
        {/* Step 1: Condição e Cloro */}
        {step === 1 && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300 border-none shadow-none">
            <CardHeader>
              <CardTitle>Passo 1/5: Condições Iniciais</CardTitle>
              <CardDescription>Informe o estado atual da piscina</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="waterCondition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-bold">Condição da Água</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'cristalina', label: '✨ Cristalina' },
                          { value: 'turva', label: '🌫️ Turva' },
                          { value: 'verde', label: '🟢 Verde' },
                          { value: 'leitosa', label: '🥛 Leitosa' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${field.value === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-muted bg-background'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chlorineType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-bold">Tipo de Tratamento</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'multiacao', label: 'Cloro Multiação' },
                            { value: 'estabilizado', label: 'Cloro Estabilizado' },
                            { value: 'hipoclorito', label: 'Hipoclorito' },
                            { value: 'gerador', label: 'Gerador Cloro' },
                            { value: 'peroxido', label: 'Peróxido' },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => field.onChange(opt.value)}
                              className={`
                                relative p-3 rounded-lg border-2 text-center text-sm font-bold transition-all h-16 flex items-center justify-center overflow-hidden
                                ${field.value === opt.value 
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-sm' 
                                  : 'border-muted bg-background text-muted-foreground'
                                }
                              `}
                            >
                              <span>{opt.label}</span>
                              {opt.value === 'peroxido' && peroxideCounter && (
                                <div className="absolute top-0 right-0 p-1 bg-purple-600 text-white text-[9px] font-black rounded-bl-md shadow-sm">
                                  DIA {peroxideCounter.days}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        
                        {field.value === 'peroxido' && peroxideCounter && (
                          <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg animate-in fade-in slide-in-from-top-1">
                            <p className="text-xs text-purple-700 dark:text-purple-300 font-medium flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Contagem: Dia {peroxideCounter.days} (desde {peroxideCounter.date})
                            </p>
                          </div>
                        )}
                        
                        {isAbsent && (
                          <div className="mt-4 p-4 bg-orange-100 dark:bg-orange-950/40 border-2 border-orange-500 rounded-xl animate-in zoom-in-95">
                            <p className="text-sm text-orange-800 dark:text-orange-200 font-black flex items-center gap-2 uppercase tracking-tight">
                              <Info className="h-5 w-5 text-orange-600" />
                              Modo Cliente Ausente Ativado
                            </p>
                            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1 font-medium italic">
                              Os parâmetros químicos serão salvos com os valores padrão atuais.
                            </p>
                          </div>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button onClick={handleNext} className="w-full h-14 text-lg">Avançar <ArrowRight className="ml-2 h-5 w-5" /></Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAbsent(true);
                  setStep(5);
                  form.setValue('notes', 'CLIENTE AUSENTE - Não foi possível realizar a manutenção completa.');
                }}
                className="w-full h-12 text-base font-bold border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30"
              >
                Cliente Ausente
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Parâmetros e Produtos */}
        {step === 2 && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300 border-none shadow-none">
            <CardHeader>
              <CardTitle>Passo 2/5: Parâmetros e Tratamento</CardTitle>
              <CardDescription>Medições e produtos aplicados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {['ph', 'cloro', 'alcalinidade'].map((param) => (
                  <FormField
                    key={param}
                    control={form.control}
                    name={param as any}
                    render={({ field }) => (
                      <FormItem className="bg-muted/20 p-3 rounded-xl border border-muted">
                        <FormLabel className="capitalize text-sm font-bold">{param === 'ph' ? 'pH' : param}</FormLabel>
                        <div className="flex items-center justify-between mt-1">
                          <Button 
                            type="button" 
                            variant="secondary" 
                            className="h-12 w-12 rounded-full shadow-sm" 
                            onClick={() => {
                              const val = Number(field.value);
                              if (param === 'ph') field.onChange((val - 0.2).toFixed(1));
                              else if (param === 'cloro') field.onChange(Math.max(0, val - 1));
                              else field.onChange(Math.max(0, val - 10));
                            }}
                          >
                            <Minus className="h-5 w-5" />
                          </Button>
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-mono font-bold">{Number(field.value).toFixed(param === 'ph' ? 1 : 0)}</span>
                            <span className="text-[10px] uppercase text-muted-foreground">{param === 'ph' ? 'escala' : 'ppm'}</span>
                          </div>
                          <Button 
                            type="button" 
                            variant="secondary" 
                            className="h-12 w-12 rounded-full shadow-sm" 
                            onClick={() => {
                              const val = Number(field.value);
                              if (param === 'ph') field.onChange((val + 0.2).toFixed(1));
                              else if (param === 'cloro') field.onChange(val + 1);
                              else field.onChange(val + 10);
                            }}
                          >
                            <Plus className="h-5 w-5" />
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              {watchedChlorineType === 'gerador' && watchedCloro === 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border-2 border-orange-200 dark:border-orange-800 animate-in fade-in slide-in-from-top-1">
                  <h4 className="font-black text-orange-800 dark:text-orange-200 mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Info className="h-4 w-4" /> Recomendação de Sal
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Cloro zerado com gerador detectado. <span className="font-bold">Sal para Gerador ({Math.ceil(4 * (client?.poolVolume || 0))}kg)</span> foi adicionado à lista de solicitações.
                  </p>
                </div>
              )}

              {suggestedProducts.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border-2 border-green-200 dark:border-green-800">
                  <h4 className="font-black text-green-800 dark:text-green-200 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Sugestões de Aplicação
                  </h4>
                  <div className="space-y-3">
                    {suggestedProducts.map((p) => {
                      const isSelected = selectedProductIds.has(p.id);
                      return (
                        <div 
                          key={p.id} 
                          className={cn(
                            "flex flex-col gap-3 p-3 rounded-xl border-2 transition-all",
                            isSelected 
                              ? "border-green-600 bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100" 
                              : "border-dashed border-green-300 dark:border-green-800 opacity-70"
                          )}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div 
                              onClick={() => toggleProduct(p.id)}
                              className={`h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${isSelected ? 'bg-green-600 border-green-600' : 'border-green-400'}`}
                            >
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                            </div>
                            <div className="flex-1" onClick={() => toggleProduct(p.id)}>
                              <p className="text-sm font-bold uppercase">{p.name}</p>
                            </div>
                          </div>

                            <div className="flex items-center gap-2 ml-9 animate-in fade-in slide-in-from-top-1">
                              <input
                                type="number"
                                inputMode="decimal"
                                step={p.unit === 'l' ? 0.5 : 1}
                                min={0}
                                value={userEditedQuantities[p.id] !== undefined ? userEditedQuantities[p.id] : (p.quantity === 0 ? '' : p.quantity)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  updateUsedProductQuantity(p.id, e.target.value);
                                }}
                                onBlur={(e) => {
                                  // Se fechar o campo vazio, garante que volte para zero nas sugestões, mas mantém rastreio
                                  if (e.target.value === '') {
                                    updateUsedProductQuantity(p.id, 0);
                                  }
                                }}
                                placeholder="0"
                                className="w-20 h-10 text-center text-lg font-black rounded-xl border-2 border-green-400 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-xs font-bold uppercase text-muted-foreground">{p.unit}</span>
                            </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="productsUsed"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-sm font-bold uppercase tracking-tight">Outros Produtos Utilizados</FormLabel>
                    
                    <div className="flex gap-2">
                       <Select onValueChange={(val) => {
                         const product = productOptions.find(p => p.id === val);
                         if (product) {
                           const current = productsUsedList.find(p => p.id === val);
                           if (current) {
                             setProductsUsedList(prev => {
                               const updated = prev.map(p => p.id === val ? { ...p, quantity: p.quantity + 1 } : p);
                               form.setValue('productsUsed', formatProductsToString([...suggestedProducts.filter(sp => selectedProductIds.has(sp.id)), ...updated]));
                               return updated;
                             });
                           } else {
                             setProductsUsedList(prev => {
                               const updated = [...prev, { id: product.id, name: product.name, quantity: 1, unit: (product as any).unit || 'un' }];
                               form.setValue('productsUsed', formatProductsToString([...suggestedProducts.filter(sp => selectedProductIds.has(sp.id)), ...updated]));
                               return updated;
                             });
                           }
                         }
                       }}>
                         <SelectTrigger className="flex-1 h-12 rounded-xl border-2">
                           <SelectValue placeholder="Adicionar outro produto..." />
                         </SelectTrigger>
                         <SelectContent>
                           {productOptions.filter(p => !selectedProductIds.has(p.id)).map(p => (
                             <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>

                    {productsUsedList.length > 0 && (
                      <div className="space-y-2">
                        {productsUsedList.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border-2 border-muted">
                            <div className="flex-1">
                              <p className="text-xs font-bold uppercase">{p.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                inputMode="decimal"
                                min={0}
                                value={p.quantity}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  const newQty = isNaN(val) ? 0 : val;
                                  setProductsUsedList(prev => {
                                    const updated = newQty <= 0
                                      ? prev.filter(item => item.id !== p.id)
                                      : prev.map(item => item.id === p.id ? { ...item, quantity: newQty } : item);
                                    form.setValue('productsUsed', formatProductsToString([...suggestedProducts.filter(sp => selectedProductIds.has(sp.id)), ...updated]));
                                    return updated;
                                  });
                                }}
                                className="w-16 h-9 text-center font-bold rounded-xl border-2 border-muted bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-[10px] font-bold uppercase text-muted-foreground">{p.unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={handleBack} className="h-12"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
              <Button onClick={handleNext} className="flex-1 h-12">Avançar <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Checklist */}
        {step === 3 && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300 border-none shadow-none">
            <CardHeader>
              <CardTitle>Passo 3/5: Checklist de Serviços</CardTitle>
              <CardDescription>Toque nos serviços realizados hoje</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {processOptions.map((process) => {
                  const isSelected = selectedProcesses.includes(process);
                  return (
                    <button
                      key={process}
                      type="button"
                      onClick={() => toggleProcess(process)}
                      className={`
                        flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all active:scale-95 text-center h-24
                        ${isSelected 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-muted bg-background text-muted-foreground'
                        }
                      `}
                    >
                      <span className="text-sm font-bold leading-tight uppercase">{process}</span>
                      {isSelected && <CheckCircle2 className="mt-2 h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={handleBack} className="h-12"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
              <Button onClick={handleNext} className="flex-1 h-12">Avançar <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Solicitação de Produtos */}
        {step === 4 && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300 border-none shadow-none">
            <CardHeader>
              <CardTitle>Passo 4/5: Solicitar Produtos</CardTitle>
              <CardDescription>O que está faltando no cliente?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 max-h-[60vh] overflow-y-auto pb-6 text-slate-900 dark:text-slate-100">
              {/* Grade de Produtos Prioritários */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Produtos Frequentes</h4>
                <div className="grid grid-cols-2 gap-3">
                  {productOptions
                    .filter(p => [
                      'cloro-multiacao', 
                      'pastilha-cloro', 
                      'elevador-alcalinidade', 
                      'redutor-ph', 
                      'clarificante', 
                      'clarificante-gel', 
                      'algicida-manutencao',
                      'algicida-choque'
                    ].includes(p.id))
                    .map((product) => {
                      const quantity = selectedProductsToRequest[product.id] || 0;
                      const hasQuantity = quantity > 0;
                      const isInitial = initialProductRequestIds.has(product.id);
                      
                      return (
                        <div 
                          key={product.id} 
                          className={cn(
                            "flex flex-col p-3 border-2 rounded-2xl transition-all justify-between min-h-[120px]",
                            isInitial 
                              ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500 shadow-sm shadow-blue-500/20" 
                              : hasQuantity 
                                ? "border-orange-500 bg-orange-500/5 ring-1 ring-orange-500" 
                                : "border-muted bg-card"
                          )}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={cn(
                              "text-[11px] font-black uppercase tracking-tight line-clamp-2 leading-tight",
                              isInitial 
                                ? "text-blue-700 dark:text-blue-400" 
                                : hasQuantity 
                                  ? "text-orange-700 dark:text-orange-400" 
                                  : "text-muted-foreground"
                            )}>
                              {product.name}
                            </span>
                          </div>
                          
                          <div className={cn(
                            "flex items-center justify-between p-1 rounded-full border border-border/50",
                            isInitial ? "bg-blue-100/50 dark:bg-blue-900/20" : "bg-muted/40"
                          )}>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 rounded-full hover:bg-white dark:hover:bg-slate-800" 
                              onClick={() => updateProductQuantity(product.id, Math.max(0, quantity - 1))} 
                              disabled={!hasQuantity}
                            >
                              <Minus className={cn(
                                "h-5 w-5", 
                                !hasQuantity 
                                  ? "text-muted-foreground/30" 
                                  : isInitial ? "text-blue-600" : "text-orange-600"
                              )} />
                            </Button>
                            
                            <span className={cn(
                              "flex-1 text-center font-black text-lg tabular-nums",
                              isInitial 
                                ? "text-blue-700 dark:text-blue-400" 
                                : hasQuantity 
                                  ? "text-orange-700 dark:text-orange-400" 
                                  : "text-muted-foreground/50"
                            )}>
                              {quantity}
                            </span>
                            
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 rounded-full hover:bg-white dark:hover:bg-slate-800" 
                              onClick={() => updateProductQuantity(product.id, quantity + 1)}
                            >
                              <Plus className={cn("h-5 w-5", isInitial ? "text-blue-600" : "text-orange-600")} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Seletor de Outros Produtos */}
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Outros Produtos</h4>
                  <Select onValueChange={(val) => updateProductQuantity(val, (selectedProductsToRequest[val] || 0) + 1)}>
                    <SelectTrigger className="h-14 rounded-2xl border-2 bg-muted/20 text-base font-bold transition-all focus:ring-orange-500">
                      <SelectValue placeholder="Adicionar outro produto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {productOptions
                        .filter(p => ![
                          'cloro-multiacao', 
                          'pastilha-cloro', 
                          'elevador-alcalinidade', 
                          'redutor-ph', 
                          'clarificante', 
                          'clarificante-gel', 
                          'algicida-manutencao',
                          'algicida-choque'
                        ].includes(p.id))
                        .map(p => (
                          <SelectItem key={p.id} value={p.id} className="font-medium h-12">
                            {p.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                {/* Lista de Outros Produtos Selecionados */}
                <div className="space-y-2">
                  {Object.entries(selectedProductsToRequest)
                    .filter(([id]) => ![
                      'cloro-multiacao', 
                      'pastilha-cloro', 
                      'elevador-alcalinidade', 
                      'redutor-ph', 
                      'clarificante', 
                      'clarificante-gel', 
                      'algicida-manutencao',
                      'algicida-choque'
                    ].includes(id))
                    .map(([id, quantity]) => {
                      const product = productOptions.find(p => p.id === id);
                      if (!product) return null;
                      const isInitial = initialProductRequestIds.has(id);
                      
                      return (
                        <div 
                          key={id} 
                          className={cn(
                            "flex items-center justify-between p-3 border-2 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200",
                            isInitial 
                              ? "border-blue-500/30 bg-blue-500/5 shadow-sm" 
                              : "border-orange-500/20 bg-orange-500/5"
                          )}
                        >
                          <div className="flex flex-col pl-2">
                            <span className={cn(
                              "text-sm font-black uppercase leading-tight",
                              isInitial ? "text-blue-900 dark:text-blue-400" : "text-orange-900 dark:text-orange-400"
                            )}>{product.name}</span>
                          </div>
                          <div className={cn(
                            "flex items-center gap-2 p-1 rounded-full border shadow-sm",
                            isInitial 
                              ? "bg-blue-100/50 dark:bg-black/20 border-blue-200/50" 
                              : "bg-white/50 dark:bg-black/20 border-orange-200/50"
                          )}>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateProductQuantity(id, Math.max(0, quantity - 1))}
                            >
                              <Minus className={cn("h-4 w-4", isInitial ? "text-blue-600" : "text-orange-600")} />
                            </Button>
                            <span className={cn(
                              "w-6 text-center font-bold text-sm",
                              isInitial ? "text-blue-700 dark:text-blue-400" : "text-orange-700 dark:text-orange-400"
                            )}>{quantity}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateProductQuantity(id, quantity + 1)}
                            >
                              <Plus className={cn("h-4 w-4", isInitial ? "text-blue-600" : "text-orange-600")} />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={handleBack} className="h-12"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
              <Button onClick={handleNext} className="flex-1 h-12">Avançar <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 5: Finalização */}
        {step === 5 && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300 border-none shadow-none">
            <CardHeader>
              <CardTitle>Passo 5/5: Finalizar Visita</CardTitle>
              <CardDescription>Revise e encerre o atendimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Captura de Foto da Piscina - Workers e Solos */}
              {(role === 'worker' || role === 'solo') && (
                <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h4 className="font-black text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
                    <Camera className="h-4 w-4" />
                    Foto da Piscina (Obrigatório)
                  </h4>
                  <PhotoCapture
                    onCapture={(blob, preview) => {
                      setPhotoBlob(blob);
                      setPhotoPreview(preview);
                    }}
                    onClear={() => {
                      setPhotoBlob(null);
                      setPhotoPreview(null);
                    }}
                    previewUrl={photoPreview}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="departureTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold uppercase tracking-tight">Horário de Saída</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="time" {...field} className="h-14 text-xl font-mono text-center" />
                      </FormControl>
                      <Button type="button" variant="secondary" className="h-14 px-6 font-bold" onClick={() => form.setValue('departureTime', getCurrentTime())}>AGORA</Button>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold uppercase tracking-tight">Observações Gerais</FormLabel>
                    <FormControl>
                      <textarea 
                        className="flex min-h-[120px] w-full rounded-xl border-2 bg-background px-4 py-3 text-base focus-visible:ring-primary" 
                        {...field} 
                        placeholder="Alguma observação sobre o estado da piscina ou do local?" 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-3 mt-4">
              <Button onClick={handleFinalize} disabled={isLoading} className="w-full h-16 bg-green-600 hover:bg-green-700 text-white text-lg font-bold shadow-lg shadow-green-200 dark:shadow-none">
                {isLoading ? 'Salvando...' : 'FINALIZAR E SALVAR'} <CheckCircle2 className="ml-2 h-6 w-6" />
              </Button>
              <Button variant="ghost" onClick={handleBack} className="w-full h-12 text-muted-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para revisão</Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 6: Sucesso */}
        {step === 6 && (
          <Card className="animate-in zoom-in-95 duration-300 border-none shadow-none bg-green-50 dark:bg-green-900/20">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-6">
              <div className="h-20 w-20 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-200" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-800 dark:text-green-100">Visita Registrada!</h2>
                <p className="text-green-600 dark:text-green-300">Os dados foram salvos com sucesso.</p>
              </div>
              {(role === 'owner' || role === 'solo') && (
                <Button onClick={handleSendReportWhatsApp} size="lg" className="w-full max-w-xs bg-green-600 hover:bg-green-700">
                  <Send className="mr-2 h-5 w-5" /> Enviar Relatório WhatsApp
                </Button>
              )}
              {onFinish && (
                <Button variant="ghost" onClick={onFinish} className="text-sm text-gray-500">
                  {(role === 'owner' || role === 'solo') ? 'Fechar sem enviar' : 'Fechar'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Form>
  );
}