import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Calendar, DollarSign, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';

interface RepairService {
  id: string;
  timestamp: string;
  tipoServico: string;
  descricaoServico?: string;
  valor?: number;
  pecasUtilizadas?: { nome: string; valor: number }[];
  equipamento?: string;
}

interface HydraulicRepairHistoryCardProps {
  clientId: string;
}

export function HydraulicRepairHistoryCard({ clientId }: HydraulicRepairHistoryCardProps) {
  const { user, tenant } = useAuth();
  const [repairs, setRepairs] = useState<RepairService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepairs = async () => {
      if (!clientId || !user || !tenant) return;

      try {
        const { data, error } = await supabase
          .from('ad_hoc_clients')
          .select('*')
          .eq('client_id', clientId)
          .eq('tenant_id', tenant.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const services = data.map(item => ({
          id: item.id,
          timestamp: item.created_at,
          tipoServico: item.service_type,
          descricaoServico: item.service_description,
          valor: item.value,
          pecasUtilizadas: item.details?.pecasUtilizadas,
          equipamento: item.details?.equipamento
        })) as RepairService[];

        const technicalServices = services.filter(s => 
          s.tipoServico === 'Manutenção hidráulica' || 
          s.tipoServico === 'Troca de areia' ||
          s.tipoServico === 'Instalação de equipamentos' ||
          s.tipoServico === 'Outros'
        );

        setRepairs(technicalServices);
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepairs();
  }, [clientId, user, tenant]);

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-800 rounded-lg" />;
  }

  if (repairs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Histórico de Manutenções
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {repairs.map((repair) => (
          <div key={repair.id} className="border-b last:border-0 pb-4 last:pb-0">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">{repair.tipoServico}</h4>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(repair.timestamp), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            
            {repair.descricaoServico && (
              <p className="text-sm text-muted-foreground mb-2 flex items-start gap-2">
                <FileText className="h-3 w-3 mt-1 shrink-0" />
                {repair.descricaoServico}
              </p>
            )}

            {repair.pecasUtilizadas && repair.pecasUtilizadas.length > 0 && (
              <div className="bg-muted/50 p-2 rounded text-sm mb-2">
                <p className="font-medium text-xs mb-1">Peças/Materiais:</p>
                <ul className="list-disc list-inside text-xs space-y-1">
                  {repair.pecasUtilizadas.map((peca, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{peca.nome}</span>
                      <span>R$ {peca.valor.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {repair.valor && (
              <div className="flex justify-end text-sm font-medium text-green-600 dark:text-green-400">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Total: R$ {repair.valor.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
