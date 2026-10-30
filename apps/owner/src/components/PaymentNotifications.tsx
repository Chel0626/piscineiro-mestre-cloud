'use client';

import { useClients } from "@/hooks/useClients";
import { usePayments } from "@/hooks/usePayments";
import { AlertCircle, Clock, CheckCircle, MessageCircle, User, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PaymentNotifications() {
  const { clients, refreshClients } = useClients();
  const { getPaymentStatus, markAsPaid } = usePayments();
  const [isOverdueOpen, setIsOverdueOpen] = useState(false);
  const [isDueTodayOpen, setIsDueTodayOpen] = useState(false);
  const router = useRouter();

  const activeClients = clients.filter(client => (client as any).active);
  const overdueClients = activeClients.filter(client => getPaymentStatus(client) === 'overdue');
  const dueTodayClients = activeClients.filter(client => getPaymentStatus(client) === 'due_today');

  if (overdueClients.length === 0 && dueTodayClients.length === 0) {
    return null;
  }

  const handleMarkAsPaid = async (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsPaid(clientId);
      await refreshClients?.();
      toast.success("Pagamento marcado como concluído!");
    } catch (error) {
      toast.error("Erro ao marcar pagamento.");
    }
  };

  const handleSendWhatsApp = (client: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!client.phone) {
      toast.error('Cliente não possui telefone cadastrado.');
      return;
    }
    const message = `Olá, ${client.name}, tudo bem?\nNosso mês venceu. Obrigado!`;
    const whatsappUrl = `https://wa.me/55${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('WhatsApp aberto com a mensagem de cobrança!');
  };

  return (
    <div className="space-y-3 w-full">
      {/* ========================================= */}
      {/* GAVETA: PAGAMENTOS VENCIDOS (Flutuante)   */}
      {/* ========================================= */}
      {overdueClients.length > 0 && (
        <div className="relative w-full">
          {/* Botão de Gatilho */}
          <div 
            className={`w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-3 flex items-center justify-between cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors ${isOverdueOpen ? 'rounded-t-lg' : 'rounded-lg'}`}
            onClick={() => setIsOverdueOpen(!isOverdueOpen)}
          >
            <span className="flex items-center gap-2 font-medium text-sm">
              <AlertCircle className="h-4 w-4" /> Pagamentos Vencidos ({overdueClients.length})
            </span>
            {isOverdueOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>

          {/* Área Flutuante (Dropdown) */}
          {isOverdueOpen && (
            <div className="absolute top-full left-0 w-full bg-red-50 dark:bg-red-950/90 border border-red-200 dark:border-red-900/50 border-t-0 rounded-b-lg shadow-2xl z-50 max-h-[340px] overflow-y-auto p-3 flex flex-col gap-3">
              {overdueClients.map(client => (
                <div 
                  key={client.id} 
                  className="flex flex-col gap-3 p-3 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => router.push(`/clients/${client.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-red-500">
                         <User className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm leading-tight">{client.name}</p>
                        <p className="text-[11px] text-red-600 dark:text-red-400 font-bold italic mt-0.5">
                          Venceu dia {client.paymentDueDate || (client as any).payment_due_date}
                        </p>
                      </div>
                    </div>
                    <div className="text-red-600 font-black text-sm whitespace-nowrap">
                      $ {Number(client.serviceValue || (client as any).service_value || 0).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 flex-1 h-8 bg-transparent"
                      onClick={(e) => handleMarkAsPaid(client.id, e)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1.5" />
                      <span className="text-xs font-semibold">Concluir</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 flex-1 h-8 bg-transparent"
                      onClick={(e) => handleSendWhatsApp(client, e)}
                      disabled={!client.phone}
                    >
                      <MessageCircle className="h-3 w-3 mr-1.5" />
                      <span className="text-xs font-semibold">Cobrar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================= */}
      {/* GAVETA: VENCIMENTOS DE HOJE (Flutuante)   */}
      {/* ========================================= */}
      {dueTodayClients.length > 0 && (
        <div className="relative w-full">
          <div 
            className={`w-full bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 text-orange-700 dark:text-orange-400 p-3 flex items-center justify-between cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors ${isDueTodayOpen ? 'rounded-t-lg' : 'rounded-lg'}`}
            onClick={() => setIsDueTodayOpen(!isDueTodayOpen)}
          >
            <span className="flex items-center gap-2 font-medium text-sm">
              <Clock className="h-4 w-4" /> Vencimentos de Hoje ({dueTodayClients.length})
            </span>
            {isDueTodayOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>

          {isDueTodayOpen && (
            <div className="absolute top-full left-0 w-full bg-orange-50 dark:bg-orange-950/90 border border-orange-200 dark:border-orange-900/50 border-t-0 rounded-b-lg shadow-2xl z-50 max-h-[340px] overflow-y-auto p-3 flex flex-col gap-3">
              {dueTodayClients.map(client => (
                <div 
                  key={client.id} 
                  className="flex flex-col gap-3 p-3 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/50 rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => router.push(`/clients/${client.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-orange-500">
                         <User className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm leading-tight">{client.name}</p>
                        <p className="text-[11px] text-orange-600 dark:text-orange-400 font-bold italic mt-0.5">
                          Vence hoje
                        </p>
                      </div>
                    </div>
                    <div className="text-orange-600 font-black text-sm whitespace-nowrap">
                      $ {Number(client.serviceValue || (client as any).service_value || 0).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 flex-1 h-8 bg-transparent"
                      onClick={(e) => handleMarkAsPaid(client.id, e)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1.5" />
                      <span className="text-xs font-semibold">Concluir</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 flex-1 h-8 bg-transparent"
                      onClick={(e) => handleSendWhatsApp(client, e)}
                      disabled={!client.phone}
                    >
                      <MessageCircle className="h-3 w-3 mr-1.5" />
                      <span className="text-xs font-semibold">Cobrar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}