'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Route } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface RouteStats {
  totalClients: number;
  completedClients: number;
  pendingClients: number;
  workersWithClients: number;
}

export function DailyRouteWidget() {
  const router = useRouter();
  const { tenant } = useAuth();
  const [stats, setStats] = useState<RouteStats>({ totalClients: 0, completedClients: 0, pendingClients: 0, workersWithClients: 0 });
  const [loading, setLoading] = useState(true);
  const [todayName, setTodayName] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      if (!tenant) return;
      
      try {
        const today = new Date();
        const dayIndex = today.getDay();
        
        const daysOfWeekPT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const daysOfWeekEN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const daysOfWeekShortPT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
        const daysOfWeekShortEN = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        
        const dayNamePT = daysOfWeekPT[dayIndex];
        setTodayName(dayNamePT);
        
        const todayVariants = [
          dayNamePT, daysOfWeekEN[dayIndex], daysOfWeekShortPT[dayIndex], daysOfWeekShortEN[dayIndex],
          dayNamePT.toLowerCase(), daysOfWeekEN[dayIndex].charAt(0).toUpperCase() + daysOfWeekEN[dayIndex].slice(1),
        ];
        
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        // Buscar workers
        const { data: members } = await supabase
          .from('tenant_members')
          .select('user_id')
          .eq('tenant_id', tenant.id)
          .eq('role', 'worker');

        const workerIds = members?.map(m => m.user_id) || [];

        // Buscar clientes
        const { data: clients } = await supabase
          .from('clients')
          .select('id, worker_id, visit_days, visit_day')
          .eq('tenant_id', tenant.id);

        const isDayToday = (day: string | null | undefined): boolean => {
          if (!day) return false;
          return todayVariants.some(v => day.toLowerCase().trim() === v.toLowerCase());
        };

        const todaysClients = clients?.filter(client => {
          if (Array.isArray(client.visit_days) && client.visit_days.length > 0) {
            return client.visit_days.some(isDayToday);
          }
          return client.visit_day ? isDayToday(client.visit_day) : false;
        }) || [];

        // Buscar visitas de hoje
        const { data: visits } = await supabase
          .from('visits')
          .select('client_id')
          .eq('tenant_id', tenant.id)
          .gte('date', startOfDay.toISOString())
          .lte('date', endOfDay.toISOString());

        const completedClientIds = new Set(visits?.map(v => v.client_id));
        const completedCount = todaysClients.filter(c => completedClientIds.has(c.id)).length;

        // Contar workers com clientes hoje
        const workersWithClientsSet = new Set(
          todaysClients
            .filter(c => c.worker_id && workerIds.includes(c.worker_id))
            .map(c => c.worker_id)
        );

        setStats({
          totalClients: todaysClients.length,
          completedClients: completedCount,
          pendingClients: todaysClients.length - completedCount,
          workersWithClients: workersWithClientsSet.size
        });

      } catch (error) {
        console.error("Error fetching route stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [tenant]);

  // Dados do gráfico Donut
  const donutData = [
    { name: 'Pendentes', value: stats.pendingClients, color: '#ef4444' }, // Vermelho
    { name: 'Concluídas', value: stats.completedClients, color: '#22c55e' } // Verde
  ].filter(item => item.value > 0);

  if (loading) {
    return <div className="animate-pulse h-[140px] bg-muted rounded-xl"></div>;
  }

  return (
    <Card 
      className="group overflow-visible flex flex-col justify-between relative shadow-sm hover:shadow-md transition-all cursor-pointer h-full"
      onClick={() => router.push('/routes')}
    >
      <div className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 group-hover:text-blue-500 transition-colors z-10">
        <Route className="h-5 w-5" />
      </div>

      <div className="p-5 flex-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col justify-between">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            
            {/* Gráfico Donut */}
            <div className="h-[64px] w-[64px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData.length > 0 ? donutData : [{ value: 1, color: '#e2e8f0' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={32}
                    paddingAngle={0}
                    dataKey="value"
                    startAngle={90} 
                    endAngle={-270} 
                    stroke="none"
                  >
                    {donutData.length > 0 ? (
                      donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))
                    ) : (
                      <Cell fill="#e2e8f0" /> 
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Títulos e Valores */}
            <div>
              <div className="text-sm text-slate-500 font-medium mb-1">
                Roteiros ({todayName})
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-baseline gap-1">
                {stats.totalClients} <span className="text-sm font-normal text-slate-500">piscinas</span>
              </div>
            </div>

          </div>
        </div>

        {/* Rodapé: Legenda com Quantidades Absolutas */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[13px] font-medium text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
              {/* Quantidade em vez de porcentagem */}
              <span>Concluídas ({stats.completedClients})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              {/* Quantidade em vez de porcentagem */}
              <span>Pendentes ({stats.pendingClients})</span>
            </div>
          </div>
          
          {stats.workersWithClients > 0 && (
            <div className="text-xs text-slate-400 font-normal">
              {stats.workersWithClients} téc. em rota
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}