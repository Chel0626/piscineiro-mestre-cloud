'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Visit {
  id: string;
  timestamp: any;
  ph?: number;
  cloro?: number;
  alcalinidade?: number;
  waterCondition?: string;
}

interface ChemicalAnalysisChartProps {
  visits: Visit[];
}

export function ChemicalAnalysisChart({ visits }: ChemicalAnalysisChartProps) {
  // Preparar dados para o gráfico
  // Pegar as últimas 10 visitas e inverter para ordem cronológica
  const chartData = visits
    .slice(0, 10)
    .reverse()
    .map(visit => {
      let dateStr = '';
      if (visit.timestamp) {
        if (typeof visit.timestamp.toDate === 'function') {
          dateStr = visit.timestamp.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        } else if (typeof visit.timestamp === 'string') {
          dateStr = new Date(visit.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }
      }

      return {
        date: dateStr,
        pH: visit.ph || null,
        Cloro: visit.cloro || null,
        Alcalinidade: visit.alcalinidade ? visit.alcalinidade / 10 : null, // Escala ajustada
      };
    });

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">Nenhum dado de análise disponível.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Análise Química</CardTitle>
        <CardDescription>Evolução dos parâmetros (Últimas visitas)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.2} />
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
              />
              <Legend />
              <Line type="linear" connectNulls dataKey="pH" stroke="#3b82f6" name="pH" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="linear" connectNulls dataKey="Cloro" stroke="#22c55e" name="Cloro (ppm)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="linear" connectNulls dataKey="Alcalinidade" stroke="#f59e0b" name="Alcalinidade (/10)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
