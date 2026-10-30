'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

interface Visit {
  id: string;
  timestamp: string;
  ph?: number;
  cloro?: number;
  alcalinidade?: number;
  waterCondition?: string;
}

interface ParametersChartProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ParametersChart({ clientId, isOpen, onClose }: ParametersChartProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && clientId) {
      loadVisits();
    }
  }, [isOpen, clientId]);

  const loadVisits = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_visits')
        .select('id, date, ph, chlorine, alkalinity')
        .eq('client_id', clientId)
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedVisits = data.map((v: any) => ({
          id: v.id,
          timestamp: v.date,
          ph: v.ph,
          cloro: v.chlorine,
          alcalinidade: v.alkalinity,
        }));
        // Inverter para mostrar do mais antigo para o mais recente no gráfico
        setVisits(mappedVisits.reverse());
      }
    } catch (error) {
      console.error('Erro ao carregar visitas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = visits.map(visit => ({
    date: visit.timestamp ? new Date(visit.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '',
    pH: visit.ph || null,
    Cloro: visit.cloro || null,
    Alcalinidade: visit.alcalinidade ? visit.alcalinidade / 10 : null, // Dividir por 10 para escala visual
  })).filter(item => item.pH !== null || item.Cloro !== null || item.Alcalinidade !== null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gráfico de Evolução dos Parâmetros</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-gray-500 dark:text-gray-400">Carregando dados...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-gray-500 dark:text-gray-400">Nenhum registro de visita encontrado.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Gráfico de pH */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">pH</CardTitle>
                <CardDescription>Ideal: 7.2 - 7.6</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.2} />
                      <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis domain={[6.5, 8.5]} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                          borderRadius: '8px', 
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pH" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Cloro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cloro</CardTitle>
                <CardDescription>Ideal: 1.0 - 3.0 ppm</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.2} />
                      <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 5]} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                          borderRadius: '8px', 
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Cloro" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Alcalinidade */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alcalinidade (x10)</CardTitle>
                <CardDescription>Ideal: 80 - 120 ppm</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.2} />
                      <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 20]} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                          borderRadius: '8px', 
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Alcalinidade" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={{ fill: '#f59e0b', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
