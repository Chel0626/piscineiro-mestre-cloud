'use client';

import { useState } from 'react';
import { useClients } from '@/hooks/useClients';
import { usePayments } from '@/hooks/usePayments';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { User, DollarSign, AlertTriangle, CheckCircle, MessageCircle } from 'lucide-react';
import { ClientWithPayment } from '@/lib/validators/clientSchema';
import { toast } from 'sonner';

export function OverduePaymentsWidget() {
  const { clients, authLoading } = useClients();
  const { markAsPaid, getPaymentStatus } = usePayments();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);

  if (authLoading) {
    return null;
  }
  
  // Filtrar clientes com pagamentos vencidos
  const overdueClients = clients.filter((client: ClientWithPayment) => {
    const status = getPaymentStatus(client);
    return status === 'overdue';
  });

  // Se não houver clientes vencidos, não renderiza o card
  if (overdueClients.length === 0) {
    return null;
  }

  const handleMarkAsPaid = async (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que clique no card
    await markAsPaid(clientId);
  };

  const handleSendWhatsApp = (client: ClientWithPayment, e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que clique no card
    
    if (!client.phone) {
      toast.error('Cliente não possui telefone cadastrado.');
      return;
    }

    const message = `Olá, ${client.name}, tudo bem?\nNosso mês venceu. Obrigado!`;
    const whatsappUrl = `https://wa.me/55${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('WhatsApp aberto com a mensagem de cobrança!');
  };

  const getTotalOverdue = () => {
    return overdueClients.reduce((total, client) => total + client.serviceValue, 0);
  };

  return (
    <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Pagamentos Vencidos
            </CardTitle>
            <CardDescription className="text-red-600/80 dark:text-red-300/80">
              {overdueClients.length} cliente(s) • Total: R$ {getTotalOverdue().toFixed(2)}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            {isExpanded ? 'Ocultar' : 'Expandir'}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
        <ul className="space-y-3">
          {overdueClients.map(client => {
            const daysOverdue = new Date().getDate() - client.paymentDueDate;
            
            return (
              <li 
                key={client.id} 
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                onClick={() => router.push(`/dashboard/clientes/${client.id}`)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <User className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{client.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{client.neighborhood}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                      {daysOverdue > 0 ? `${daysOverdue} dia(s) em atraso` : 'Venceu hoje'}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
                    <DollarSign className="h-4 w-4" />
                    <span className="whitespace-nowrap">R$ {client.serviceValue.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 flex-1 sm:flex-none"
                      onClick={(e) => handleMarkAsPaid(client.id, e)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Pago</span>
                      <span className="sm:hidden">✓</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex-1 sm:flex-none"
                      onClick={(e) => handleSendWhatsApp(client, e)}
                      disabled={!client.phone}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Cobrar</span>
                      <span className="sm:hidden">💬</span>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        </CardContent>
      )}
    </Card>
  );
}