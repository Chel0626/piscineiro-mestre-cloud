'use client';

import { useParams } from 'next/navigation';

import { useClientDetails } from '@/hooks/useClientDetails';
import { ClientDashboard } from '@/components/ClientDashboard';

export default function ClienteDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const { client, isLoading } = useClientDetails(clientId);  if (isLoading) {
    return <div className="text-center p-6 text-sm sm:text-base">Carregando dados do cliente...</div>;
  }

  if (!client) {
    return <div className="text-center p-6 text-sm sm:text-base">Cliente não encontrado.</div>;
  }

  // Dados para painel operacional
  const poolVolume = client.poolVolume || 0;
  const clientName = client.name;

  // Renderiza dashboard
  return (
    <div className="p-2 sm:p-4 space-y-6">
      <ClientDashboard client={{
        id: clientId,
        type: client.type, // Passando o tipo do cliente
        profile: {
          name: client.name,
          address: client.address,
          neighborhood: client.neighborhood,
          phone: client.phone || '',
          coordinates: undefined,
        },
        equipment: {
          filter_model: client.filterModel || '',
          sand_capacity_kg: client.filterSandKg || 0,
          pool_volume: client.poolVolume || 0,
          last_sand_change: client.lastSandChange || '',
          next_change_forecast: client.nextSandChange || '',
          maintenance_history: [],
        },
        financial: {
          current_value: client.serviceValue || 0,
          frequency: client.visitFrequency || 'weekly',
          visit_day: client.visitDays?.[0] || '',
          visit_days: client.visitDays || [],
          active_since: (client.reajusteHistory && client.reajusteHistory.length > 0) 
            ? client.reajusteHistory[client.reajusteHistory.length - 1].date 
            : (client.contractStartDate || ''),
          price_history: client.reajusteHistory?.map(h => ({
            date_start: h.date,
            value: h.newValue
          })) || [],
          reajusteHistory: client.reajusteHistory || [],
        },
      }} />
    </div>
  );
}