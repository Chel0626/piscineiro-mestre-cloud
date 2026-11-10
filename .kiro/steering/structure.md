---
inclusion: always
---

# Estrutura e convenções — Piscineiro Mestre

## Árvore do monorepo

```
piscineiro-mestre/
├── apps/
│   ├── owner/              # Dashboard admin (Next.js)
│   │   ├── middleware.ts   # Auth server-side (createServerClient + getUser) — PADRÃO DE OURO
│   │   └── src/
│   │       ├── app/        # rotas App Router: clients, revenue, routes, team, reports, settings, api/
│   │       └── lib/        # auth.ts (requireTenantRole), supabase.ts
│   ├── pwa/                # App operacional dos técnicos (Next.js PWA)
│   │   └── src/            # app/, components/, hooks/, context/, lib/, config/
│   └── super-admin/        # Administração global
├── packages/
│   └── shared/             # @piscineiro/shared
│       └── src/            # auth/, hooks/, utils/ (mappers), validators/ (Zod)
├── supabase/
│   └── schema.sql          # Schema consolidado (tabelas, RLS, triggers, views)
└── README.md
```

## Convenções

- Imports com alias `@/*` → `./src/*` em cada app.
- Rotas de API: Next.js App Router (`route.ts` com handlers GET/POST/DELETE).
- `apps/owner` NÃO importa de `@piscineiro/shared` hoje; helpers do owner ficam em `apps/owner/src/lib/`.
- `@piscineiro/shared` é transpilado via `transpilePackages` no next.config de cada app.
- Validação de formulários e payloads: Zod.
- Componentes de UI seguem o padrão Radix + Tailwind (estilo shadcn).

## Higiene do repositório

- Não versionar: `node_modules/`, `.next/`, `.env*`, `supabase/.temp/`.
- Não acumular scripts SQL dispersos — o schema vive só em `supabase/schema.sql`.
- Evitar docs internos de rascunho na raiz; manter o `README.md` como documentação principal.
