---
inclusion: always
---

# Stack e comandos — Piscineiro Mestre

## Stack

- Monorepo npm Workspaces: `apps/*` + `packages/*`.
- Next.js 15 (App Router), React 19, TypeScript.
- Tailwind CSS, Radix UI, lucide-react, recharts, date-fns.
- PWA: Redux Toolkit + Immer, react-hook-form + Zod, Sentry.
- Backend: Supabase (PostgreSQL, Auth, Row Level Security, Storage, Realtime).
- Deploy web: Vercel.

## Apps

- `apps/owner` — dashboard administrativo (owner/solo/superadmin). App de produção na Vercel.
- `apps/pwa` — app operacional dos técnicos (worker). Instalável como PWA.
- `apps/super-admin` — administração global.
- `packages/shared` (`@piscineiro/shared`) — auth, hooks, utils/mappers, validators (Zod) compartilhados.

## Banco de dados

- Schema único e versionado em `supabase/schema.sql` (tabelas, RLS, triggers, views). É a fonte de verdade. Não criar scripts SQL dispersos; alterar o schema consolidado.
- Tabelas principais: tenants, profiles, tenant_members, clients, ad_hoc_clients, visits, invoices, product_requests, temporary_reschedules.

## Comandos (rodar a partir da raiz do monorepo)

```bash
# instalar dependências
npm install --no-audit --no-fund

# dev do dashboard Owner
npm run dev --workspace @piscineiro/owner

# dev do PWA
npm run dev --workspace @piscineiro/pwa

# build do Owner (app de produção)
npm run build --workspace @piscineiro/owner

# checagem de tipos do Owner
npx tsc --noEmit -p apps/owner/tsconfig.json
```

## Avisos de ambiente (Windows)

- O caminho do projeto NÃO pode conter espaços nem parênteses. O Turbopack falha com `os error 123` nesses casos. Manter o projeto em um caminho limpo (ex.: `C:\dev\piscineiro-mestre`).
- Usar PowerShell (pwsh): separador de comandos é `;`, não `&&`. Variáveis de ambiente: `$env:NOME`.
- O PWA tem erros de TypeScript pré-existentes e `ignoreBuildErrors: true` no next.config. O Owner NÃO ignora erros de tipo.
