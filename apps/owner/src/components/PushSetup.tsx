'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { BellRing } from 'lucide-react';
import { toast } from 'sonner';

// Substitua pela sua Chave Pública VAPID
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''; 

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSetup() {
  const { tenant, user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Este navegador não suporta notificações Push.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Permissão para notificações negada.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      const subData = JSON.parse(JSON.stringify(subscription));

      // Salva a inscrição no Supabase
      const { error } = await supabase.from('admin_push_subscriptions').insert({
        tenant_id: tenant?.id,
        user_id: user?.id,
        endpoint: subData.endpoint,
        p256dh: subData.keys.p256dh,
        auth: subData.keys.auth
      });

      if (error && error.code !== '23505') throw error; // Ignora erro se já existir (código de duplicidade)
      
      setIsSubscribed(true);
      toast.success('Notificações Push ativadas com sucesso no seu celular!');

    } catch (error) {
      console.error('Erro ao assinar push:', error);
      toast.error('Erro ao configurar notificações.');
    }
  };

  return (
    <Button 
      onClick={subscribeToPush} 
      variant={isSubscribed ? "outline" : "default"}
      className="gap-2"
    >
      <BellRing className="h-4 w-4" />
      {isSubscribed ? 'Push Configurado' : 'Ativar Alertas no Celular'}
    </Button>
  );
}