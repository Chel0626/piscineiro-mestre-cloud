import React, { useState } from 'react';
import { Equipment, MaintenanceEvent } from './ClientDashboard';

interface EquipmentCardProps {
  equipment: Equipment;
  onRegisterMaintenance: () => void;
  onSave: (equipment: Equipment) => void;
}

function getProgressColor(monthsLeft: number) {
  if (monthsLeft > 6) return 'bg-green-500';
  if (monthsLeft > 3) return 'bg-yellow-500';
  return 'bg-red-500';
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment, onRegisterMaintenance, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Equipment>(equipment);

  // Calcular meses até próxima troca
  const monthsLeft = (() => {
    if (!equipment.next_change_forecast) return 0;
    const next = new Date(equipment.next_change_forecast);
    const now = new Date();
    const diff = (next.getFullYear() - now.getFullYear()) * 12 + (next.getMonth() - now.getMonth());
    return diff;
  })();

  const handleSave = () => {
    onSave(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(equipment);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="border rounded p-4 shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="font-semibold mb-4 text-gray-900 dark:text-white">Editar Equipamento</div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Modelo do Filtro</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={editData.filter_model}
              onChange={(e) => setEditData({ ...editData, filter_model: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Capacidade de Areia (kg)</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={editData.sand_capacity_kg}
              onChange={(e) => setEditData({ ...editData, sand_capacity_kg: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Volume da Piscina (m³)</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={editData.pool_volume}
              onChange={(e) => setEditData({ ...editData, pool_volume: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Última Troca de Areia</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={editData.last_sand_change}
              onChange={(e) => setEditData({ ...editData, last_sand_change: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Previsão Próxima Troca</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={editData.next_change_forecast}
              onChange={(e) => setEditData({ ...editData, next_change_forecast: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleCancel}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded p-4 shadow-sm relative bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <button 
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        onClick={() => {
          setEditData(equipment);
          setIsEditing(true);
        }}
      >
        ✏️
      </button>
      <div className="font-semibold mb-2 text-gray-900 dark:text-white">Status do Equipamento</div>
      <div className="text-gray-700 dark:text-gray-300">Filtro: {equipment.filter_model || '-'}</div>
      <div className="text-gray-700 dark:text-gray-300">Areia: {equipment.sand_capacity_kg ? `${equipment.sand_capacity_kg}kg` : '-'}</div>
      <div className="text-gray-700 dark:text-gray-300">Volume: {equipment.pool_volume ? `${equipment.pool_volume?.toLocaleString('pt-BR')} m³` : '-'}</div>
      <div className="text-gray-700 dark:text-gray-300">
        Próxima troca: <span className="font-bold">{equipment.next_change_forecast || '-'}</span>
      </div>
      <div className="w-full h-2 rounded bg-gray-200 dark:bg-gray-700 my-2">
        <div className={`h-2 rounded ${getProgressColor(monthsLeft)}`} style={{ width: `${Math.max(0, Math.min(100, monthsLeft * 5))}%` }} />
      </div>
      <div className="text-xs mb-2">
        {monthsLeft > 6 && <span className="text-green-700 dark:text-green-400">OK</span>}
        {monthsLeft <= 6 && monthsLeft > 3 && <span className="text-yellow-700 dark:text-yellow-400">Atenção</span>}
        {monthsLeft <= 3 && <span className="text-red-700 dark:text-red-400">Troca Imediata</span>}
      </div>
      <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={onRegisterMaintenance}>
        Registrar Troca
      </button>
      <div className="mt-4">
        <div className="font-semibold mb-1 text-gray-900 dark:text-white">Histórico de Manutenção</div>
        <ul className="text-sm max-h-32 overflow-y-auto text-gray-700 dark:text-gray-300">
          {equipment.maintenance_history.slice(0, 3).map((event, idx) => (
            <li key={idx} className="mb-1">
              {event.date}: {event.type === 'sand_change' ? 'Troca de Areia' : event.type === 'crepina_change' ? 'Troca de Crepina' : 'Manutenção Válvula'}
              {event.notes && <span className="text-gray-500 dark:text-gray-400"> — {event.notes}</span>}
            </li>
          ))}
          {equipment.maintenance_history.length === 0 && <li className="text-gray-500 dark:text-gray-400 italic">Nenhum registro.</li>}
        </ul>
      </div>
    </div>
  );
};
