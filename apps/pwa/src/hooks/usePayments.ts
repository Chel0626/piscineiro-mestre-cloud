'use client';

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ClientWithPayment } from '@/lib/validators/clientSchema';

export function usePayments() {
  const markAsPaid = async (clientId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { error } = await supabase
        .from('clients')
        .update({
          last_payment_date: today,
          payment_status: 'paid'
        })
        .eq('id', clientId);
      
      if (error) throw error;
      
      toast.success('Pagamento marcado como realizado!');
    } catch (error) {
      console.error('Erro ao marcar pagamento:', error);
      toast.error('Erro ao marcar pagamento');
    }
  };

  const markAsOverdue = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          payment_status: 'overdue'
        })
        .eq('id', clientId);
      
      if (error) throw error;
      
      toast.success('Cliente marcado como inadimplente');
    } catch (error) {
      console.error('Erro ao marcar como vencido:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getPaymentStatus = (client: ClientWithPayment) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Se tem status manual definido como pago
    if (client.paymentStatus === 'paid' && client.lastPaymentDate) {
      const paymentDate = new Date(client.lastPaymentDate + 'T00:00:00');
      const paymentMonth = paymentDate.getMonth();
      const paymentYear = paymentDate.getFullYear();
      
      // Se o pagamento foi neste mês e ano
      if (paymentMonth === currentMonth && paymentYear === currentYear) {
        return 'paid';
      }
    }

    // Se está marcado como vencido manualmente
    if (client.paymentStatus === 'overdue') {
      return 'overdue';
    }

    // Verifica vencimento automático
    const dueDay = parseInt(client.paymentDate || '5'); // Dia de vencimento padrão
    
    // Se já passou do dia de vencimento e não pagou este mês
    if (currentDay > dueDay) {
      // Verifica se já pagou este mês (caso o status não esteja 'paid' por algum motivo)
      if (client.lastPaymentDate) {
        const lastPayment = new Date(client.lastPaymentDate + 'T00:00:00');
        if (lastPayment.getMonth() === currentMonth && lastPayment.getFullYear() === currentYear) {
          return 'paid';
        }
      }
      return 'overdue';
    }

    return 'pending';
  };

  return { markAsPaid, markAsOverdue, getPaymentStatus };
}
