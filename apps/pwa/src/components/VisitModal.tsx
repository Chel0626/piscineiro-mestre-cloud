import React, { useState, useEffect } from 'react';

export interface CalculatorData {
  ph: number;
  chlorine_ppm: number;
  alkalinity_ppm: number;
  timestamp: string;
}

export interface InventoryItem {
  item_id: string;
  name: string;
  qty: number;
  unit: string;
}

export interface VisitLog {
  id: string;
  client_id: string;
  date: string;
  timestamps: {
    check_in: string;
    check_out: string;
    duration_minutes: number;
  };
  measurements: {
    ph: number;
    chlorine_ppm: number;
    alkalinity_ppm: number;
  };
  products_consumed: Array<{
    item_id: string;
    name: string;
    qty: number;
    unit: string;
  }>;
  media: {
    photo_url: string;
  };
  notes: string;
}

export interface VisitModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (visitLog: VisitLog) => void;
  clientId: string;
  inventory: InventoryItem[];
  lastCalculatorData?: CalculatorData;
  checkInTime: string;
}

export const VisitModal: React.FC<VisitModalProps> = ({ open, onClose, onSubmit, clientId, inventory, lastCalculatorData, checkInTime }) => {
  const [ph, setPh] = useState<number>(lastCalculatorData?.ph || 0);
  const [chlorine, setChlorine] = useState<number>(lastCalculatorData?.chlorine_ppm || 0);
  const [alkalinity, setAlkalinity] = useState<number>(lastCalculatorData?.alkalinity_ppm || 0);
  const [productsUsed, setProductsUsed] = useState<{ [key: string]: number }>({});
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [checkOutTime, setCheckOutTime] = useState<string>('');

  useEffect(() => {
    if (lastCalculatorData && Date.now() - new Date(lastCalculatorData.timestamp).getTime() < 10 * 60 * 1000) {
      setPh(lastCalculatorData.ph);
      setChlorine(lastCalculatorData.chlorine_ppm);
      setAlkalinity(lastCalculatorData.alkalinity_ppm);
    }
  }, [lastCalculatorData]);

  const handleProductChange = (itemId: string, value: number) => {
    setProductsUsed(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = () => {
    const durationMinutes = checkInTime && checkOutTime ? Math.round((new Date(checkOutTime).getTime() - new Date(checkInTime).getTime()) / 60000) : 0;
    const visitLog = {
      id: `visit_${Date.now()}`,
      client_id: clientId,
      date: new Date().toISOString().slice(0, 10),
      timestamps: {
        check_in: checkInTime,
        check_out: checkOutTime,
        duration_minutes: durationMinutes
      },
      measurements: {
        ph,
        chlorine_ppm: chlorine,
        alkalinity_ppm: alkalinity
      },
      products_consumed: inventory.filter(item => productsUsed[item.item_id]).map(item => ({
        item_id: item.item_id,
        name: item.name,
        qty: productsUsed[item.item_id],
        unit: item.unit
      })),
      media: {
        photo_url: photoUrl
      },
      notes
    };
    onSubmit(visitLog);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-lg border dark:border-gray-700">
        <h2 className="text-xl font-bold mb-2 dark:text-white">Resumo do Atendimento</h2>
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">Duração: {checkInTime && checkOutTime ? `${Math.round((new Date(checkOutTime).getTime() - new Date(checkInTime).getTime()) / 60000)} min` : '--'}</div>
        <div className="mb-4">
          <label className="block font-semibold dark:text-gray-200">Parâmetros</label>
          <div className="flex gap-2 mt-2">
            <input type="number" value={ph} onChange={e => setPh(Number(e.target.value))} placeholder="pH" className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1 rounded w-20" />
            <input type="number" value={chlorine} onChange={e => setChlorine(Number(e.target.value))} placeholder="Cloro" className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1 rounded w-20" />
            <input type="number" value={alkalinity} onChange={e => setAlkalinity(Number(e.target.value))} placeholder="Alcalinidade" className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1 rounded w-24" />
          </div>
          {lastCalculatorData && (
            <button className="text-xs text-blue-500 dark:text-blue-400 mt-1 underline" onClick={() => {
              setPh(lastCalculatorData.ph);
              setChlorine(lastCalculatorData.chlorine_ppm);
              setAlkalinity(lastCalculatorData.alkalinity_ppm);
            }}>
              Usar últimos dados da Calculadora
            </button>
          )}
        </div>
        <div className="mb-4">
          <label className="block font-semibold dark:text-gray-200">Produtos Utilizados</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {inventory.map(item => (
              <div key={item.item_id} className="flex items-center gap-1 border dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700">
                <input
                  type="checkbox"
                  checked={!!productsUsed[item.item_id]}
                  onChange={e => handleProductChange(item.item_id, e.target.checked ? item.qty : 0)}
                />
                <span className="dark:text-gray-200">{item.name}</span>
                <input
                  type="number"
                  value={productsUsed[item.item_id] || ''}
                  onChange={e => handleProductChange(item.item_id, Number(e.target.value))}
                  className="border dark:border-gray-500 dark:bg-gray-600 dark:text-white px-1 py-0.5 rounded w-16 ml-1"
                  placeholder="Qtd"
                  min={0}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">{item.unit}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block font-semibold dark:text-gray-200">Foto</label>
          <input type="text" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="URL da foto ou selecione" className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1 rounded w-full mt-1" />
          <div className="flex gap-2 mt-2">
            <button className="bg-gray-200 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Câmera</button>
            <button className="bg-gray-200 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Galeria</button>
          </div>
        </div>
        <div className="mb-4">
          <label className="block font-semibold dark:text-gray-200">Observações</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1 rounded w-full mt-1" rows={2} placeholder="Notas sobre o atendimento..." />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="bg-gray-300 dark:bg-gray-600 dark:text-white px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500" onClick={onClose}>Cancelar</button>
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded" onClick={handleSubmit}>Salvar Visita</button>
        </div>
      </div>
    </div>
  );
};
