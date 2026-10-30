import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useClientDetails } from '@/hooks/useClientDetails';
import { ClientProfileForm } from './ClientProfileForm';
import { EquipmentCard } from './EquipmentCard';
import { FinancialCard } from './FinancialCard';
import { RegisterMaintenanceModal } from './RegisterMaintenanceModal';
import { AdjustContractModal } from './AdjustContractModal';
import { ParametersChart } from './ParametersChart';
import { VisitHistoryCard } from './VisitHistoryCard';
import { HydraulicRepairHistoryCard } from './HydraulicRepairHistoryCard';
import { RoleGuard } from './RoleGuard';

// Tipos baseados no JSON sugerido
export type ClientProfile = {
  name: string;
  address: string;
  neighborhood?: string;
  phone: string;
  coordinates?: { lat: number; lng: number };
};

export type MaintenanceEvent = {
  date: string;
  type: 'sand_change' | 'crepina_change' | 'valve_maintenance';
  notes?: string;
};

export type Equipment = {
  filter_model: string;
  sand_capacity_kg: number;
  pool_volume: number;
  last_sand_change: string;
  next_change_forecast: string;
  maintenance_history: MaintenanceEvent[];
};

export type PriceHistory = {
  date_start: string;
  date_end?: string;
  value: number;
};

export type Financial = {
  current_value: number;
  frequency: 'weekly' | 'biweekly';
  visit_day: string;
  visit_days?: string[]; // Adicionado suporte a múltiplos dias
  active_since: string;
  price_history: PriceHistory[];
  reajusteHistory?: any[];
};

export type ClientData = {
  id: string;
  type?: 'ad-hoc' | 'monthly' | string; // Adicionado tipo do cliente
  profile: ClientProfile;
  equipment: Equipment;
  financial: Financial;
};

// Componente principal do dashboard do cliente

