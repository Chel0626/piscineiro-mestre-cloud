'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClients } from '@/hooks/useClients';
import { AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type LowStockAlert = {
  clientId: string;
  clientName: string;
  productName: string;
  quantity: number;
  minQuantity: number;
};

export function LowStockNotificationWidget() {
  const { clients } = useClients();
  const { user, tenant } = useAuth();
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const lastLoadTimeRef = useRef<number>(0);
  const lastLoadDateRef = useRef<string>('');

  useEffect(() => {
    const fetchLowStock = async () => {
      if (!user || !tenant || clients.length === 0) return;

      const now = Date.now();
      const currentDate = new Date().toISOString().split('T')[0];
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
      
      // Verifica se mudou de dia
      const dayChanged = lastLoadDateRef.current !== currentDate;
      
      // Só recarrega se mudou de dia OU passou o tempo de cache
      if (!dayChanged && (now - lastLoadTimeRef.current < CACHE_DURATION)) {
        return; // Usa dados em cache
      }

      try {
        const { data: products, error } = await supabase
          .from('client_products')
          .select('client_id, name, quantity')
          .eq('tenant_id', tenant.id);

        if (error) {
          console.error('Erro ao buscar estoque:', error);
          return;
        }

        const alerts: LowStockAlert[] = [];
        
        products?.forEach(product => {
          const minQuantity = 5; // Default min quantity
          
          if (product.quantity <= minQuantity) {
            const client = clients.find(c => c.id === product.client_id);
            if (client) {
              alerts.push({
                clientId: client.id,
                clientName: client.name,
                productName: product.name,
                quantity: Number(product.quantity),
                minQuantity,
              });
            }
          }
        });

        setLowStockAlerts(alerts);
        lastLoadTimeRef.current = now;
        lastLoadDateRef.current = currentDate;
      } catch (error) {
        console.error('Erro ao processar estoque:', error);
      }
    };

    fetchLowStock();
  }, [clients, user, tenant]);

  if (lowStockAlerts.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-2 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <CardTitle className="text-base sm:text-lg text-orange-700 dark:text-orange-400">
            Produtos Acabando ({lowStockAlerts.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lowStockAlerts.slice(0, 5).map((alert, idx) => {
            const percentage = (alert.quantity / alert.minQuantity) * 100;
            return (
              <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-orange-200 dark:border-orange-800">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {alert.clientName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {alert.productName}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-2 py-1 rounded">
                    {alert.quantity} restante(s)
                  </span>
                </div>
                <Progress value={percentage} className="h-2 bg-gray-200 dark:bg-gray-700" />
              </div>
            );
          })}
          {lowStockAlerts.length > 5 && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              + {lowStockAlerts.length - 5} alertas adicionais
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
