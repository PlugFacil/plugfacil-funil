# ADR 0003 — Inngest vs Trigger.dev / BullMQ

**Status:** Aceito  
**Data:** 2026-05-24

## Decisão

Usar Inngest para orquestração de jobs (pipeline do BP).

## Motivo

DX superior, retry/replay nativos, sem infraestrutura de fila para gerenciar, integração nativa com Vercel.
