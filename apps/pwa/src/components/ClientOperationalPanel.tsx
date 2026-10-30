import React from 'react';
import { InventoryCard, InventoryItem } from './InventoryCard';

interface ClientOperationalPanelProps {
  poolVolume: number;
  clientName: string;
  inventory: InventoryItem[];
  onInventoryUpdate: (items: InventoryItem[]) => void;
}

export const ClientOperationalPanel: React.FC<ClientOperationalPanelProps> = ({ poolVolume, clientName, inventory, onInventoryUpdate }) => {
  return (
    <div className="space-y-4">
      {/* Card de Estoque */}
      <InventoryCard inventory={inventory} onUpdate={onInventoryUpdate} />
    </div>
  );
};
