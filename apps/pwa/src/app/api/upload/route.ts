import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hora

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Autenticacao do chamador
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ error: 'Token de autorizacao necessario' }, { status: 401 });
    }

    const token = authHeader.slice(7).trim();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Token invalido' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const clientId = formData.get('clientId') as string | null;

    if (!file || !clientId) {
      return NextResponse.json({ error: 'Arquivo e clientId sao obrigatorios' }, { status: 400 });
    }

    // 2. Autorizacao contextual: o usuario precisa ter vinculo com o cliente.
    //    Busca o cliente e verifica se o usuario e o worker responsavel
    //    OU membro do tenant ao qual o cliente pertence.
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, tenant_id, worker_id')
      .eq('id', clientId)
      .maybeSingle();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente nao encontrado' }, { status: 404 });
    }

    let autorizado = client.worker_id === user.id;

    if (!autorizado && client.tenant_id) {
      const { data: membership } = await supabase
        .from('tenant_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('tenant_id', client.tenant_id)
        .maybeSingle();
      autorizado = !!membership;
    }

    if (!autorizado) {
      return NextResponse.json({ error: 'Sem permissao para este cliente' }, { status: 403 });
    }

    // 3. Upload no bucket privado
    const buffer = await file.arrayBuffer();
    const fileName = `${clientId}/${user.id}/${new Date().toISOString()}_${file.name}`;

    const { error: uploadError } = await supabase
      .storage
      .from('diagnostics')
      .upload(fileName, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      throw uploadError;
    }

    // 4. URL assinada com expiracao (bucket privado, nao expor publicamente)
    const { data: signed, error: signedError } = await supabase
      .storage
      .from('diagnostics')
      .createSignedUrl(fileName, SIGNED_URL_TTL_SECONDS);

    if (signedError || !signed) {
      throw signedError ?? new Error('Falha ao gerar URL assinada');
    }

    return NextResponse.json({ imageUrl: signed.signedUrl, path: fileName });

  } catch (error) {
    console.error('Erro no upload de diagnostico:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
