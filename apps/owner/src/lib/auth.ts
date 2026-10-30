import { createClient } from '@supabase/supabase-js';

/**
 * Papeis validos dentro de um tenant.
 */
export type TenantRole = 'owner' | 'solo' | 'superadmin' | 'worker';

/**
 * Resultado de uma autorizacao bem-sucedida.
 */
export interface TenantAuthContext {
  userId: string;
  email: string | undefined;
  tenantId: string;
  role: TenantRole;
}

/**
 * Erro de autorizacao com o status HTTP apropriado (401/403).
 */
export class AuthorizationError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Extrai o token Bearer do header Authorization de uma requisicao.
 * Lanca AuthorizationError(401) se ausente ou mal formatado.
 */
export function getBearerToken(request: Request): string {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    throw new AuthorizationError(401, 'Token de autorizacao ausente.');
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new AuthorizationError(401, 'Token de autorizacao invalido.');
  }
  return token;
}

/**
 * Valida o token no Supabase, resolve a associacao do usuario em tenant_members
 * e confirma que o papel esta entre os permitidos.
 *
 * O tenant_id e sempre derivado do servidor a partir de tenant_members;
 * nunca deve ser aceito do corpo/params da requisicao.
 *
 * @throws AuthorizationError 401 (sessao invalida) ou 403 (sem papel permitido).
 */
export async function requireTenantRole(
  token: string,
  allowedRoles: TenantRole[]
): Promise<TenantAuthContext> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    throw new AuthorizationError(401, 'Sessao invalida.');
  }

  const { data: member, error: memberError } = await supabase
    .from('tenant_members')
    .select('role, tenant_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (memberError || !member) {
    throw new AuthorizationError(403, 'Usuario sem associacao a um tenant.');
  }

  if (!allowedRoles.includes(member.role as TenantRole)) {
    throw new AuthorizationError(403, 'Permissao insuficiente.');
  }

  return {
    userId: user.id,
    email: user.email,
    tenantId: member.tenant_id,
    role: member.role as TenantRole,
  };
}

/**
 * Cliente Supabase com a service role key. Use apenas em rotas server-side
 * ja autenticadas e autorizadas via requireTenantRole.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
