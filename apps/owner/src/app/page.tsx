'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2, ClipboardList, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { TeamList } from "@/components/TeamList";
import { useBilling } from "@/hooks/useBilling";
import { useClients } from "@/hooks/useClients";
import { usePayments } from "@/hooks/usePayments";
import { PaymentNotifications } from "@/components/PaymentNotifications";
import { DailyRouteWidget } from "@/components/DailyRouteWidget";
import { ProductRequestsWidget } from "@/components/ProductRequestsWidget";
import { Header } from "@/components/Header";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const { user, authLoading, role } = useAuth();
  const router = useRouter();
  const { clients } = useClients();
  const { getPaymentStatus } = usePayments();
  
  const [isRevenueExpanded, setIsRevenueExpanded] = useState(false);

  const { 
    totalMensal, 
    clientesAtivos, 
  } = useBilling();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (role === 'solo') {
        const pwaUrl = process.env.NEXT_PUBLIC_PWA_URL || 'http://localhost:3001';
        window.location.href = pwaUrl;
      }
    }
  }, [user, authLoading, role, router]);

  // Cálculos financeiros em tempo real para o Donut
  const activeClients = clients.filter(client => (client as any).active);
  
  const totalVencido = activeClients
    .filter(c => getPaymentStatus(c) === 'overdue')
    .reduce((acc, c) => acc + (Number((c as any).serviceValue) || Number((c as any).service_value) || 0), 0);

  const totalPendente = activeClients
    .filter(c => getPaymentStatus(c) === 'pending' || getPaymentStatus(c) === 'due_today')
    .reduce((acc, c) => acc + (Number((c as any).serviceValue) || Number((c as any).service_value) || 0), 0);

  const totalPago = activeClients
    .filter(c => getPaymentStatus(c) === 'paid')
    .reduce((acc, c) => acc + (Number((c as any).serviceValue) || Number((c as any).service_value) || 0), 0);

  const totalGeral = totalVencido + totalPendente + totalPago;
  const percVencido = totalGeral > 0 ? Math.round((totalVencido / totalGeral) * 100) : 0;
  const percPendente = totalGeral > 0 ? Math.round((totalPendente / totalGeral) * 100) : 0;
  const percPago = totalGeral > 0 ? Math.round((totalPago / totalGeral) * 100) : 0;

  const donutData = [
    { name: 'Vencido', value: totalVencido, color: '#ef4444' },    
    { name: 'Pendente', value: totalPendente, color: '#f59e0b' },  
    { name: 'Pago', value: totalPago, color: '#65a30d' }           
  ].filter(item => item.value > 0); 

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || role === 'solo') {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 p-3 sm:p-6 space-y-6 container mx-auto max-w-7xl">
        
        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* Card 1: Total de Clientes */}
          <Card 
            className="cursor-pointer hover:bg-muted/50 hover:shadow-md transition-all group"
            onClick={() => router.push('/clients')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientesAtivos}</div>
              <p className="text-xs text-muted-foreground">Ativos na base</p>
            </CardContent>
          </Card>

          {/* Card 2: Receita Mensal */}
          <Card className="group overflow-visible flex flex-col justify-between relative shadow-sm hover:shadow-md transition-all">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRevenueExpanded(!isRevenueExpanded);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
              title="Ver detalhes de cobrança"
            >
              {isRevenueExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            <div 
              className="p-5 flex-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col justify-between"
              onClick={() => router.push('/revenue')}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
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

                  <div>
                    <div className="text-sm text-slate-500 font-medium mb-1">
                      Receita mensal (recorrente)
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(totalMensal)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[13px] font-medium text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#65a30d]" />
                  <span>Pago ({percPago}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                  <span>Pendente ({percPendente}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                  <span>Vencido ({percVencido}%)</span>
                </div>
              </div>
            </div>

            {isRevenueExpanded && (
              <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 p-4 animate-in slide-in-from-top-2 duration-200">
                <PaymentNotifications />
              </div>
            )}
          </Card>

          {/* Card 3: O seu DailyRouteWidget entra aqui perfeitamente */}
          <DailyRouteWidget />

        </div>

        {/* Action Cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          
          <Card 
            onClick={() => router.push('/reports')} 
            className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50 cursor-pointer hover:shadow-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all group"
          >
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 h-full">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-semibold text-blue-900 dark:text-blue-400 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-blue-700 dark:text-blue-300" />
                  Relatórios do Dia
                </h3>
                <p className="text-sm sm:text-base text-blue-700 dark:text-blue-400/80">
                  Acompanhe e aprove os relatórios de visita enviados pelos técnicos.
                </p>
              </div>
              <div className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm flex justify-center items-center gap-2 group-hover:bg-blue-700 transition-colors">
                Acessar <ChevronRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          {/* O novo card de produtos, já importado e renderizando */}
          <ProductRequestsWidget />

        </div>

        {/* Equipe - Agora ocupando o bloco de forma limpa */}
        <div className="w-full overflow-hidden">
          <TeamList />
        </div>
        
      </main>
    </div>
  );
}