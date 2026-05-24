# ADR 0001 — Monorepo com pnpm + Turborepo

**Status:** Aceito  
**Data:** 2026-05-24

## Contexto

Precisamos de um repo que suporte múltiplos pacotes (app Next.js, engine de BP, integrações, PDF renderer) com build incremental e type-checking compartilhado.

## Decisão

Usar pnpm workspaces + Turborepo.

## Consequências

- Build incremental via Turbo cache
- Imports entre pacotes com aliases `@plugfacil/*`
- pnpm é obrigatório (não usar npm/yarn)
- `allowBuilds` deve listar explicitamente pacotes com scripts nativos
