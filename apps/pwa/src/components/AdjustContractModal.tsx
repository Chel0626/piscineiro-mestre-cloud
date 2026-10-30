import React from 'react';
import { fetchInflationIndex } from '../lib/utils/inflation';

interface AdjustContractModalProps {
  open: boolean;
  currentValue: number;
  lastAdjustmentDate: string;
  onClose: () => void;
  onAdjust: (newValue: number, dateStart: string, reason: string) => void;
}

export const AdjustContractModal: React.FC<AdjustContractModalProps> = ({ open, currentValue, lastAdjustmentDate, onClose, onAdjust }) => {
  const [newValue, setNewValue] = React.useState(currentValue);
  const [dateStart, setDateStart] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = React.useState('');
  const [inflationRate, setInflationRate] = React.useState<number | null>(null);
  const [loadingInflation, setLoadingInflation] = React.useState(false);
  const [referenceDate, setReferenceDate] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setNewValue(currentValue);
      setInflationRate(null);
      setReason('');
      const isValidDate = !isNaN(new Date(lastAdjustmentDate).getTime());
      setReferenceDate(isValidDate ? lastAdjustmentDate : '');
    }
  }, [open, currentValue, lastAdjustmentDate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAdjust(newValue, dateStart, reason);
    onClose();
  }

  async function handleCalculateInflation() {
    if (!referenceDate) {
      alert('Por favor, informe a data do último reajuste para calcular a inflação.');
      return;
    }
    setLoadingInflation(true);
    const today = new Date().toISOString().slice(0, 10);
    const rate = await fetchInflationIndex(referenceDate, today);
    setInflationRate(rate);
    setLoadingInflation(false);
  }

  function applyInflation() {
    if (inflationRate !== null) {
      const adjusted = currentValue * (1 + inflationRate / 100);
      setNewValue(Number(adjusted.toFixed(2)));
      setReason(`Reajuste inflacionário (IPCA: ${inflationRate.toFixed(2)}%)`);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg min-w-[350px] space-y-4 border dark:border-gray-700" onSubmit={handleSubmit}>
        <div className="font-bold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 text-gray-900 dark:text-white">Reajuste de Contrato</div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500 dark:text-gray-400">Valor Atual</div>
            <div className="font-semibold text-lg text-gray-900 dark:text-white">R$ {currentValue.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Data Base (Último Reajuste)</div>
            <input 
              type="date" 
              value={referenceDate} 
              onChange={e => setReferenceDate(e.target.value)}
              className="font-medium border rounded px-2 py-1 w-full text-xs mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Inflation Calculator Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-100 dark:border-blue-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Cálculo IPCA</span>
            <button 
              type="button" 
              onClick={handleCalculateInflation}
              disabled={loadingInflation}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingInflation ? 'Calculando...' : 'Calcular'}
            </button>
          </div>
          
          {inflationRate !== null && (
            <div className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Índice Acumulado:</span>
                <span className="font-bold">{inflationRate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Valor Sugerido:</span>
                <span className="font-bold text-green-700 dark:text-green-400">
                  R$ {(currentValue * (1 + inflationRate / 100)).toFixed(2)}
                </span>
              </div>
              <button 
                type="button"
                onClick={applyInflation}
                className="w-full mt-1 text-xs border border-blue-600 text-blue-600 py-1 rounded hover:bg-blue-50"
              >
                Usar Valor Sugerido
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Novo Valor (R$)</label>
            <input 
              type="number" 
              step="0.01"
              value={newValue} 
              onChange={e => setNewValue(Number(e.target.value))} 
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data de Vigência</label>
            <input 
              type="date" 
              value={dateStart} 
              onChange={e => setDateStart(e.target.value)} 
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Motivo</label>
            <input 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="Ex: Reajuste anual"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium">
            Confirmar
          </button>
          <button type="button" className="flex-1 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};
