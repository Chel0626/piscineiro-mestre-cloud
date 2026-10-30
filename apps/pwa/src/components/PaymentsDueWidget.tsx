// src/components/PaymentsDueWidget.tsx
'use client';

import { useState } from 'react';
import { useClients } from '@/hooks/useClients';
import { usePayments } from '@/hooks/usePayments';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { User, DollarSign, CheckCircle, Clock, MessageCircle } from 'lucide-react';
import { ClientWithPayment } from '@/lib/validators/clientSchema';
import { toast } from 'sonner';

export function PaymentsDueWidget() {
  const { clients, authLoading } = useClients();
  const { markAsPaid, getPaymentStatus } = usePayments();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);

  if (authLoading) {
    return null; // Não mostra nada enquanto carrega
  }
  
  // Filtrar clientes que vencem hoje e ainda não pagaram
  const dueClients = clients.filter((client: ClientWithPayment) => {
    const status = getPaymentStatus(client);
    return status === 'due_today';
  });

  // Se não houver clientes vencendo hoje, não renderiza o card.
  if (dueClients.length === 0) {
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

  const getTotalDue = () => {
    return dueClients.reduce((total, client) => total + client.serviceValue, 0);
  };

  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-orange-700 dark:text-orange-400 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Vencimentos de Hoje
            </CardTitle>
            <CardDescription className="text-orange-600/80 dark:text-orange-300/80">
              {dueClients.length} cliente(s) • Total: R$ {getTotalDue().toFixed(2)}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40"
          >
            {isExpanded ? 'Ocultar' : 'Expandir'}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
        <ul className="space-y-3">
          {dueClients.map(client => (
            <li 
              key={client.id} 
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 rounded-lg cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
              onClick={() => router.push(`/dashboard/clientes/${client.id}`)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <User className="h-5 w-5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{client.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{client.neighborhood}</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Vence hoje</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold">
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
          ))}
        </ul>
        </CardContent>
      )}
    </Card>
  );
}