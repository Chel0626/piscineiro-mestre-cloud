'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';

interface WorkerStats {
  id: string;
  name: string;
  totalClients: number;
  revenue: number;
}

interface UnderpaidClient {
  id: string;
  name: string;
  service_value: number;
  worker_name: string;
}

export default function RevenuePage() {
  const { tenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [minimumValue, setMinimumValue] = useState(150);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [workerStats, setWorkerStats] = useState<WorkerStats[]>([]);
  const [underpaidClients, setUnderpaidClients] = useState<UnderpaidClient[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalClients, setTotalClients] = useState(0);

  useEffect(() => {
    async function fetchData() {
      if (!tenant?.id) {
        console.log('Tenant ID não encontrado');
        return;
      }

      try {
        setLoading(true);
        console.log('Iniciando fetch com tenant_id:', tenant.id);
        
        // Buscar todos os clientes do tenant
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, name, service_value, worker_id')
          .eq('tenant_id', tenant.id);

        if (clientsError) {
          console.error('Erro ao buscar clientes:', clientsError);
          throw clientsError;
        }
        console.log('Clientes carregados:', clientsData?.length);

        // Buscar todos os perfis (trabalhadores)
        // Removido filtro de tenant_id e role pois essas colunas não existem na tabela profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name');

        if (profilesError) {
          console.error('Erro ao buscar perfis:', profilesError);
          throw profilesError;
        }
        console.log('Perfis carregados:', profilesData?.length);

        const clients = clientsData || [];
        const workers = profilesData || [];

        // Calcular estatísticas
        const statsMap = new Map<string, WorkerStats>();
        let total = 0;

        // Inicializar mapa de workers
        workers.forEach(w => {
          statsMap.set(w.id, {
            id: w.id,
            name: w.name,
            totalClients: 0,
            revenue: 0
          });
        });

        clients.forEach(client => {
          const value = client.service_value || 0;
          total += value;

          if (client.worker_id && statsMap.has(client.worker_id)) {
            const s = statsMap.get(client.worker_id)!;
            s.totalClients++;
            s.revenue += value;
          }
        });

        setTotalRevenue(total);
        setTotalClients(clients.length);
        setWorkerStats(Array.from(statsMap.values()).filter(s => s.totalClients > 0));
        setAllClients(clients);
        setAllProfiles(workers);
        
        // Filtrar underpaid com o valor inicial
        const underpaidInitial = clients.filter(c => (c.service_value || 0) < minimumValue).map(client => ({
          id: client.id,
          name: client.name,
          service_value: client.service_value,
          worker_name: workers.find(w => w.id === client.worker_id)?.name || 'Não atribuído'
        }));
        setUnderpaidClients(underpaidInitial.sort((a, b) => a.service_value - b.service_value));

      } catch (error) {
        console.error('Erro ao buscar dados financeiros:', error);
        if (error instanceof Error) {
          console.error('Detalhes do erro:', error.message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [tenant?.id]);

  // Recalcular clientes underpaid quando o valor mínimo muda
  useEffect(() => {
    if (allClients.length === 0) return;

    const filtered = allClients
      .filter(client => (client.service_value || 0) < minimumValue)
      .map(client => ({
        id: client.id,
        name: client.name,
        service_value: client.service_value,
        worker_name: allProfiles.find(w => w.id === client.worker_id)?.name || 'Não atribuído'
      }))
      .sort((a, b) => a.service_value - b.service_value);

    setUnderpaidClients(filtered);
  }, [minimumValue, allClients, allProfiles]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="p-4 flex items-center justify-center h-[calc(100-64px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Receita Mensal Detalhada</h1>
          <p className="text-gray-500 text-sm">Análise de faturamento por colaborador e precificação</p>
        </header>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Média por Cliente</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalClients > 0 ? totalRevenue / totalClients : 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receita por Colaborador */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                Por Colaborador
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {workerStats.map(stat => (
                <div key={stat.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{stat.name}</span>
                    <span className="font-bold text-blue-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stat.revenue)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${(stat.revenue / totalRevenue) * 100}%` }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-500 text-[11px]">Clientes</p>
                      <p className="font-semibold text-gray-900">{stat.totalClients}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-500 text-[11px]">Média/Cliente</p>
                      <p className="font-semibold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stat.revenue / stat.totalClients)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-500 text-[11px]">% Total</p>
                      <p className="font-semibold text-gray-900">{Math.round((stat.revenue / totalRevenue) * 100)}%</p>
                    </div>
                  </div>
                </div>
              ))}
              {workerStats.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Nenhum dado por colaborador disponível.
                </div>
              )}
            </div>
          </div>

          {/* Clientes com Valores Baixos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Alertas de Precificação
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Valor desejável mínimo:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minimumValue}
                    onChange={(e) => setMinimumValue(Number(e.target.value))}
                    className="w-24 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    min="0"
                    step="10"
                  />
                  <span className="text-sm text-gray-500">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(minimumValue)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Mostrando {underpaidClients.length} cliente(s) abaixo de R$ {new Intl.NumberFormat('pt-BR').format(minimumValue)}
              </p>
            </div>
            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
              {underpaidClients.map(client => (
                <div key={client.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{client.name}</h3>
                    <p className="text-xs text-gray-500">Responsável: {client.worker_name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.service_value)}
                    </span>
                    <button className="block text-[10px] text-blue-600 hover:underline mt-1 font-medium">
                      Ajustar Valor
                    </button>
                  </div>
                </div>
              ))}
              {underpaidClients.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Todos os clientes estão com preços acima do limite de alerta.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
