'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useRoutines } from '@/hooks/useRoutines';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, GripVertical, Calendar, Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ClientFormData } from '@/lib/validators/clientSchema';
import { RouteList, RouteClient, RouteClientState } from '@/components/RouteList';

// Tipagem para os clientes
type Client = ClientFormData & { id: string; state: RouteClientState; checkInTime?: string; checkOutTime?: string; durationMinutes?: number };

const daysOfWeek = [
  { key: 'Segunda-feira', label: 'Segunda', short: 'SEG' },
  { key: 'Terça-feira', label: 'Terça', short: 'TER' },
  { key: 'Quarta-feira', label: 'Quarta', short: 'QUA' },
  { key: 'Quinta-feira', label: 'Quinta', short: 'QUI' },
  { key: 'Sexta-feira', label: 'Sexta', short: 'SEX' },
  { key: 'Sábado', label: 'Sábado', short: 'SAB' },
  { key: 'Domingo', label: 'Domingo', short: 'DOM' },
];

// --- Removido SortableClientItem: agora usamos RouteList

// --- Componente principal da página ---
export default function RoteirosPage() {
  const { groupedClients, isLoading } = useRoutines();
  // Estado local para gerenciar a ordem dos clientes de cada dia
  const [localGroupedClients, setLocalGroupedClients] = useState<Record<string, Client[]>>(groupedClients as Record<string, Client[]>);
  // Estado para controlar quais dias estão expandidos (pode ter vários abertos ao mesmo tempo)
  const [expandedDays, setExpandedDays] = useState<string[]>([daysOfWeek[0].key]);

  // Estado para mover roteiro
  const [moveRouteModalOpen, setMoveRouteModalOpen] = useState(false);
  const [clientToMove, setClientToMove] = useState<string | null>(null);
  const [newRouteDay, setNewRouteDay] = useState<string>('');

  // Sincroniza o estado local quando os dados do Firebase são carregados
  useEffect(() => {
    setLocalGroupedClients(groupedClients as Record<string, Client[]>);
  }, [groupedClients]);

  const toggleDay = (dayKey: string) => {
    setExpandedDays(prev => 
      prev.includes(dayKey) 
        ? prev.filter(d => d !== dayKey)
        : [...prev, dayKey]
    );
  };

  // Funções para fluxo de estados dos cards
  const handleMoveRoute = (clientId: string) => {
    setClientToMove(clientId);
    setMoveRouteModalOpen(true);
  };

  const confirmMoveRoute = async () => {
    if (!clientToMove || !newRouteDay) return;

    try {
      await supabase.from('clients').update({
          visit_days: [newRouteDay],
          visit_day: newRouteDay
      }).eq('id', clientToMove);

      toast.success(`Roteiro movido para ${newRouteDay}!`);
      setMoveRouteModalOpen(false);
      setClientToMove(null);
      setNewRouteDay('');
      
      // A atualização da lista acontecerá automaticamente via listener do useRoutines
    } catch (error) {
      console.error('Erro ao mover roteiro:', error);
      toast.error('Erro ao mover roteiro.');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent, dayKey: string) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const clientsForDay = localGroupedClients[dayKey] || [];
      const oldIndex = clientsForDay.findIndex(c => c.id === active.id);
      const newIndex = clientsForDay.findIndex(c => c.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedClients = arrayMove(clientsForDay, oldIndex, newIndex);
        
        // Atualizar estado local imediatamente
        setLocalGroupedClients(prev => ({
          ...prev,
          [dayKey]: reorderedClients,
        }));

        // Salvar a nova ordem no Supabase
        try {
          const updatePromises = reorderedClients.map(async (client, index) => {
             const currentRouteOrder = client.routeOrder || {};
             const newRouteOrder = { ...currentRouteOrder, [dayKey]: index };
             
             return supabase.from('clients').update({
                 route_order: newRouteOrder
             }).eq('id', client.id);
          });

          await Promise.all(updatePromises);
          toast.success("Ordem da rota salva!");
        } catch (error) {
          console.error('Erro ao salvar ordem:', error);
          toast.error("Erro ao salvar a ordem. Tente novamente.");
        }
      }
    }
  }

  if (isLoading) {
    return <div>Carregando roteiros...</div>;
  }
  
  return (
    <div className="w-full overflow-x-hidden">
      <div className="w-full px-3 sm:px-4 md:px-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Roteiros da Semana</h1>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
            Clique em um dia para expandir e reordene sua rota. Inicie e registre visitas conforme o fluxo profissional.
          </p>
        </div>
        {/* Lista de clientes por dia usando RouteList */}
        {daysOfWeek.map(day => {
          const dayClients = localGroupedClients[day.key] || [];
          const isExpanded = expandedDays.includes(day.key);
          // Debug: logar agrupamento e clientes
          // no debug logs here
          return (
            <div key={day.key} className="mb-6 border rounded-lg bg-white dark:bg-gray-900 shadow-sm">
              <button
                className={`w-full flex items-center justify-between px-4 py-3 text-lg font-bold focus:outline-none transition-colors ${isExpanded ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-800'}`}
                onClick={() => toggleDay(day.key)}
                aria-expanded={isExpanded}
              >
                <span>{day.label}</span>
                <span className={`ml-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {isExpanded && (
                <div className="p-4">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={event => handleDragEnd(event, day.key)}
                  >
                    <SortableContext
                      items={dayClients.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <RouteList
                        clients={dayClients}
                        onMoveRoute={handleMoveRoute}
                      />
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Modal de Mover Roteiro */}
        <Dialog open={moveRouteModalOpen} onOpenChange={setMoveRouteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mover Roteiro</DialogTitle>
              <DialogDescription>
                Selecione o novo dia da semana para este cliente. Esta alteração é permanente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day.key}
                    variant={newRouteDay === day.key ? "default" : "outline"}
                    className={newRouteDay === day.key ? "bg-blue-600 text-white" : ""}
                    onClick={() => setNewRouteDay(day.key)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMoveRouteModalOpen(false)}>Cancelar</Button>
              <Button onClick={confirmMoveRoute} disabled={!newRouteDay}>Confirmar Mudança</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}