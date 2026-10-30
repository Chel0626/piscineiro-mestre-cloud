// app/api/cleanup/route.ts
import { NextResponse } from 'next/server';
import {
    getBearerToken,
    requireTenantRole,
    createAdminClient,
    AuthorizationError,
} from '@/lib/auth';

// Operacao destrutiva: exige POST autenticado (owner/solo/superadmin).
export async function POST(request: Request) {
    try {
        // 1. Autenticacao + autorizacao antes de qualquer operacao destrutiva
        const token = getBearerToken(request);
        await requireTenantRole(token, ['owner', 'solo', 'superadmin']);

        const supabaseAdmin = createAdminClient();

        // 2. Buckets alvo da limpeza
        const BUCKETS_PARA_LIMPAR = ['pool-photos'];

        // 3. Data limite (15 dias atras)
        const quinzeDiasAtras = new Date();
        quinzeDiasAtras.setDate(quinzeDiasAtras.getDate() - 15);

        let totalDeletado = 0;
        let arquivosDeletados: string[] = [];

        // 4. Varredura recursiva por arquivos antigos
        async function buscarArquivosVelhos(bucket: string, path: string = ''): Promise<string[]> {
            let arquivosAntigos: string[] = [];

            const { data, error } = await supabaseAdmin.storage.from(bucket).list(path);
            if (error || !data) return [];

            for (const item of data) {
                const itemPath = path ? `${path}/${item.name}` : item.name;

                // No Supabase, item sem id e pasta; com id e arquivo
                if (!item.id) {
                    const arquivosDaSubpasta = await buscarArquivosVelhos(bucket, itemPath);
                    arquivosAntigos = [...arquivosAntigos, ...arquivosDaSubpasta];
                } else {
                    if (new Date(item.created_at) < quinzeDiasAtras) {
                        arquivosAntigos.push(itemPath);
                    }
                }
            }
            return arquivosAntigos;
        }

        // 5. Varredura e delecao em lotes de 100
        for (const bucket of BUCKETS_PARA_LIMPAR) {
            const arquivosParaDeletar = await buscarArquivosVelhos(bucket);

            if (arquivosParaDeletar.length > 0) {
                for (let i = 0; i < arquivosParaDeletar.length; i += 100) {
                    const lote = arquivosParaDeletar.slice(i, i + 100);
                    const { error: deleteError } = await supabaseAdmin.storage.from(bucket).remove(lote);
                    if (deleteError) throw deleteError;
                }

                totalDeletado += arquivosParaDeletar.length;
                arquivosDeletados = [...arquivosDeletados, ...arquivosParaDeletar];
            }
        }

        if (totalDeletado === 0) {
            return NextResponse.json({ message: 'Nenhuma imagem com mais de 15 dias encontrada.' });
        }

        return NextResponse.json({
            success: true,
            message: `Faxina concluida: ${totalDeletado} imagens antigas removidas.`,
            deletedCount: totalDeletado,
        });

    } catch (error) {
        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Erro na rota de cleanup:', error);
        return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
    }
}
