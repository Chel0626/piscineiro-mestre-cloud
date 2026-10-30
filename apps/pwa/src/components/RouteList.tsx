import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar } from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

export type RouteClientState = 'pending' | 'inProgress' | 'done';

export interface RouteClient {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  state: RouteClientState;
  checkInTime?: string;
  checkOutTime?: string;
  durationMinutes?: number;
}

interface SortableClientItemProps {
  client: RouteClient;
  state: RouteClientState;
  onMoveRoute: () => void;
}

const SortableClientItem: React.FC<SortableClientItemProps> = ({ client, state, onMoveRoute }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: client.id });
  
  // Fallback para state se for undefined
  const currentState = state || 'pending';

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }}
      className={`rounded-lg p-4 shadow-md transition-all flex items-center ${
        currentState === 'pending'
          ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          : currentState === 'inProgress'
          ? 'border border-blue-500 bg-blue-50 dark:bg-blue-900/30 animate-pulse'
          : 'bg-gray-100 dark:bg-gray-800/50 opacity-60 border border-green-500'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="mr-3 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 cursor-grab"
        title="Arraste para reordenar"
        style={{ touchAction: 'none' }}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M7 10v4m5-4v4m5-4v4"/></svg>
      </button>
      <div className="flex-1">
        <div className="font-bold text-lg text-gray-900 dark:text-white">{client.name}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{client.address} - {client.neighborhood}</div>
      </div>
      <div className="flex gap-2 items-center">
        <RoleGuard allowedRoles={['solo', 'owner', 'worker']}>
          <button
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-2 py-1 rounded"
            onClick={onMoveRoute}
            title="Mover Roteiro"
          >
            <Calendar className="h-5 w-5" />
          </button>
        </RoleGuard>
        {currentState === 'done' && (
          <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            Concluído
          </span>
        )}
      </div>
    </div>
  );
};

interface RouteListProps {
  clients: RouteClient[];
  onMoveRoute: (clientId: string) => void;
}

export const RouteList: React.FC<RouteListProps> = ({ clients, onMoveRoute }) => {
  const [clientStates, setClientStates] = useState<{ [id: string]: RouteClientState }>(() => {
    const initial: { [id: string]: RouteClientState } = {};
    clients.forEach((c: RouteClient) => { initial[c.id] = c.state || 'pending'; });
    return initial;
  });

  // Sincronizar novos clientes
  useEffect(() => {
    setClientStates(prev => {
      const next = { ...prev };
      let changed = false;
      clients.forEach(client => {
        if (next[client.id] === undefined) {
          next[client.id] = client.state || 'pending';
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [clients]);

  return (
    <div className="space-y-4">
      {clients.map(client => (
        <SortableClientItem
          key={client.id}
          client={client}
          state={clientStates[client.id]}
          onMoveRoute={() => onMoveRoute(client.id)}
        />
      ))}
    </div>
  );
};
