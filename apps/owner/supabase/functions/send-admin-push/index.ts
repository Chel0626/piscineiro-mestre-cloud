import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

webpush.setVapidDetails(
  'mailto:contato@piscineiro.app', 
  Deno.env.get('ADMIN_VAPID_PUBLIC_KEY') ?? '',
  Deno.env.get('ADMIN_VAPID_PRIVATE_KEY') ?? ''
);

serve(async (req: Request) => {
  // Responde ao preflight do navegador (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json();
    const notification = payload.record;

    if (!notification || !notification.tenant_id) {
      return new Response("Payload inválido", { headers: corsHeaders, status: 400 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: subscriptions, error } = await supabaseAdmin
      .from('admin_push_subscriptions')
      .select('endpoint, auth, p256dh')
      .eq('tenant_id', notification.tenant_id);

    if (error || !subscriptions || subscriptions.length === 0) {
      return new Response("Nenhuma inscrição encontrada", { headers: corsHeaders, status: 200 });
    }

    const pushMessage = JSON.stringify({
      title: notification.title,
      body: notification.message,
      url: notification.link_url || '/'
    });

    const sendPromises = subscriptions.map((sub: any) => {
      return webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { auth: sub.auth, p256dh: sub.p256dh }
      }, pushMessage).catch((err: any) => {
        console.error('Erro no envio:', err);
      });
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
})