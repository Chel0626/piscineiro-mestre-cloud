'use client';

import { useClients } from '@/hooks/useClients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ListChecks, CheckCircle, UserPlus, ChevronDown, ChevronUp, RefreshCw, Search, Plus, Wrench } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ClientFormData } from '@/lib/validators/clientSchema';
import { CheckoutModal } from '@/components/CheckoutModal';
import { ClienteAvulsoModal } from '@/components/ClienteAvulsoModal';
import { DayReschedule } from '@/components/DayReschedule';
import { useAppTemporaryReschedule } from '@/hooks/useAppTemporaryReschedule';
import { format, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const getCurrentDayName = () => {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[new Date().getDay()];
};

type DailyClient = ClientFormData & { 
  id: string;
  isRescheduled?: boolean;
  originalDay?: string;
  isTemporary?: boolean;
  isServiceAvulso?: boolean;
  serviceType?: string;
};

// Componente interno para item arrastável
function SortableClientCard({ 
  client, 
  isCompleted,
  isExpanded,
  onToggleExpand,
  onCheckout,
  onFinalize,
  isLoading,
  isDragEnabled,
  canReschedule
}: { 
  client: DailyClient;
  isCompleted: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCheckout: () => void;
  onFinalize: () => void;
  isLoading: boolean;
  isDragEnabled: boolean;
  canReschedule: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: client.id, disabled: !isDragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const today = getCurrentDayName();

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex flex-col rounded-lg transition-all overflow-hidden border ${
        isCompleted
          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
          : client.isServiceAvulso
          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
          : client.isTemporary
          ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
          : client.isRescheduled
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Cabeçalho clicável */}
      <div
        onClick={onCheckout}
        className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-white/50 dark:hover:bg-gray-700/30 active:bg-white/80 dark:active:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-sm shrink-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            ) : (
              <ChevronDown className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-semibold text-base text-gray-900 dark:text-gray-100">
                {client.name || `Cliente ${client.id}`}
              </p>
              {client.isServiceAvulso && (
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/50 rounded-full shrink-0">
                  <Wrench className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    {client.serviceType || 'Serviço Avulso'}
                  </span>
                </div>
              )}
              {client.isTemporary && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/50 rounded-full shrink-0">
                  <Plus className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    Temporário
                  </span>
                </div>
              )}
              {client.isRescheduled && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 rounded-full shrink-0">
                  <UserPlus className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Reagendado
                  </span>
                </div>
              )}
              {isCompleted && (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {client.neighborhood}
              {client.isTemporary && (
                <span className="ml-2 text-purple-600 dark:text-purple-400">
                  (roteiro temporário)
                </span>
              )}
              {client.isRescheduled && client.originalDay && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  (movido de {client.originalDay})
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div 
          {...attributes}
          {...listeners}
          className="flex flex-col gap-1 p-2 cursor-move hover:bg-gray-200 dark:hover:bg-gray-600/50 rounded shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="p-3 rounded bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-sm space-y-1">
            <div className="text-gray-700 dark:text-gray-300"><strong>Telefone:</strong> {client.phone || 'Não informado'}</div>
            <div className="text-gray-700 dark:text-gray-300"><strong>Endereço:</strong> {client.address || 'Não informado'}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                onCheckout();
              }}
              disabled={isLoading}
              className="flex-1 min-w-[140px] h-12 text-sm font-bold"
            >
              <ListChecks className="mr-2 h-5 w-5" />
              REGISTRAR VISITA
            </Button>

            {!client.isRescheduled && canReschedule && (
              <DayReschedule
                clientId={client.id}
                clientName={client.name}
                originalDay={today}
              />
            )}

            {!isCompleted && (
              <Button
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onFinalize();
                }}
                disabled={isLoading}
                className="flex-1 min-w-[140px] h-12 text-sm font-bold bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                CONCLUIR
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export function DailyRouteWidget() {
  const { clients, authLoading } = useClients();
  const { user, tenant, role } = useAuth();
  const { getClientsForDay, isClientMovedAway } = useAppTemporaryReschedule();

  const canReschedule = role === 'owner' || role === 'solo' || role === 'worker';
  
  const [visitedToday, setVisitedToday] = useState<Set<string>>(new Set());
  const [showAllPending, setShowAllPending] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [loadingClientId, setLoadingClientId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<string[]>([]);
  const isFirstLoad = useRef(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastLoadTimeRef = useRef<number>(0); 
  const lastLoadDateRef = useRef<string>(''); 
  
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  
  const [avulsoModalOpen, setAvulsoModalOpen] = useState(false);
  const [selectedAvulsoService, setSelectedAvulsoService] = useState<DailyClient | null>(null);
  
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [temporaryClients, setTemporaryClients] = useState<Set<string>>(new Set());
  const [scheduledServices, setScheduledServices] = useState<DailyClient[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const today = getCurrentDayName();

  useEffect(() => {
    const loadVisitedToday = async (forceReload = false) => {
      if (!user || !tenant || clients.length === 0) return;

      const now = Date.now();
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      const CACHE_DURATION = 5 * 60 * 1000; 
      
      const dayChanged = lastLoadDateRef.current !== currentDate;
      
      if (!forceReload && !dayChanged && (now - lastLoadTimeRef.current < CACHE_DURATION)) {
        return; 
      }

      const todayStart = startOfDay(new Date()).toISOString();
      const todayEnd = endOfDay(new Date()).toISOString();

      const visitedIds = new Set<string>();

      try {
        const { data: visits, error } = await supabase
          .from('visits')
          .select('client_id')
          .eq('tenant_id', tenant.id)
          .eq('user_id', user.id)
          .gte('date', todayStart)
          .lte('date', todayEnd);

        if (error) {
          console.error('Erro ao buscar visitas:', error);
        } else if (visits) {
          visits.forEach(v => visitedIds.add(v.client_id));
        }

        setVisitedToday(visitedIds);
        lastLoadTimeRef.current = now;
        lastLoadDateRef.current = currentDate;
      } catch (err) {
        console.error('Erro ao carregar visitas:', err);
      }
    };

    if (!authLoading && clients.length > 0) {
      loadVisitedToday();
    }
  }, [authLoading, clients, user, tenant]);

  useEffect(() => {
    if (!user || !tenant) return;
    
    const todayStart = startOfDay(new Date()).toISOString();
    const todayEnd = endOfDay(new Date()).toISOString();
    
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('ad_hoc_clients')
        .select('*')
        .eq('tenant_id', tenant.id)
        .gte('service_date', todayStart)
        .lte('service_date', todayEnd);

      if (error) {
        console.error("Erro ao buscar serviços avulsos:", error);
        return;
      }

      if (data) {
        const services = data.map(item => ({
          id: item.id,
          ...item,
          name: item.name || 'Cliente sem nome',
          address: item.address || '',
          phone: item.phone || '',
          neighborhood: '',
          isServiceAvulso: true,
          status: item.details?.status || 'scheduled',
          serviceType: item.service_type === 'technical' ? 'Técnico' : (item.service_type === 'cleaning' ? 'Limpeza' : 'Serviço Avulso')
        })) as unknown as DailyClient[];
        setScheduledServices(services);
        
        const completedAvulsoIds = data
          .filter(item => item.details?.status === 'completed')
          .map(item => item.id);
          
        if (completedAvulsoIds.length > 0) {
          setVisitedToday(prev => {
            const next = new Set(prev);
            completedAvulsoIds.forEach(id => next.add(id));
            return next;
          });
        }
      }
    };

    fetchServices();

    const subscription = supabase
      .channel('ad_hoc_clients_daily')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_hoc_clients', filter: `tenant_id=eq.${tenant.id}` }, () => {
        fetchServices();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, tenant]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    lastLoadTimeRef.current = 0; 
    
    if (user && tenant && clients.length > 0) {
      const visitedIds = new Set<string>();
      const todayStart = startOfDay(new Date()).toISOString();
      const todayEnd = endOfDay(new Date()).toISOString();

      try {
        const { data: visits, error } = await supabase
          .from('visits')
          .select('client_id')
          .eq('tenant_id', tenant.id)
          .eq('user_id', user.id)
          .gte('date', todayStart)
          .lte('date', todayEnd);

        if (error) {
          console.error('Erro ao buscar visitas:', error);
        } else if (visits) {
          visits.forEach(v => visitedIds.add(v.client_id));
        }

        const { data: avulsos } = await supabase
          .from('ad_hoc_clients')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('user_id', user.id)
          .eq('details->>status', 'completed')
          .gte('service_date', todayStart)
          .lte('service_date', todayEnd);
          
        if (avulsos) {
          avulsos.forEach(a => visitedIds.add(a.id));
        }

        setVisitedToday(visitedIds);
        lastLoadTimeRef.current = Date.now();
        lastLoadDateRef.current = format(new Date(), 'yyyy-MM-dd');
      } catch (err) {
        console.error('Erro ao carregar visitas:', err);
      }
    }
    
    setIsRefreshing(false);
  };

  useEffect(() => {
    const loadOrder = async () => {
      if (!user) return;

      const originalClients = clients.filter(client => {
        if (role === 'worker' && client.workerId !== user.id) {
          return false;
        }

        if (client.visitDays) {
          return client.visitDays.includes(getCurrentDayName());
        }
        const legacyClient = client as ClientFormData & { visitDay?: string };
        return legacyClient.visitDay === getCurrentDayName();
      }).filter(client => !isClientMovedAway(client.id, getCurrentDayName()));

      const rescheduledForToday = getClientsForDay(getCurrentDayName());
      const currentDayClientIds = [
        ...originalClients.map(c => c.id),
        ...rescheduledForToday.map(r => r.clientId),
        ...scheduledServices.map(s => s.id)
      ];

      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('daily_route_orders')
        .select('client_order, temporary_clients')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (data) {
        isFirstLoad.current = true;
        const savedOrder = (data.client_order as string[]) || [];
        const savedTemporary = (data.temporary_clients as string[]) || [];
        
        if (savedTemporary.length > 0) {
           setTemporaryClients(new Set(savedTemporary));
        }
        
        const validSavedOrder = savedOrder.filter(id => currentDayClientIds.includes(id) || savedTemporary.includes(id));
        
        const newClients = currentDayClientIds.filter(id => !savedOrder.includes(id));
        
        setItems([...validSavedOrder, ...newClients]);
      } else {
        isFirstLoad.current = false;
        setItems(currentDayClientIds);
      }
    };

    if (!authLoading && clients.length > 0) {
      loadOrder();
    }
  }, [authLoading, clients, getClientsForDay, isClientMovedAway, scheduledServices, user]);

  useEffect(() => {
    const saveOrder = async () => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        return;
      }

      if (!user || items.length === 0) return;

      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('daily_route_orders')
        .upsert({
          user_id: user.id,
          tenant_id: tenant?.id,
          date: today,
          client_order: items,
          temporary_clients: Array.from(temporaryClients),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, date' });
        
      if (error) {
        console.error('Erro ao salvar ordem:', error);
      }
    };

    if (items.length > 0) {
      saveOrder();
    }
  }, [items, temporaryClients, user]);

  const allDailyClients: DailyClient[] = (() => {
    const originalClients = clients.filter(client => {
      if (role === 'worker' && client.workerId !== user?.id) {
        return false;
      }

      if (client.visitDays) {
        return client.visitDays.includes(today);
      }
      const legacyClient = client as ClientFormData & { visitDay?: string };
      return legacyClient.visitDay === today;
    }).filter(client => !isClientMovedAway(client.id, today));

    const rescheduledForToday = getClientsForDay(today);
    const rescheduledClients: DailyClient[] = [];
    
    rescheduledForToday.forEach(reschedule => {
      const client = clients.find(c => c.id === reschedule.clientId);
      if (client) {
        rescheduledClients.push({ 
          ...client, 
          isRescheduled: true as const, 
          originalDay: reschedule.originalDay 
        });
      }
    });

    const temporaryClientsList: DailyClient[] = clients
      .filter(c => temporaryClients.has(c.id))
      .map(c => ({ ...c, isTemporary: true as const }));

    return [...originalClients, ...rescheduledClients, ...temporaryClientsList, ...scheduledServices];
  })();

  const handleAddTemporaryClient = (clientId: string) => {
    setTemporaryClients(prev => new Set([...prev, clientId]));
    setItems(prev => [...prev, clientId]); 
    setSearchQuery('');
    setShowSearchDialog(false);
    toast.success('Cliente adicionado ao roteiro temporário');
  };

  const availableClientsForSearch = clients.filter(client => {
    if (!client || !client.id) return false;
    const isInDailyRoute = allDailyClients.some(c => c && c.id === client.id);
    const isTemporary = temporaryClients.has(client.id);
    return !isInDailyRoute && !isTemporary;
  });

  const filteredClients = searchQuery.trim()
    ? availableClientsForSearch.filter(client =>
        client && (
          (client.name && client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (client.address && client.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (client.neighborhood && client.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      )
    : [];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((items) => {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleCheckout = (clientId: string) => {
    const client = allDailyClients.find(c => c.id === clientId);
    if (client?.isServiceAvulso) {
      setSelectedAvulsoService(client);
      setAvulsoModalOpen(true);
    } else {
      setSelectedClientId(clientId);
      setCheckoutModalOpen(true);
    }
  };

  const handleFinalize = async (clientId: string) => {
    console.log('🔥 Finalizando visita para cliente:', clientId);
    setLoadingClientId(clientId); 
    try {
      const isAvulso = scheduledServices.some(s => s.id === clientId);
      
      if (isAvulso) {
        const { data: currentService } = await supabase
            .from('ad_hoc_clients')
            .select('details')
            .eq('id', clientId)
            .single();
            
        const currentDetails = (currentService?.details as any) || {};
        
        await supabase.from('ad_hoc_clients').update({
            details: { ...currentDetails, status: 'completed' }
        }).eq('id', clientId);
      } else {
        await supabase.from('visits').insert({
            client_id: clientId,
            user_id: user?.id,
            tenant_id: tenant?.id,
            date: new Date().toISOString(),
            description: 'Finalização rápida'
        });
      }

      setVisitedToday(prev => new Set(prev).add(clientId));
      lastLoadTimeRef.current = 0; 
      
      toast.success('Visita finalizada com sucesso!');
    } catch (error) {
      console.error('Erro ao finalizar visita:', error);
      toast.error('Erro ao finalizar visita');
    } finally {
      setLoadingClientId(null); 
    }
  };

  const toggleClientExpansion = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  if (authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Roteiro do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Carregando clientes...</p>
        </CardContent>
      </Card>
    );
  }

  const orderedClients = items
    .map(id => allDailyClients.find(c => c && c.id === id))
    .filter((c): c is DailyClient => !!c);

  const pendingClients = orderedClients.filter(c => c && !visitedToday.has(c.id));
  const completedClients = orderedClients.filter(c => c && visitedToday.has(c.id));

  const displayedPendingClients = showAllPending ? pendingClients : pendingClients.slice(0, 3);
  const displayedCompletedClients = showAllCompleted ? completedClients : completedClients.slice(0, 3);

  return (
    <>
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-base sm:text-lg">Roteiro de Hoje ({today})</CardTitle>
              <CardDescription className="text-sm">
                {pendingClients.length > 0
                  ? `${pendingClients.length} pendente(s) • ${completedClients.length} concluído(s)`
                  : allDailyClients.length > 0 
                    ? 'Todas as visitas concluídas! 🎉'
                    : 'Sem visitas agendadas'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Ocultar' : 'Expandir'}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent>

            {canReschedule && (
              <div className="mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSearchDialog(true)}
                  className="w-full flex items-center justify-center gap-2 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Cliente Temporário
                </Button>
              </div>
            )}

            {pendingClients.length > 0 && (
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Pendentes</h4>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={displayedPendingClients.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="space-y-3">
                      {displayedPendingClients.map(client => (
                        <SortableClientCard
                          key={client.id}
                          client={client}
                          isCompleted={false}
                          isExpanded={expandedClients.has(client.id)}
                          onToggleExpand={() => toggleClientExpansion(client.id)}
                          onCheckout={() => handleCheckout(client.id)}
                          onFinalize={() => handleFinalize(client.id)}
                          isLoading={loadingClientId === client.id}
                          isDragEnabled={canReschedule}
                          canReschedule={canReschedule}
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
                {!showAllPending && pendingClients.length > 3 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowAllPending(true)}
                    className="w-full"
                  >
                    Mostrar todos ({pendingClients.length - 3} restantes)
                  </Button>
                )}
              </div>
            )}

            {completedClients.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Concluídos</h4>
                <ul className="space-y-3">
                  {displayedCompletedClients.map(client => (
                    <SortableClientCard
                      key={client.id}
                      client={client}
                      isCompleted={true}
                      isExpanded={expandedClients.has(client.id)}
                      onToggleExpand={() => toggleClientExpansion(client.id)}
                      onCheckout={() => handleCheckout(client.id)}
                      onFinalize={() => handleFinalize(client.id)}
                      isLoading={loadingClientId === client.id}
                      isDragEnabled={false}
                      canReschedule={false}
                    />
                  ))}
                </ul>
                {!showAllCompleted && completedClients.length > 3 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowAllCompleted(true)}
                    className="w-full"
                  >
                    Mostrar todos ({completedClients.length - 3} restantes)
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        clientId={selectedClientId}
        onSuccess={(photoUrl) => {
          if (selectedClientId) {
            console.log('✅ Checkout concluído com sucesso para:', selectedClientId);
            setVisitedToday(prev => {
              const next = new Set(prev);
              next.add(selectedClientId);
              return next;
            });
            lastLoadTimeRef.current = 0; 
          }
        }}
      />

      <ClienteAvulsoModal
        isOpen={avulsoModalOpen}
        onClose={() => {
          setAvulsoModalOpen(false);
          setSelectedAvulsoService(null);
        }}
        existingService={selectedAvulsoService}
      />

      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Cliente ao Roteiro Temporário</DialogTitle>
            <DialogDescription>
              Busque por um cliente para adicionar ao roteiro de hoje.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Digite o nome do cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {searchQuery.trim() && (
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {filteredClients.length > 0 ? (
                  filteredClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => handleAddTemporaryClient(client.id)}
                      className="w-full p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                    >
                      <p className="font-medium text-sm">{client.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {client.address} • {client.neighborhood}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">
                    Nenhum cliente encontrado
                  </p>
                )}
              </div>
            )}

            {!searchQuery.trim() && (
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">
                Digite para buscar clientes
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}