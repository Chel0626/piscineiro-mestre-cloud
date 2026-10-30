'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Calendar, Wrench, DollarSign, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useState } from 'react';

interface ServiceData {
  id: string;
  nome: string;
  endereco?: string;
  telefone?: string;
  tipoServico: string;
  valor: number;
  descricaoServico?: string;
  timestamp?: any;
  equipamento?: string;
  cargaUtilizada?: string;
  problemaIdentificado?: string;
  solucaoAplicada?: string;
  pecasUtilizadas?: { nome: string; valor: number }[];
  status?: string;
}

interface ClienteAvulsoHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  services: ServiceData[];
  onServiceDeleted: (serviceId: string) => void;
}

export function ClienteAvulsoHistoryModal({ 
  isOpen, 
  onClose, 
  clientName, 
  services,
  onServiceDeleted 
}: ClienteAvulsoHistoryModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro de serviço?')) return;

    setDeletingId(serviceId);
    try {
      const { error } = await supabase
        .from('clientes_avulsos')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast.success('Serviço excluído com sucesso');
      onServiceDeleted(serviceId);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir serviço');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400';
      case 'pending': return 'text-yellow-600 dark:text-yellow-400';
      case 'cancelled': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      default: return status || 'Concluído';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Serviços - {clientName}</DialogTitle>
          <DialogDescription>
            Lista de todos os serviços realizados para este cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {services.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum serviço registrado para este cliente.
            </div>
          ) : (
            services.map((service) => (
              <Card key={service.id} className="relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  service.status === 'pending' ? 'bg-yellow-500' : 
                  service.status === 'cancelled' ? 'bg-red-500' : 'bg-green-500'
                }`} />
                
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      {service.tipoServico}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium flex items-center gap-1 ${getStatusColor(service.status)}`}>
                        {service.status === 'pending' ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                        {getStatusLabel(service.status)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleDelete(service.id)}
                        disabled={deletingId === service.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {service.timestamp ? format(new Date(service.timestamp), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Data não informada'}
                  </div>
                </CardHeader>
                
                <CardContent className="text-sm space-y-3">
                  {service.descricaoServico && (
                    <div className="flex gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p>{service.descricaoServico}</p>
                    </div>
                  )}

                  {service.equipamento && (
                    <div className="bg-muted/50 p-2 rounded">
                      <span className="font-medium">Equipamento:</span> {service.equipamento}
                    </div>
                  )}

                  {service.problemaIdentificado && (
                    <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded text-red-700 dark:text-red-300">
                      <span className="font-medium">Problema:</span> {service.problemaIdentificado}
                    </div>
                  )}

                  {service.solucaoAplicada && (
                    <div className="bg-green-50 dark:bg-green-900/10 p-2 rounded text-green-700 dark:text-green-300">
                      <span className="font-medium">Solução:</span> {service.solucaoAplicada}
                    </div>
                  )}

                  {service.pecasUtilizadas && service.pecasUtilizadas.length > 0 && (
                    <div className="border rounded p-2">
                      <p className="font-medium mb-1 text-xs uppercase text-muted-foreground">Peças Utilizadas</p>
                      <ul className="space-y-1">
                        {service.pecasUtilizadas.map((peca, idx) => (
                          <li key={idx} className="flex justify-between text-xs">
                            <span>{peca.nome}</span>
                            <span>R$ {peca.valor.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t mt-2">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {service.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
