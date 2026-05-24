# ADR 0002 — Supabase vs Neon + Auth separado

**Status:** Aceito  
**Data:** 2026-05-24

## Decisão

Usar Supabase (Postgres + Auth + Storage + RLS integrados).

## Motivo

Supabase entrega Auth, Storage, RLS e Postgres em um serviço — menos configuração, menos serviços para gerenciar no MVP.
