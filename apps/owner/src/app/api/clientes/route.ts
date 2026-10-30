// app/api/clientes/route.ts
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import {
    getBearerToken,
    requireTenantRole,
    createAdminClient,
    AuthorizationError,
} from '@/lib/auth';

// Schema de validacao do corpo. tenant_id NAO e aceito do cliente:
// ele e sempre derivado do servidor via tenant_members.
const createClientSchema = z.object({
    name: z.string().trim().min(1).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    neighborhood: z.string().optional(),
    poolVolume: z.union([z.number(), z.string()]).optional(),
    visitDays: z.array(z.string()).optional(),
    visitFrequency: z.string().optional(),
    serviceValue: z.union([z.number(), z.string()]).optional(),
    paymentDueDate: z.union([z.number(), z.string()]).optional(),
    planType: z.string().optional(),
    contractStartDate: z.string().optional(),
    nextRenewalDate: z.string().optional(),
    workerId: z.string().optional(),
    worker_id: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        // 1. Autenticacao + autorizacao (apenas owner/solo/superadmin criam clientes)
        const token = getBearerToken(request);
        const { tenantId } = await requireTenantRole(token, ['owner', 'solo', 'superadmin']);

        // 2. Validacao do corpo
        const rawBody = await request.json();
        const parsed = createClientSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados invalidos.' }, { status: 400 });
        }
        const body = parsed.data;

        const supabaseAdmin = createAdminClient();

        // 3. Email tecnico a partir do telefone (ou identificador unico)
        const telefoneLimpo = body.phone ? body.phone.replace(/\D/g, '') : '';
        const identificadorUnico = telefoneLimpo || `cliente_${Date.now()}`;
        const fakeEmail = `${identificadorUnico}@clientes.piscineiromestre.app`;

        // 4. Senha aleatoria forte (sem valor fixo previsivel)
        const senhaAleatoria = `${randomUUID()}${randomUUID()}`;

        // 5. Cria o usuario de acesso
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: fakeEmail,
            password: senhaAleatoria,
            email_confirm: true,
        });

        if (authError || !authData?.user) {
            console.error('Erro no Auth ao criar cliente:', authError);
            return NextResponse.json({ error: 'Erro ao criar credenciais de acesso.' }, { status: 400 });
        }

        // 6. Monta o registro. tenant_id vem do servidor, NUNCA do body.
        const dadosDoCliente: Record<string, unknown> = {
            tenant_id: tenantId,
            worker_id: body.workerId || body.worker_id,
            auth_user_id: authData.user.id,
            name: body.name || 'Cliente sem nome',
            address: body.address,
            neighborhood: body.neighborhood,
            phone: body.phone,
            pool_volume: body.poolVolume,
            visit_days: body.visitDays,
            visit_frequency: body.visitFrequency,
            service_value: body.serviceValue,
            payment_due_date: body.paymentDueDate,
            plan_type: body.planType,
            contract_start_date: body.contractStartDate,
            next_renewal_date: body.nextRenewalDate,
            active: true,
        };

        // Remove campos vazios para o banco aplicar os defaults
        Object.keys(dadosDoCliente).forEach((key) => {
            const value = dadosDoCliente[key];
            if (value === undefined || value === null || value === '') {
                delete dadosDoCliente[key];
            }
        });

        // 7. Insere o cliente
        const { data: novoCliente, error: dbError } = await supabaseAdmin
            .from('clients')
            .insert([dadosDoCliente])
            .select()
            .single();

        if (dbError) {
            // Rollback: remove o usuario de Auth criado para nao sujar a base
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            console.error('Erro ao inserir cliente no banco:', dbError.message);
            return NextResponse.json({ error: 'Nao foi possivel criar o cliente.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, client: novoCliente });

    } catch (error) {
        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Erro geral na criacao de cliente:', error);
        return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
    }
}
