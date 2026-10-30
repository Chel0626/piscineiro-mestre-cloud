'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, MapPin, RefreshCw, ArrowLeft, Route } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";

interface Worker {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface Client {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  worker_id: string | null;
}

interface WorkerRoute {
  worker: Worker;
  clients: {
    client: Client;
    status: 'pending' | 'completed';
  }[];
}

export default function RoutesPage() {
  const router = useRouter();
  const { user, tenant, authLoading } = useAuth();
  const [routes, setRoutes] = useState<WorkerRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayName, setTodayName] = useState('');

  const fetchData = async () => {
    if (!tenant) return;
    
    try {
      const today = new Date();
      const dayIndex = today.getDay();
      
      // Nomes do dia em português
      const daysOfWeekPT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      const daysOfWeekEN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const daysOfWeekShortPT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
      const daysOfWeekShortEN = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      
      const dayNamePT = daysOfWeekPT[dayIndex];
      const dayNameEN = daysOfWeekEN[dayIndex];
      const dayNameShortPT = daysOfWeekShortPT[dayIndex];
      const dayNameShortEN = daysOfWeekShortEN[dayIndex];
      
      setTodayName(dayNamePT);
      
      const todayVariants = [
        dayNamePT, dayNameEN, dayNameShortPT, dayNameShortEN,
        dayNamePT.toLowerCase(),
        dayNameEN.charAt(0).toUpperCase() + dayNameEN.slice(1),
      ];
      
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Buscar membros do tenant
      const { data: members } = await supabase
        .from('tenant_members')
        .select('user_id, role')
        .eq('tenant_id', tenant.id)
        .in('role', ['worker', 'owner', 'solo']);

      console.log('[Routes] Members:', members);

      const allMemberIds = members?.map(m => m.user_id) || [];
      const workerMembers = members?.filter(m => m.role === 'worker') || [];
      const workerIds = workerMembers.map(m => m.user_id);
      
      console.log('[Routes] Worker IDs:', workerIds);

      // Buscar perfis de TODOS os membros (não apenas workers)
      // Para pegar o nome mesmo de workers que não estejam na lista
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', allMemberIds.length > 0 ? allMemberIds : ['00000000-0000-0000-0000-000000000000']);

      console.log('[Routes] Profiles:', profiles);

      // Mapear TODOS os workers para poder mostrar o nome deles
      const workersMap = new Map<string, Worker>();
      profiles?.forEach(p => {
        // Inclui todos os workers no mapa
        if (workerIds.includes(p.id)) {
          workersMap.set(p.id, {
            id: p.id,
            name: p.name || 'Sem Nome'
          });
        }
      });

      // Buscar clientes
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, address, neighborhood, worker_id, visit_days, visit_day')
        .eq('tenant_id', tenant.id);

      const isDayToday = (day: string | null | undefined): boolean => {
        if (!day) return false;
        const dayLower = day.toLowerCase().trim();
        return todayVariants.some(variant => dayLower === variant.toLowerCase());
      };

      const todaysClients = clients?.filter(client => {
        if (Array.isArray(client.visit_days) && client.visit_days.length > 0) {
          return client.visit_days.some(isDayToday);
        }
        if (client.visit_day) {
          return isDayToday(client.visit_day);
        }
        return false;
      }) || [];

      console.log('[Routes] Todays clients:', todaysClients.map(c => ({ 
        name: c.name, 
        worker_id: c.worker_id 
      })));

      // Verificar se há worker_ids em clientes que não estão no mapa
      const missingWorkerIds = todaysClients
        .filter(c => c.worker_id && !workersMap.has(c.worker_id))
        .map(c => c.worker_id)
        .filter((id, index, arr) => arr.indexOf(id) === index); // unique

      console.log('[Routes] Missing worker IDs:', missingWorkerIds);

      // Buscar perfis dos workers que faltam
      if (missingWorkerIds.length > 0) {
        const { data: missingProfiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', missingWorkerIds);

        console.log('[Routes] Missing profiles found:', missingProfiles);

        missingProfiles?.forEach(p => {
          workersMap.set(p.id, {
            id: p.id,
            name: p.name || 'Técnico'
          });
        });
      }

      // Buscar visitas de hoje
      const { data: visits } = await supabase
        .from('visits')
        .select('client_id, user_id')
        .eq('tenant_id', tenant.id)
        .gte('date', startOfDay.toISOString())
        .lte('date', endOfDay.toISOString());

      const completedClientIds = new Set(visits?.map(v => v.client_id));
      
      // Criar mapa de quem completou a visita: clientId -> userId
      const completedByMap = new Map<string, string>();
      visits?.forEach(v => {
        if (v.user_id) {
          completedByMap.set(v.client_id, v.user_id);
        }
      });

      // Agrupar por worker
      const routesMap = new Map<string, WorkerRoute>();

      workersMap.forEach(worker => {
        routesMap.set(worker.id, { worker, clients: [] });
      });

      const unassignedWorker: Worker = { id: 'unassigned', name: 'Sem Técnico Atribuído' };
      
      todaysClients.forEach(client => {
        // Lógica de Atribuição Inteligente:
        // 1. Se a visita foi completada, atribuir ao worker que FEZ a visita (visão real)
        // 2. Se não, atribuir ao worker agendado (visão planejada)
        let workerId = client.worker_id || 'unassigned';
        
        if (completedClientIds.has(client.id) && completedByMap.has(client.id)) {
          const completerId = completedByMap.get(client.id);
          // Só substitui se tivermos o ID de quem completou
          if (completerId) {
            workerId = completerId;
          }
        }
        
        if (workerId === 'unassigned' && !routesMap.has('unassigned')) {
          routesMap.set('unassigned', { worker: unassignedWorker, clients: [] });
        }

        const route = routesMap.get(workerId);
        if (route) {
          route.clients.push({
            client,
            status: completedClientIds.has(client.id) ? 'completed' : 'pending'
          });
        } else {
          // Worker existe mas não está no mapa - criar entrada para ele
          const workerProfile = workersMap.get(workerId);
          if (workerProfile) {
            routesMap.set(workerId, { worker: workerProfile, clients: [] });
            routesMap.get(workerId)!.clients.push({
              client,
              status: completedClientIds.has(client.id) ? 'completed' : 'pending'
            });
          } else {
            // Realmente não encontrou (pode ser um worker deletado ou erro) - tenta buscar no mapa global ou cria temp
            // Se o workerId veio da visita completada, mas não temos o perfil carregado ainda,
            // (Isso aconteceria se o user não estivesse na lista inicial de profiles)
            // O código abaixo de 'missing profiles' não pega visitas, só clients.worker_id.
            // Mas vamos fallback para 'unassigned' ou tentar exibir o ID se necessário.
            
            // Tentar adicionar dinamicamente se não existir
             if (!routesMap.has(workerId)) {
                // Se for um workerId válido que não estava no mapa inicial
                // Criar entrada temporária (o nome pode ficar genérico até recarregar)
                routesMap.set(workerId, { 
                  worker: { id: workerId, name: 'Técnico (Carregando...)' }, 
                  clients: [] 
                });
             }
             
             routesMap.get(workerId)!.clients.push({
              client,
              status: completedClientIds.has(client.id) ? 'completed' : 'pending'
            });
          }
        }
      });

      const routesArray = Array.from(routesMap.values())
        .filter(r => r.clients.length > 0)
        .sort((a, b) => {
          if (a.worker.id === 'unassigned') return 1;
          if (b.worker.id === 'unassigned') return -1;
          return a.worker.name.localeCompare(b.worker.name);
        });

      setRoutes(routesArray);

    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    loadData();
  }, [tenant]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Calcular estatísticas
  const totalClients = routes.reduce((acc, r) => acc + r.clients.length, 0);
  const completedClients = routes.reduce((acc, r) => acc + r.clients.filter(c => c.status === 'completed').length, 0);
  const pendingClients = totalClients - completedClients;

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 p-4 sm:p-6 container mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 container mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Roteiros do Dia</h1>
              <p className="text-sm text-muted-foreground">{todayName}, {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Route className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalClients}</p>
                <p className="text-xs text-muted-foreground">Total de Visitas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{completedClients}</p>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{pendingClients}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Routes */}
        {routes.length === 0 ? (
          <Card className="bg-background">
            <CardContent className="p-12 text-center">
              <Route className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">Nenhum roteiro para hoje</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Não há clientes agendados para {todayName.toLowerCase()}.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {routes.map((route) => {
              const completedCount = route.clients.filter(c => c.status === 'completed').length;
              const progress = route.clients.length > 0 ? (completedCount / route.clients.length) * 100 : 0;
              
              return (
                <Card key={route.worker.id} className="overflow-hidden border-border shadow-sm">
                  <CardHeader className="bg-background border-b border-border pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                          <AvatarImage src={route.worker.avatarUrl} />
                          <AvatarFallback className={route.worker.id === 'unassigned' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}>
                            {route.worker.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            {route.worker.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {completedCount}/{route.clients.length} visitas concluídas
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-foreground">{Math.round(progress)}%</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                    <div className="divide-y divide-border">
                      {route.clients.map(({ client, status }) => (
                        <div key={client.id} className="p-4 flex items-center justify-between hover:bg-background transition-colors">
                          <div className="flex items-start gap-3 overflow-hidden">
                            <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${status === 'completed' ? 'bg-green-500' : 'bg-slate-300'}`} />
                            <div className="min-w-0">
                              <p className={`text-sm font-medium truncate ${status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                {client.name}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                                <MapPin className="h-3 w-3" />
                                {client.address ? `${client.address}, ${client.neighborhood || ''}` : client.neighborhood || 'Sem endereço'}
                              </div>
                            </div>
                          </div>
                          
                          <Badge 
                            variant={status === 'completed' ? 'default' : 'outline'}
                            className={status === 'completed' 
                              ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none' 
                              : 'text-muted-foreground border-border dark:border-slate-800 bg-card'
                            }
                          >
                            {status === 'completed' ? (
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Concluído</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Pendente</span>
                              </div>
                            )}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
