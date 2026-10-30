'use client';

import { supabase } from '@/lib/supabase';
import { ClientWithPayment } from '@piscineiro/shared';

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
      
    } catch (error) {
      console.error('Erro ao marcar pagamento:', error);
      throw error;
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
      
    } catch (error) {
      console.error('Erro ao marcar como vencido:', error);
      throw error;
    }
  };

  const getPaymentStatus = (client: ClientWithPayment) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Se já pagou este mês
    if (client.lastPaymentDate) {
      const lastPayment = new Date(client.lastPaymentDate);
      if (lastPayment.getMonth() === currentMonth && lastPayment.getFullYear() === currentYear) {
        return 'paid';
      }
    }

    // Se está marcado como inadimplente
    if (client.paymentStatus === 'overdue') {
      return 'overdue';
    }

    // Verifica vencimento
    const dueDay = client.paymentDueDate || 10;
    
    if (currentDay > dueDay) {
      return 'overdue';
    }

    if (currentDay === dueDay) {
      return 'due_today';
    }

    return 'pending';
  };

  return { markAsPaid, markAsOverdue, getPaymentStatus };
}