export const ClientDashboard: React.FC<{ client: ClientData }> = ({ client }) => {
  // Estados para modais e edição
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [clientData, setClientData] = useState<ClientData>(client);

  // Sincronizar estado interno quando o prop mudar
  React.useEffect(() => {
    setClientData(client);
  }, [client]);

  // Dados dinâmicos do Firestore (apenas para visitas agora, já que o cliente vem via prop)
  const { visits, isLoading } = useClientDetails(client.id);
  
  const isAdHoc = clientData.type === 'ad-hoc';

  // Atualização do perfil
  async function handleSaveProfile(newProfile: ClientProfile) {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
            name: newProfile.name,
            address: newProfile.address,
            neighborhood: newProfile.neighborhood,
            phone: newProfile.phone
        })
        .eq('id', client.id);

      if (error) throw error;
      
      setClientData(prev => ({ ...prev, profile: newProfile }));
      setShowEditProfile(false);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao salvar alterações.');
    }
  }

  // Registrar manutenção
  async function handleRegisterMaintenance(event: MaintenanceEvent) {
    if (!client.id) return;

    try {
      // Fetch current history first to append
      const { data: currentData } = await supabase
        .from('clients')
        .select('maintenance_history')
        .eq('id', client.id)
        .single();
        
      const currentHistory = currentData?.maintenance_history || [];
      const newHistory = [...currentHistory, event];

      const updates: any = {
        maintenance_history: newHistory
      };

      let nextChangeDate = clientData.equipment.next_change_forecast;
      let lastChangeDate = clientData.equipment.last_sand_change;

      if (event.type === 'sand_change') {
        lastChangeDate = event.date;
        
        // Calcula próxima troca (18 meses depois)
        const date = new Date(event.date);
        date.setMonth(date.getMonth() + 18);
        nextChangeDate = date.toISOString().split('T')[0];

        updates.last_sand_change = lastChangeDate;
        updates.next_sand_change = nextChangeDate;
      }

      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', client.id);

      if (error) throw error;

      setClientData(prev => ({
        ...prev,
        equipment: {
          ...prev.equipment,
          maintenance_history: [event, ...prev.equipment.maintenance_history],
          last_sand_change: lastChangeDate,
          next_change_forecast: nextChangeDate
        }
      }));

      toast.success('Manutenção registrada com sucesso!');
      setShowMaintenanceModal(false);
    } catch (error) {
      console.error("Erro ao registrar manutenção:", error);
      toast.error('Erro ao salvar manutenção.');
    }
  }

  // Reajustar contrato
  async function handleAdjustContract(newValue: number, dateStart: string, reason: string) {
    if (!client.id) return;

    const oldValue = clientData.financial.current_value;
    const diffValue = newValue - oldValue;
    const diffPercent = oldValue !== 0 ? (diffValue / oldValue) * 100 : 0;

    // Extrair o índice de inflação do motivo se possível
    const inflationMatch = reason.match(/IPCA: ([\d.]+)%/);
    const inflationIndex = inflationMatch ? parseFloat(inflationMatch[1]) : null;

    const newHistoryItem = {
      date: dateStart,
      oldValue,
      newValue,
      diffValue,
      diffPercent,
      inflationIndex,
      reason
    };

    try {
      const { data: currentData } = await supabase
        .from('clients')
        .select('reajuste_history')
        .eq('id', client.id)
        .single();
        
      const currentHistory = currentData?.reajuste_history || [];
      const newHistory = [...currentHistory, newHistoryItem];

      const { error } = await supabase
        .from('clients')
        .update({
            service_value: newValue,
            reajuste_history: newHistory
        })
        .eq('id', client.id);

      if (error) throw error;

      setClientData(prev => ({
        ...prev,
        financial: {
          ...prev.financial,
          current_value: newValue,
          active_since: dateStart,
          price_history: [
            { date_start: dateStart, value: newValue },
            ...prev.financial.price_history
          ]
        }
      }));

      toast.success('Contrato reajustado com sucesso!');
    } catch (error) {
      console.error("Erro ao reajustar contrato:", error);
      toast.error('Erro ao salvar reajuste.');
    }
  }

  async function handleSaveEquipment(updatedEquipment: Equipment) {
    if (!client.id) return;
    try {
      const { error } = await supabase
        .from('clients')
        .update({
            filter_model: updatedEquipment.filter_model,
            filter_sand_kg: updatedEquipment.sand_capacity_kg,
            pool_volume: updatedEquipment.pool_volume,
            last_sand_change: updatedEquipment.last_sand_change,
            next_sand_change: updatedEquipment.next_change_forecast
        })
        .eq('id', client.id);

      if (error) throw error;

      setClientData(prev => ({
        ...prev,
        equipment: updatedEquipment
      }));
      toast.success('Equipamento atualizado com sucesso!');
    } catch (error) {
      console.error("Erro ao atualizar equipamento:", error);
      toast.error('Erro ao salvar equipamento.');
    }
  }

  async function handleSaveFinancial(updatedFinancial: Financial) {
    if (!client.id) return;
    try {
      const visitDaysToSave = (updatedFinancial.visit_days && updatedFinancial.visit_days.length > 0)
        ? updatedFinancial.visit_days
        : [updatedFinancial.visit_day];

      const { error } = await supabase
        .from('clients')
        .update({
            visit_frequency: updatedFinancial.frequency,
            visit_days: visitDaysToSave
        })
        .eq('id', client.id);

      if (error) throw error;

      setClientData(prev => ({
        ...prev,
        financial: updatedFinancial
      }));
      toast.success('Financeiro atualizado com sucesso!');
    } catch (error) {
      console.error("Erro ao atualizar financeiro:", error);
      toast.error('Erro ao salvar financeiro.');
    }
  }

  async function handleDeleteHistoryItem(index: number) {
    if (!client.id || !clientData.financial.reajusteHistory) return;
    
    if (!confirm('Tem certeza que deseja excluir este registro de reajuste?')) return;

    try {
      const currentHistory = [...clientData.financial.reajusteHistory];
      const itemToDelete = currentHistory[index];
      const newHistory = currentHistory.filter((_, i) => i !== index);
      
      let newServiceValue = clientData.financial.current_value;
      if (index === currentHistory.length - 1) {
        newServiceValue = itemToDelete.oldValue;
      }

      const { error } = await supabase
        .from('clients')
        .update({
            service_value: newServiceValue,
            reajuste_history: newHistory
        })
        .eq('id', client.id);

      if (error) throw error;

      setClientData(prev => ({
        ...prev,
        financial: {
          ...prev.financial,
          current_value: newServiceValue,
          reajusteHistory: newHistory,
          price_history: newHistory.map(h => ({
            date_start: h.date,
            value: h.newValue
          }))
        }
      }));
      
      toast.success('Item removido com sucesso.');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao remover item.');
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Header do Cliente */}
      <div className="flex items-center gap-4">
        {/* Avatar/Foto */}
        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold dark:text-white">
          {clientData.profile.name[0]}
        </div>
        <div>
          <div className="font-semibold text-lg dark:text-white">{clientData.profile.name}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{clientData.profile.address}</div>
        </div>
        {/* Ações rápidas removidas conforme solicitado */}
        <button className="ml-auto p-2 rounded bg-gray-100 dark:bg-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Editar Perfil" onClick={() => setShowEditProfile(true)}>
          ✏️
        </button>
      </div>

      {/* Cards principais */}

      <div className="space-y-4">
        <EquipmentCard 
          equipment={clientData.equipment} 
          onRegisterMaintenance={() => setShowMaintenanceModal(true)} 
          onSave={handleSaveEquipment}
        />
        
        {/* Renderização Condicional baseada no tipo de cliente */}
        {isAdHoc ? (
          <HydraulicRepairHistoryCard clientId={client.id} />
        ) : (
          <>
            <RoleGuard allowedRoles={['owner', 'solo', 'worker']}>
              <FinancialCard 
                financial={clientData.financial} 
                onAdjustContract={() => setShowAdjustModal(true)} 
                onDeleteHistoryItem={handleDeleteHistoryItem}
                onSave={handleSaveFinancial}
              />
            </RoleGuard>

            {/* Card: Histórico de Visitas */}
            {isLoading ? (
              <div className="text-center p-4 text-gray-500 dark:text-gray-400">Carregando visitas...</div>
            ) : (
              <VisitHistoryCard visits={visits} />
            )}
          </>
        )}
      </div>

      {/* Modais de ação */}
      <RegisterMaintenanceModal
        open={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        onRegister={handleRegisterMaintenance}
      />
      <AdjustContractModal
        open={showAdjustModal}
        currentValue={clientData.financial.current_value}
        lastAdjustmentDate={clientData.financial.active_since}
        onClose={() => setShowAdjustModal(false)}
        onAdjust={handleAdjustContract}
      />
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <ClientProfileForm profile={clientData.profile} onSave={handleSaveProfile} />
          <button className="absolute top-4 right-4 px-3 py-1 bg-gray-300 dark:bg-gray-600 dark:text-white rounded" onClick={() => setShowEditProfile(false)}>Fechar</button>
        </div>
      )}
      
      {/* Gráfico de evolução dos parâmetros */}
      <ParametersChart
        clientId={client.id}
        isOpen={showChart}
        onClose={() => setShowChart(false)}
      />
    </div>
  );
};
