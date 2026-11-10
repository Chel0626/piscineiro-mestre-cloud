---
inclusion: always
---

# Produto — Piscineiro Mestre

Plataforma SaaS multi-tenant para empresas e profissionais autônomos de manutenção de piscinas. Gerencia clientes, rotas de visitas, controle químico da água, financeiro e equipe.

## Perfis de usuário (roles dentro de cada tenant)

- **owner** — dono de empresa. Usa o dashboard Owner. Gerencia clientes, equipe, financeiro e aprova visitas.
- **solo** — profissional autônomo. Usa o dashboard Owner. Acumula funções de dono e técnico.
- **worker** — técnico de campo. Usa o PWA. Executa visitas, registra parâmetros da água e solicita produtos.
- **superadmin** — administração global da plataforma.

## Domínio

- **Clientes**: mensalistas (contrato recorrente) e avulsos (serviço esporádico), com dados da piscina (volume, filtro, troca de areia).
- **Visitas**: registro de parâmetros químicos (pH, cloro, alcalinidade), checklist, produtos usados e foto. Fluxo de aprovação: `pending_review` → `approved` / `rejected`.
- **Financeiro**: faturas, status de pagamento por cliente, receita por período. Planos mensal, semestral e anual.
- **Rotas**: agenda de visitas por dia da semana e por técnico, com reagendamentos temporários.

## Princípio central

Isolamento entre tenants é o requisito mais importante. Todo dado pertence a um tenant; nenhuma operação pode vazar dados ou permitir escrita entre tenants. Em caso de dúvida de design, priorize o isolamento multi-tenant.
