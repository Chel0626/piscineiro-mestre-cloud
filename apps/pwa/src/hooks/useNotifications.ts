'use client';

import { useState, useEffect } from 'react';
import { useRoutines } from './useRoutines';
import { supabase } from '@/lib/supabase';

export interface ProductNotification {
  clientId: string;
  clientName: string;
  products: string[];
}

export interface DailyNotification {
  date: string;
  clients: ProductNotification[];
}

export function useNotifications() {
  const { groupedClients } = useRoutines();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('08:00');
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Verificar permissão atual de notificação
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Função para solicitar permissão de notificação
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    }
    return false;
  };

  // Função para buscar produtos solicitados pelos clientes do dia
  const getTodayProductRequests = async (): Promise<DailyNotification> => {
    const today = new Date().toISOString().split('T')[0];
    const dayName = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
    const todayClients = groupedClients[dayName] || [];
    const clientsWithProducts: ProductNotification[] = [];

    for (const client of todayClients) {
      try {
        // Buscar produtos solicitados nas últimas visitas
        const { data: visits, error } = await supabase
          .from('visits')
          .select('products_to_request')
          .eq('client_id', client.id)
          .not('products_to_request', 'is', null)
          .order('date', { ascending: false })
          .limit(5);

        if (error) {
          console.error(`Erro ao buscar visitas para cliente ${client.name}:`, error);
          continue;
        }

        const allProducts = new Set<string>();
        
        if (visits) {
          visits.forEach((visit: any) => {
            if (visit.products_to_request) {
               // Assuming it's a comma-separated string or already an array if it was TEXT[] but it's TEXT in SQL
               // Handle both cases
               if (typeof visit.products_to_request === 'string') {
                 visit.products_to_request.split(',').forEach((p: string) => allProducts.add(p.trim()));
               } else if (Array.isArray(visit.products_to_request)) {
                 visit.products_to_request.forEach((p: string) => allProducts.add(p));
               }
            }
          });
        }

        if (allProducts.size > 0) {
          clientsWithProducts.push({
            clientId: client.id,
            clientName: client.name,
            products: Array.from(allProducts)
          });
        }
      } catch (error) {
        console.error(`Erro ao buscar produtos para cliente ${client.name}:`, error);
      }
    }

    return {
      date: today,
      clients: clientsWithProducts
    };
  };

  // Função para enviar notificação
  const sendNotification = (notification: DailyNotification) => {
    if (permission !== 'granted' || notification.clients.length === 0) return;

    const totalClients = notification.clients.length;
    const totalProducts = notification.clients.reduce((sum, client) => sum + client.products.length, 0);

    const notificationOptions: NotificationOptions = {
      body: `${totalClients} cliente(s) com ${totalProducts} produto(s) para levar hoje`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: 'daily-products',
      requireInteraction: true
    };

    const notif = new Notification('Produtos para Levar Hoje', notificationOptions);
    
    notif.onclick = () => {
      window.focus();
      // Navegar para página de produtos do dia
      window.location.href = '/dashboard/produtos-do-dia';
    };
  };

  // Função para agendar notificação diária
  const scheduleNotification = () => {
    if (!notificationsEnabled || permission !== 'granted') return;
    // Implementação do agendamento (simplificada)
    // Em um PWA real, isso seria feito via Service Worker ou Push API
    console.log('Notificação agendada para', notificationTime);
  };

  return {
    notificationsEnabled,
    setNotificationsEnabled,
    notificationTime,
    setNotificationTime,
    permission,
    requestNotificationPermission,
    getTodayProductRequests,
    sendNotification,
    scheduleNotification
  };
}
