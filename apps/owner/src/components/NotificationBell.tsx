'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  link_url: string;
  created_at: string;
}

export function NotificationBell() {
  const { tenant } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!tenant?.id) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) setNotifications(data);
    };

    fetchNotifications();

    const channel = supabase
      .channel('realtime_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
          filter: `tenant_id=eq.${tenant.id}`
        },
        async (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          
          const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          try {
            await fetch('https://pafbfgkncrfkrcjengot.supabase.co/functions/v1/send-admin-push', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'apikey': anonKey || '',
                'Authorization': `Bearer ${anonKey}` 
              },
              body: JSON.stringify({ record: newNotif })
            });
          } catch (err) {
            console.error("Erro ao disparar push:", err);
          }

          toast(newNotif.title, {
            description: newNotif.message,
            icon: <Bell className="h-4 w-4 text-blue-500" />,
            action: {
              label: 'Ver',
              onClick: () => router.push(newNotif.link_url || '/')
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id, router]);

  const markAsRead = async (id: string, url: string | null) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from('admin_notifications').update({ is_read: true }).eq('id', id);
    setIsOpen(false);
    if (url) router.push(url);
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications([]);
    await supabase.from('admin_notifications').update({ is_read: true }).in('id', unreadIds);
    toast.success('Todas as notificações marcadas como lidas');
  };

  // --- FUNÇÃO DE ATIVAÇÃO ATUALIZADA COM RASTREAMENTO E INSTALAÇÃO DO SW ---
  const enablePushNotifications = async () => {
    console.log("=== INICIANDO SISTEMA DE PUSH ===");
    console.log("ID do Tenant:", tenant?.id);

    if (!tenant?.id) {
      console.warn("Aviso: Tentativa de registrar sem ID de Tenant.");
      toast.error('Identificação da empresa ausente. Aguarde um instante ou recarregue.');
      return;
    }

    try {
      console.log("Passo 1: Validando APIs do navegador...");
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.error("Este navegador não possui as APIs de Service Worker ou Push.");
        toast.error('Este navegador não suporta notificações Push nativas.');
        return;
      }

      console.log("Passo 2: Solicitando permissão para receber alertas...");
      const permission = await Notification.requestPermission();
      console.log("Resposta da permissão:", permission);
      
      if (permission !== 'granted') {
        toast.info('Permissão para notificações não concedida.');
        return;
      }

      console.log("Passo 3: Registrando e localizando Service Worker...");
      // 1. Instala o arquivo sw.js que criamos na pasta public
      await navigator.serviceWorker.register('/sw.js');
      
      // 2. Aguarda ele ficar pronto com timeout de segurança
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout: O Service Worker demorou muito para carregar.")), 5000))
      ]) as ServiceWorkerRegistration;
      console.log("Service Worker obtido com sucesso:", registration);
      
      console.log("Passo 4: Lendo chave pública VAPID...");
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; 
      console.log("Status da chave VAPID:", vapidPublicKey ? "Localizada" : "Não encontrada (undefined)");
      
      if (!vapidPublicKey) {
         toast.error('Chave de configuração VAPID ausente no ambiente.');
         return;
      }

      console.log("Passo 5: Registrando assinatura com as chaves do navegador...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });
      console.log("Assinatura obtida das chaves locais:", subscription);

      const subJson = subscription.toJSON();

      console.log("Passo 6: Buscando credenciais do usuário autenticado...");
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) console.error("Erro interno do Supabase Auth:", authError);
      
      if (!user) {
        console.warn("Aviso: Nenhum usuário autenticado encontrado.");
        toast.error('Sua sessão expirou. Faça o login novamente.');
        return;
      }
      console.log("Usuário ativo localizado:", user.id);

      console.log("Passo 7: Gravando dados no banco de dados...");
      const { error: dbError } = await supabase.from('admin_push_subscriptions').upsert({
        tenant_id: tenant.id, 
        user_id: user.id, 
        endpoint: subJson.endpoint,
        auth: subJson.keys?.auth,
        p256dh: subJson.keys?.p256dh
      }, { onConflict: 'endpoint' }); 

      if (dbError) {
        console.error("Erro ao gravar dados no Supabase:", dbError);
        throw dbError;
      }

      console.log("=== SISTEMA ATIVADO COM SUCESSO ===");
      toast.success('Notificações push ativadas neste dispositivo!');

    } catch (error: any) {
      console.error('Falha crítica na ativação:', error);
      toast.error(`Erro ao ativar: ${error.message || error}`);
    }
  };

  return (
    <div className="relative z-50">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setIsOpen(!isOpen)}>
        <Bell className="h-5 w-5 text-slate-600" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Notificações</h3>
            
            <div className="flex gap-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  enablePushNotifications();
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"
                title="Ativar alertas neste dispositivo"
              >
                <Bell className="h-3 w-3" /> Ativar
              </button>
              
              {notifications.length > 0 && (
                <button onClick={markAllAsRead} className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Limpar tudo
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nenhuma notificação nova.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <div key={notif.id} onClick={() => markAsRead(notif.id, notif.link_url)} className="p-4 hover:bg-slate-50 cursor-pointer transition-colors">
                    <p className="text-sm font-bold text-slate-900 mb-1">{notif.title}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
}