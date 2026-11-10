# syntax=docker/dockerfile:1

# =============================================================================
# Dockerfile de producao para o monorepo Next.js (app alvo: apps/owner)
# Multi-stage build sobre Node.js 20 Alpine, output standalone do Next.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1 - deps: instala as dependencias do monorepo (cacheavel)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
# libc6-compat cobre libs nativas que algumas deps esperam no Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia apenas os manifests para maximizar o cache de camadas.
# O npm ci no monorepo precisa do lockfile da raiz + dos package.json dos workspaces.
COPY package.json package-lock.json ./
COPY apps/owner/package.json ./apps/owner/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm ci --no-audit --no-fund

# -----------------------------------------------------------------------------
# Stage 2 - builder: compila o app owner e gera o standalone
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Reaproveita node_modules do stage de deps
COPY --from=deps /app/node_modules ./node_modules
# Copia o restante do codigo-fonte do monorepo
COPY . .

# Desliga telemetria e builda apenas o workspace owner
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace @piscineiro/owner

# -----------------------------------------------------------------------------
# Stage 3 - runner: imagem final minima, so com o standalone
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuario sem privilegios para rodar a aplicacao
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copia os assets publicos e o build standalone (inclui apenas os node_modules necessarios).
# No monorepo com outputFileTracingRoot na raiz, o standalone preserva a estrutura apps/owner.
COPY --from=builder --chown=nextjs:nodejs /app/apps/owner/public ./apps/owner/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/owner/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/owner/.next/static ./apps/owner/.next/static

USER nextjs

EXPOSE 3000

# O server.js do standalone fica no caminho do app dentro da estrutura do monorepo
CMD ["node", "apps/owner/server.js"]
