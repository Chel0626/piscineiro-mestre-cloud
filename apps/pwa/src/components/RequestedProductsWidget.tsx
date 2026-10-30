'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChevronDown, ChevronUp, CheckCircle, PackageSearch, User, Filter } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface RequestItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface ProductRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  products: any[]; // JSONB
  status: 'pending' | 'approved' | 'completed';
  providedBy: 'empresa' | 'cliente';
  visitDays: string[];
  createdAt: any;
}

const DAYS_OF_WEEK = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];

export function RequestedProductsWidget() {
  const { user, tenant, role } = useAuth();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [isUpdatingProvider, setIsUpdatingProvider] = useState(false);
  const [selectedRequestForProvider, setSelectedRequestForProvider] = useState<ProductRequest | null>(null);

  useEffect(() => {
    if (!user || !tenant) return;

    const fetchRequests = async () => {
        if (!tenant?.id || !user?.id) return;
        setLoading(true);
        
        try {
            // Buscamos os pedidos pendentes ou aprovados
            let query = supabase
                .from('product_requests')
                .select('*, clients(address, neighborhood, visit_days)') // Busca dados do cliente para o endereço e dias de visita
                .eq('tenant_id', tenant.id)
                .in('status', ['pending', 'approved']);

            // Se for funcionário, vê apenas suas próprias solicitações pendentes ou aprovadas
            if (role === 'worker') {
              query = query.eq('user_id', user.id);
            }
                
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) throw error;

            if (data) {
                console.log('📦 Produtos aprovados encontrados:', data);
                setRequests(data.map(d => ({
                    id: d.id,
                    clientId: d.client_id,
                    clientName: d.client_name,
                    // Prioriza o endereço salvo no pedido, senão pega do cadastro do cliente
                    clientAddress: d.client_address || 
                                  (d.clients ? `${d.clients.address}${d.clients.neighborhood ? ', ' + d.clients.neighborhood : ''}` : 'Endereço não informado'),
                    products: d.products || d.items || [],
                    status: d.status,
                    providedBy: d.provided_by || null as any, // Not set yet for some
                    visitDays: d.clients?.visit_days || [],
                    createdAt: d.created_at
                })));
            } else {
                setRequests([]);
            }
        } catch (err) {
            console.error('Erro ao buscar produtos para o widget:', err);
        } finally {
            setLoading(false);
        }
    };

    fetchRequests();

    const channel = supabase
        .channel(`product_requests_widget_${tenant.id}`)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'product_requests', 
            filter: `tenant_id=eq.${tenant.id}` 
        }, () => {
            console.log('🔄 Mudança detectada nos produtos, recarregando widget...');
            fetchRequests();
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [user, tenant]);

  const handleMarkAsDone = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('product_requests')
        .update({ status: 'completed' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      toast.success('Solicitação marcada como concluída!');
      // Atualização local imediata para melhor UX
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Erro ao concluir solicitação:', error);
      toast.error('Erro ao atualizar solicitação.');
    }
  };

  const handleUpdateProvider = async (requestId: string, provider: 'empresa' | 'cliente') => {
    setIsUpdatingProvider(true);
    try {
      // Se era pendente, aprovamos automaticamente ao escolher o provedor
      const isPending = requests.find(r => r.id === requestId)?.status === 'pending';
      const updateData: any = { provided_by: provider };
      
      if (isPending) {
        updateData.status = 'approved';
      }

      const { error } = await supabase
        .from('product_requests')
        .update(updateData)
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast.success(isPending ? 'Solicitação aprovada e definida!' : `Definido: ${provider === 'empresa' ? 'Piscineiro Leva' : 'Cliente providencia'}`);
      setSelectedRequestForProvider(null);
      // O fetch da subscription cuidará da atualização da lista, ou podemos atualizar localmente
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, providedBy: provider, status: isPending ? 'approved' : r.status } : r));
    } catch (error) {
      console.error('Erro ao atualizar provedor:', error);
      toast.error('Erro ao definir quem providenciará os produtos.');
    } finally {
      setIsUpdatingProvider(false);
    }
  };

  if (loading) return null;
  if (requests.length === 0) return null;

  // Filtrar por dia antes de ordenar
  const filteredByDay = selectedDay === 'all' 
    ? requests 
    : requests.filter(r => r.visitDays.includes(selectedDay));

  // Ordenar conforme solicitado pelo usuário:
  // 1. Piscineiro Leva (Blue)
  // 2. Pendentes (Yellow)
  // 3. Cliente Providencia (Amber/Other)
  const sortedRequests = [...filteredByDay].sort((a, b) => {
    const getCategoryRank = (req: ProductRequest) => {
      // Prioridade 1: Piscineiro Leva (Aprovado e Empresa)
      if (req.status === 'approved' && req.providedBy === 'empresa') return 1;
      // Prioridade 2: Pendentes (Status pending ou Aprovado sem definição)
      if (req.status === 'pending' || (req.status === 'approved' && !req.providedBy)) return 2;
      // Prioridade 3: Cliente (Aprovado e Cliente)
      if (req.status === 'approved' && req.providedBy === 'cliente') return 3;
      return 4;
    };
    return getCategoryRank(a) - getCategoryRank(b);
  });

  return (
    <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <ShoppingCart className="h-5 w-5" />
            Solicitações de Produtos ({requests.length})
          </CardTitle>
          <Button variant="ghost" size="sm">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-4 pt-1">
          {/* Filtro de Dias da Semana em Formato Select */}
          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 ml-2">
              <Filter className="h-4 w-4" />
              Dia
            </div>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-none h-9 w-[160px] sm:w-[200px] rounded-lg font-bold text-xs focus:ring-1 focus:ring-blue-500">
                <SelectValue placeholder="Selecione o dia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold h-10 text-xs">
                  Todos ({requests.length})
                </SelectItem>
                {DAYS_OF_WEEK.map(day => {
                  const count = requests.filter(r => r.visitDays.includes(day)).length;
                  if (count === 0) return null; // Esconde dias sem solicitações

                  return (
                    <SelectItem key={day} value={day} className="font-bold h-10 text-xs">
                      {day.split('-')[0]} ({count})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
            {sortedRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                Nenhuma solicitação para este dia.
              </div>
            ) : sortedRequests.map(request => {
              const isWorkerLeads = request.status === 'approved' && request.providedBy === 'empresa';
              const isPending = request.status === 'pending' || (request.status === 'approved' && !request.providedBy);

              return (
                <div 
                  key={request.id} 
                  className={cn(
                    "p-4 rounded-xl shadow-sm border transition-all",
                    isPending 
                      ? "bg-yellow-50/80 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/50 border-dashed"
                      : isWorkerLeads 
                        ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 ring-1 ring-blue-200/50" 
                        : "bg-green-50/80 dark:bg-green-950/10 border-green-200 dark:border-green-900/50"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {request.status === 'pending' ? (
                          <button 
                            onClick={() => setSelectedRequestForProvider(request)}
                            className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-yellow-200 text-yellow-800 dark:bg-yellow-800/40 dark:text-yellow-400 hover:bg-yellow-300 dark:hover:bg-yellow-700/60 flex items-center gap-1 animate-pulse border border-yellow-300 dark:border-yellow-700"
                          >
                             <PackageSearch className="h-3 w-3" /> Aprovar e Definir
                          </button>
                        ) : !request.providedBy ? (
                          <button 
                            onClick={() => setSelectedRequestForProvider(request)}
                            className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1 animate-pulse"
                          >
                             <PackageSearch className="h-3 w-3" /> Definir quem leva
                          </button>
                        ) : (
                          <button 
                             onClick={() => setSelectedRequestForProvider(request)}
                             className={cn(
                            "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border cursor-pointer",
                            isWorkerLeads
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-green-600 text-white border-green-600'
                          )}>
                            {request.providedBy === 'empresa' ? 'Piscineiro Leva' : 'Cliente providencia'}
                          </button>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">{request.clientName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{request.clientAddress}</p>
                    </div>
                    
                    <div className="flex flex-col gap-2 items-end">
                      <Button 
                        size="sm" 
                        disabled={isPending}
                        className={cn(
                          "whitespace-nowrap transition-all",
                          isPending 
                            ? "bg-slate-200 text-slate-400"
                            : isWorkerLeads
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-green-600 hover:bg-green-700'
                        )}
                        onClick={() => handleMarkAsDone(request.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Finalizar
                      </Button>
                    </div>
                  </div>
                  
                  {/* Lista de Produtos */}
                  <div className="space-y-1.5 mt-3">
                    {(request.products || []).map((item: any, idx: number) => {
                      const name = typeof item === 'object' ? item.name : item;
                      const qty = typeof item === 'object' ? item.quantity : null;
                      
                      return (
                        <div key={idx} className={cn(
                          "text-sm flex justify-between p-2 rounded-lg",
                          isPending 
                            ? "bg-yellow-100/30 dark:bg-yellow-900/30"
                            : isWorkerLeads ? 'bg-blue-100/40 dark:bg-blue-900/40' : 'bg-green-100/40 dark:bg-green-900/20'
                        )}>
                          <span className="font-medium text-slate-700 dark:text-slate-200">{name}</span>
                          {qty !== null && (
                            <span className={cn(
                              "font-black",
                              isPending
                                ? "text-yellow-700 dark:text-yellow-400"
                                : isWorkerLeads ? 'text-blue-700' : 'text-green-700'
                            )}>
                              {qty} un
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}

      {/* Modal de Seleção para Solo */}
      <Dialog 
        open={!!selectedRequestForProvider} 
        onOpenChange={(open) => !open && setSelectedRequestForProvider(null)}
      >
        <DialogContent className="sm:max-w-[400px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-black text-blue-700 dark:text-blue-400">
              QUEM PROVIDENCIA?
            </DialogTitle>
            <DialogDescription className="text-center">
              Defina quem levará os produtos para o cliente <strong>{selectedRequestForProvider?.clientName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-4">
            <Button
              className="h-20 flex flex-col items-center justify-center gap-1 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => selectedRequestForProvider && handleUpdateProvider(selectedRequestForProvider.id, 'empresa')}
              disabled={isUpdatingProvider}
            >
              <User className="h-6 w-6" />
              <div className="flex flex-col">
                <span className="font-black text-sm uppercase">Piscineiro Leva</span>
                <span className="text-[10px] font-medium opacity-80">(Eu levo e entrego)</span>
              </div>
            </Button>
            
            <Button
              className="h-20 flex flex-col items-center justify-center gap-1 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => selectedRequestForProvider && handleUpdateProvider(selectedRequestForProvider.id, 'cliente')}
              disabled={isUpdatingProvider}
            >
              <ShoppingCart className="h-6 w-6" />
              <div className="flex flex-col">
                <span className="font-black text-sm uppercase">Cliente providencia</span>
                <span className="text-[10px] font-medium opacity-80">(Cliente já tem ou comprou)</span>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}