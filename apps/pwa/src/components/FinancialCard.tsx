import React, { useState } from 'react';
import { Financial, PriceHistory } from './ClientDashboard';
import { useAuth } from '@/context/AuthContext';

interface FinancialCardProps {
  financial: Financial;
  onAdjustContract: () => void;
  onDeleteHistoryItem?: (index: number) => void;
  onSave: (financial: Financial) => void;
}

export const FinancialCard: React.FC<FinancialCardProps> = ({ financial, onAdjustContract, onDeleteHistoryItem, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Financial>(financial);
  const { role } = useAuth();
  const isWorker = role === 'worker';

  // Inverter para mostrar o mais recente primeiro, mas manter o índice original para deleção
  const historyWithIndex = financial.reajusteHistory?.map((item, index) => ({ ...item, originalIndex: index })).reverse() || [];

  const handleSave = () => {
    onSave(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(financial);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="border rounded p-4 shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="font-semibold mb-4 dark:text-white">Editar Contrato</div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frequência</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              value={editData.frequency}
              onChange={(e) => setEditData({ ...editData, frequency: e.target.value as 'weekly' | 'biweekly' })}
            >
              <option value="weekly">1x por semana</option>
              <option value="biweekly">2x por semana</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dia(s) da Visita</label>
            <div className="mt-1 space-y-2">
              {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'].map((day) => (
                <div key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`day-${day}`}
                    checked={editData.visit_days?.includes(day) || editData.visit_day === day}
                    onChange={(e) => {
                      const currentDays = editData.visit_days || (editData.visit_day ? [editData.visit_day] : []);
                      let newDays;
                      if (e.target.checked) {
                        newDays = [...currentDays, day];
                      } else {
                        newDays = currentDays.filter(d => d !== day);
                      }
                      
                      // Limitar seleção baseado na frequência
                      if (editData.frequency === 'weekly' && newDays.length > 1) {
                        // Se for semanal, mantém apenas o último selecionado
                        newDays = [day];
                      } else if (editData.frequency === 'biweekly' && newDays.length > 2) {
                         // Se for quinzenal (2x), não deixa selecionar mais que 2
                         return; 
                      }

                      setEditData({ 
                        ...editData, 
                        visit_days: newDays,
                        visit_day: newDays[0] || '' // Mantém compatibilidade
                      });
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                  />
                  <label htmlFor={`day-${day}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
                    {day}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {editData.frequency === 'weekly' ? 'Selecione 1 dia.' : 'Selecione até 2 dias.'}
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleCancel}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
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
    <div className="border rounded p-4 shadow-sm relative bg-white dark:bg-gray-800 dark:border-gray-700">
      <button 
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        onClick={() => {
          setEditData(financial);
          setIsEditing(true);
        }}
      >
        ✏️
      </button>
      <div className="font-semibold mb-2 dark:text-white">Contrato Atual</div>
      {!isWorker && <div className="text-2xl font-bold text-green-700 dark:text-green-400">R$ {financial.current_value.toFixed(2)}</div>}
      <div className="dark:text-gray-300">Frequência: {financial.frequency === 'weekly' ? '1x por semana' : '2x por semana'}</div>
      <div className="dark:text-gray-300">Dia(s) da visita: {financial.visit_days && financial.visit_days.length > 0 ? financial.visit_days.join(', ') : financial.visit_day}</div>
      <div className="dark:text-gray-300">Vigente desde: {financial.active_since}</div>
      {!isWorker && (
        <button className="mt-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded" onClick={onAdjustContract}>
          Reajustar Valor
        </button>
      )}
      {!isWorker && <div className="mt-4">
        <div className="font-semibold mb-1 dark:text-white">Histórico de Preços</div>
        <ul className="text-sm max-h-32 overflow-y-auto">
          {historyWithIndex.length === 0 && <li className="text-gray-500 dark:text-gray-400 italic">Nenhum reajuste registrado.</li>}
          {historyWithIndex.map((h, idx) => (
            <li key={idx} className="mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded flex justify-between items-start">
              <div className="dark:text-gray-200">
                <div className="font-medium">
                  {h.date ? new Date(h.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '--/--/----'}
                </div>
                <div>
                  R$ {(h.oldValue ?? 0).toFixed(2)} ➝ <strong>R$ {(h.newValue ?? 0).toFixed(2)}</strong>
                </div>
                {h.reason && <div className="text-xs text-gray-500 dark:text-gray-400">{h.reason}</div>}
              </div>
              {onDeleteHistoryItem && !isWorker && (
                <button 
                  onClick={() => onDeleteHistoryItem(h.originalIndex)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                  title="Excluir registro"
                >
                  🗑️
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>}
    </div>
  );
};
