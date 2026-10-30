import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Visit {
  id: string;
  date?: string;
  notes?: string;
}

interface ClientDetailsProps {
  clientId: string;
  phone?: string;
  address?: string;
}

export function ClientDetails({ clientId, phone, address }: ClientDetailsProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVisits() {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_visits')
        .select('id, date, notes')
        .eq('client_id', clientId)
        .order('date', { ascending: false })
        .limit(3);

      if (data) {
        setVisits(data.map(v => ({
            id: v.id,
            date: v.date,
            notes: v.notes
        })));
      }
      setLoading(false);
    }
    fetchVisits();
  }, [clientId]);

  return (
    <div className="mt-2 p-2 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
      <div><strong>Telefone:</strong> {phone || 'Não informado'}</div>
      <div><strong>Endereço:</strong> {address || 'Não informado'}</div>
      {/* Histórico rápido de visitas */}
      <div className="mt-2">
        <strong>Últimas visitas:</strong>
        <ul className="list-disc ml-4">
          {loading ? (
            <li>Carregando...</li>
          ) : visits.length > 0 ? (
            visits.slice(0,3).map((visit) => (
              <li key={visit.id}>
                {visit.date ? new Date(visit.date).toLocaleDateString('pt-BR') : 'Data desconhecida'} - {visit.notes ? visit.notes : 'Sem observações'}
              </li>
            ))
          ) : (
            <li>Nenhuma visita registrada</li>
          )}
        </ul>
      </div>
    </div>
  );
}