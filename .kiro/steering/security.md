---
inclusion: always
---

# Segurança e multi-tenancy — Piscineiro Mestre

Estas regras são obrigatórias em qualquer código novo que toque dados ou autenticação. O isolamento entre tenants é inegociável.

## Rotas de API privilegiadas (que usam SUPABASE_SERVICE_ROLE_KEY)

Toda rota que usa a service role key DEVE, antes de qualquer operação:

1. Ler o token do header `Authorization: Bearer <token>`; se ausente/mal formado → 401.
2. Validar a sessão com `supabase.auth.getUser(token)`.
3. Resolver a associação do usuário em `tenant_members` e confirmar o papel permitido.
4. Derivar o `tenant_id` SEMPRE do servidor (de `tenant_members`). NUNCA aceitar `tenant_id` do corpo/params da requisição.
5. Validar o corpo com Zod.
6. NÃO retornar mensagens internas do Supabase ao cliente. Logar o detalhe no servidor e devolver mensagem genérica.

Usar o helper `apps/owner/src/lib/auth.ts` (`requireTenantRole(token, allowedRoles)`) para isso. A referência de ouro de auth server-side é `apps/owner/middleware.ts`.

## Autenticação

- Middleware deve validar a sessão de verdade com `getUser()` (via `@supabase/ssr`), nunca apenas checar a existência de cookies.
- Nunca usar senha fixa/previsível. Gerar senha aleatória forte (`crypto.randomUUID()` ou `crypto.randomBytes`) ao criar usuários.

## Storage

- Arquivos sensíveis (ex.: fotos de diagnóstico, bucket `diagnostics`) são privados. Servir por URL assinada com expiração (`createSignedUrl`), nunca `getPublicUrl`.
- Antes de upload associado a um `clientId`, confirmar que o usuário tem vínculo com aquele cliente (é `worker_id` do cliente OU membro do tenant do cliente).

## Autorização de papéis

- Owner pode gerenciar a equipe, mas remoção via `/api/workers` só pode apagar alvos com role `worker` (nunca outro owner/solo/superadmin).
- RLS no banco é a primeira camada; a validação server-side nas rotas é defesa em profundidade. As duas devem coexistir.

## Padrão de banco

- Consultas de escrita/leitura devem incluir `tenant_id` explicitamente quando possível, além de confiar na RLS, para tornar a intenção clara.
