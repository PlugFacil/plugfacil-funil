# Spec PlugFácil Funil — leia primeiro

Este diretório contém a especificação completa para o **Claude Code** construir o funil de vendas da PlugFácil Mobilidade Elétrica de forma autônoma.

## O que você está construindo

**NÃO** são 3 produtos isolados. É **1 funil de qualificação** com 3 estágios para vender franquia/parceria PlugFácil (ticket R$ 23k-160k+):

```
Anúncio → LP → PDF (R$ 49,90)  ─┐
                                 ├→ Reunião comercial → Contrato PlugFácil
Anúncio → LP → BP IA (R$ 290) ──┘     (handoff humano)
```

O BP entregue sempre termina com CTA para reunião com comercial PlugFácil.

## Ordem de leitura

| # | Arquivo | Quando ler |
|---|---------|-----------|
| 1 | `00_PROMPT_MASTER_CLAUDE_CODE.md` | **Comece aqui.** Visão geral, decisões, faseamento. |
| 2 | `01_estrutura_repo.md` | Antes de criar a primeira pasta. |
| 3 | `02_email_sequences.md` | Sprints 1-2 (transacionais + nutrição). |
| 4 | `03_bp_pipeline.md` | Sprint 3 em diante (orquestração BP). |
| 5 | `04_bp_engine_math.md` | Sprint 4 (matemática financeira). |
| 6 | `05_bp_prompt_template.md` | Sprints 3-5 (prompts Vision + narrativa). |
| 7 | `06_integracoes.md` | Sprints 4-5 (ANEEL, NASA POWER, OCM, PlugShare). |
| 8 | `07_lgpd.md` | Sprint 6 (não pode publicar sem isso). |
| 9 | `08_deploy_ops.md` | Sprint 6 (deploy, observabilidade). |
| 10 | `09_env_vars.md` | Sprint 1 (setup) + sempre que adicionar integração. |
| 11 | `10_pdf_content.md` | Sprint 1, tarefa 8 (geração do PDF). |

## Princípios não-negociáveis

1. **Faseamento obrigatório**: 6 sprints de 2 semanas. NÃO construa tudo de uma vez.
2. **Critério de avanço**: 1 venda real (ou simulação ponta-a-ponta validada por humano) por sprint antes de avançar.
3. **Salvaguardas jurídicas no Vision do padrão elétrico**: sempre subestimar 30%, disclaimer destacado, confirmação manual obrigatória, oferta de ART como upsell.
4. **Honestidade sobre integrações**: ABVE não tem API, PlugShare é scraping frágil, tarifas vêm da ANEEL CKAN. Fallbacks embutidos desde o sprint 1.
5. **LGPD não é opcional**: sem compliance documentado (LGPD doc + endpoints `/api/me/data` e `/api/me/delete`), não vai para produção.
6. **Margem por BP > 85%**: monitorar custo Claude por BP em dashboard. Alerta Slack se passar R$ 30 em um BP único.
7. **Handoff humano > automação total**: o BP termina com agendamento de reunião. Comercial PlugFácil fecha a venda.

## Como usar com o Claude Code

```bash
# 1. Salvar este pacote inteiro em docs/spec/ do repo novo
mkdir -p plugfacil-funil/docs/spec
cp -r <esta-pasta>/* plugfacil-funil/docs/spec/

# 2. Iniciar Claude Code na raiz
cd plugfacil-funil
claude

# 3. Primeiro prompt:
> Leia docs/spec/00_PROMPT_MASTER_CLAUDE_CODE.md por completo, e depois 
> docs/spec/01_estrutura_repo.md. Em seguida, execute o Sprint 1, tarefa 1 
> (setup do monorepo). Pare ao final dessa tarefa para revisão.
```

A partir daí, o Claude Code segue o faseamento documentado, parando ao fim de cada tarefa para validação.

## Stack confirmada

- **Frontend**: Next.js 15 (App Router) + TypeScript estrito + Tailwind v4 + shadcn/ui
- **Backend**: Next.js Route Handlers + Server Actions + Inngest (orquestração)
- **Banco**: Supabase (Postgres + Auth + Storage + RLS) + Drizzle ORM
- **IA**: Anthropic Claude Sonnet 4.6 (`claude-sonnet-4-5-20250929`)
- **Pagamento**: Stripe (com Pix BR)
- **Email**: Resend
- **Cache/Rate limit**: Upstash Redis
- **Observabilidade**: Sentry + PostHog + Axiom
- **Hosting**: Vercel (Pro)
- **Workers**: Inngest + Cloudflare Workers (scraper opcional)
- **Toolchain**: pnpm + Turborepo + Biome + Vitest + Playwright

## Métricas de norte

| Métrica | Meta |
|---------|------|
| CPL (anúncio → lead) | < R$ 25 |
| Conversão Lead → PDF | 5-10% |
| Conversão PDF → BP | 3-8% |
| Conversão BP → reunião agendada | 15-30% |
| Custo Claude por BP | < R$ 8 |
| Margem bruta por BP | > 85% |
| Tempo de processamento BP (UX) | < 5 min |

## Decisões já tomadas (não revise sem motivo)

- Monorepo pnpm + Turbo (vs polyrepo) — economia de tempo de setup
- Supabase (vs Neon + Auth separado) — simplicidade
- Drizzle (vs Prisma) — type safety + edge runtime compatível
- Inngest (vs Trigger.dev / BullMQ) — DX superior, retry e replay nativos
- Anthropic Sonnet 4.6 (vs GPT-4o / Gemini) — qualidade superior em pt-BR e Vision
- Stripe (vs Pagar.me / Mercado Pago) — suporte Pix + DX + webhooks confiáveis
- Cal.com (vs Calendly) — open source, custo zero, integração via webhook

## Próximas decisões (após MVP)

Documentadas em `docs/decisions/` como ADRs assim que tomadas:

- Quando migrar PDF estático para PDF gerado por usuário (com dados específicos)
- Quando ativar `cenario_mercado_livre_visible` (feature flag)
- Quando habilitar WhatsApp opt-in (precisa de validação Meta Business)
- Quando criar Produto 3 (consultoria síncrona)
