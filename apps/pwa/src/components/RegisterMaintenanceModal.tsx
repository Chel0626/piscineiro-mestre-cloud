import React from 'react';
import { MaintenanceEvent } from './ClientDashboard';

interface RegisterMaintenanceModalProps {
  open: boolean;
  onClose: () => void;
  onRegister: (event: MaintenanceEvent) => void;
}

export const RegisterMaintenanceModal: React.FC<RegisterMaintenanceModalProps> = ({ open, onClose, onRegister }) => {
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = React.useState<'sand_change' | 'crepina_change' | 'valve_maintenance'>('sand_change');
  const [notes, setNotes] = React.useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onRegister({ date, type, notes });
    onClose();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg min-w-[300px] space-y-3 border dark:border-gray-700" onSubmit={handleSubmit}>
        <div className="font-bold mb-2 text-gray-900 dark:text-white">Registrar Manutenção</div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Data da Realização</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipo de Serviço</label>
          <select value={type} onChange={e => setType(e.target.value as 'sand_change' | 'crepina_change' | 'valve_maintenance')} className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
            <option value="sand_change">Troca de Areia</option>
            <option value="crepina_change">Troca de Crepina</option>
            <option value="valve_maintenance">Manutenção Válvula</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Observações</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" />
        </div>
        <div className="flex gap-2 mt-2">
          <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Confirmar Registro</button>
          <button type="button" className="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-600" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </div>
  );
};
