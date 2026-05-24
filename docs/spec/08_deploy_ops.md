# 08 — Deploy, ambientes e operação

> Tudo que não é código de produto, mas sem o quê o produto não roda em produção.

---

## 1. Três ambientes

| Ambiente | Branch | URL | Banco | Stripe | Resend |
|----------|--------|-----|-------|--------|--------|
| **Development** | local | localhost:3000 | Supabase local (`supabase start`) | test mode | test mode |
| **Preview** | toda PR / branch `develop` | `*.vercel.app` | Supabase staging | test mode | test mode |
| **Production** | tag `v*.*.*` | plugfacil.com.br | Supabase prod | live | live |

Variável `APP_ENV` (`development | preview | production`) controla:
- Resposta a webhooks (em dev/preview, Stripe webhooks só aceitam eventos de test mode)
- Cron schedules (em preview não rodam)
- Slack channel de alertas (canal `#dev` vs `#prod-alertas`)
- Logging level (`debug` em dev, `info` em prod)

---

## 2. Provedores e contratos

| Serviço | Plano | Justificativa | Custo mensal estimado |
|---------|-------|---------------|------------------------|
| Vercel | Pro | Edge runtime, analytics, preview deployments ilimitados | US$ 20 |
| Supabase | Pro | RLS, backup diário 7 dias, sem pause em inatividade | US$ 25 |
| Anthropic API | pay-per-use | Sonnet 4.6 para Vision + geração | R$ 3-8 / BP processado |
| Resend | Pro | 50k emails/mês, domínio custom, SPF/DKIM | US$ 20 |
| Inngest | Hobby até 50k runs/mês, Pro acima | Orquestração com retry e replay | US$ 0-50 |
| Stripe | pay-per-use | 4,99% + R$ 0,39 por transação no Brasil | variável |
| Sentry | Team | Captura erros + traces | US$ 26 |
| PostHog | Free até 1M events | Produto analytics + feature flags | US$ 0 |
| Axiom | Free até 500GB | Logs estruturados | US$ 0 |
| Upstash Redis | Pay-as-you-go | Cache + rate limit + dedupe | US$ 0-10 |
| Cloudflare | Free | DNS, proxy do scraper PlugShare | US$ 0 |
| OpenChargeMap | Free 25k req/dia | Suficiente com cache | US$ 0 |
| Google Maps | $200 grátis/mês | Geocoding | US$ 0-30 |
| Cal.com | Free self-host ou US$ 12 cloud | Agendamento comercial | US$ 0-12 |

**Custo fixo mensal: ~US$ 130 (R$ ~700) + custo variável por BP de R$ 3-8 + Stripe fees**

Margem por BP de R$ 290: R$ 290 - R$ 8 (Claude) - R$ 14 (Stripe) - R$ 1 (Resend+Vercel rateio) = **~R$ 267 (92%)**.

---

## 3. Domínios e DNS

- `plugfacil.com.br` → Vercel (apex + www)
- `mail.plugfacil.com.br` → CNAME para Resend (DKIM)
- DNS records:
  ```
  TXT @  "v=spf1 include:_spf.google.com include:amazonses.com -all"
  MX  @  10 inbound.resend.com
  TXT resend._domainkey  [valor fornecido pelo Resend]
  TXT @  "google-site-verification=..."
  ```
- **DMARC**: `_dmarc.plugfacil.com.br` TXT `"v=DMARC1; p=quarantine; rua=mailto:dmarc@plugfacil.com.br"` (começar com `p=none`, subir para `quarantine` após 30 dias estável)

---

## 4. CI/CD — GitHub Actions

### `.github/workflows/ci.yml` (PRs e push em develop/main)

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [develop, main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - name: Verificar env example
        run: pnpm tsx scripts/verify-env.ts --check-example
```

### `.github/workflows/deploy-prod.yml` (tag v*)

```yaml
name: Deploy Production
on:
  push:
    tags: ['v*.*.*']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Aplicar migrations
        run: pnpm db:migrate
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
      - name: Deploy Inngest
        run: pnpm dlx inngest-cli deploy
        env:
          INNGEST_SIGNING_KEY: ${{ secrets.INNGEST_SIGNING_KEY }}
      - name: Deploy Vercel
        run: pnpm dlx vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
      - name: Notificar Slack
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_VENDAS }} \
            -d '{"text":"🚀 Deploy ${{ github.ref_name }} em produção"}'
```

**Regra**: Vercel não auto-promove para produção. Promoção é via tag git (`git tag v1.2.3 && git push --tags`).

---

## 5. Migrations

- Geradas pelo Drizzle Kit: `pnpm db:generate`
- Comitar SQL gerado em `packages/db/migrations/` E espelhar em `infra/supabase/migrations/`
- Aplicar em produção apenas via CI (nunca local apontando para prod)
- **Antes de toda migration destrutiva**: backup manual disparado via Supabase dashboard + janela de manutenção comunicada

---

## 6. Backups e recuperação

| O quê | Como | Retenção | Como restaurar |
|-------|------|----------|----------------|
| Banco Postgres | Backup automático Supabase Pro | 7 dias PITR | Dashboard Supabase → Point-in-time recovery |
| Storage (fotos, PDFs) | Replicação automática + snapshot semanal manual | 30 dias | Restore do snapshot via Supabase |
| Código | GitHub + tags imutáveis | infinito | `git checkout v1.2.3` |
| Env vars | 1Password + backup criptografado | infinito | Manual |

**RTO** (tempo de recuperação): 4 horas para incidente catastrófico
**RPO** (perda máxima de dados): 1 hora

Drill obrigatório a cada 90 dias: restaurar staging a partir de backup de prod e validar.

---

## 7. Observabilidade

### Sentry (erros)
- Captura erros de servidor e cliente
- Tag por release (commit SHA)
- Alertas Slack para erros não tratados em prod
- Integração com PRs (mostra erros novos por release)

### PostHog (produto)
- Eventos chave (lista em `06_integracoes.md`)
- Funis: home → checkout → compra; pdf-buyer → bp-submit; bp-completed → cta-meeting
- Dashboard "Funil PlugFácil" pinned na home

### Axiom (logs)
- Logs estruturados em JSON via `pino`
- Query SQL-like
- Alertas:
  - `level=error AND env=production` → Slack imediato
  - `name=anthropic AND cost_brl > 30` → Slack (BP caro)
  - `name=stripe AND event=payment_intent.failed` → Slack

### Health checks
- `GET /api/health` retorna `{ ok: true, version, deps: { db, supabase, anthropic, stripe } }`
- Uptime monitorado por Better Stack (free tier) ou Vercel próprio
- Status page público em `status.plugfacil.com.br` (Vercel + Better Stack)

---

## 8. Alertas — quando acordar alguém

| Trigger | Severidade | Canal | Quem | SLA resposta |
|---------|-----------|-------|------|--------------|
| Site fora do ar | P0 | PagerDuty/Slack | Plantão | 15min |
| Webhook Stripe falhando | P0 | Slack #prod-alertas | Tech lead | 30min |
| Inngest job falha 3x consecutivas em prod | P1 | Slack | Tech lead | 2h |
| BP `processing` há mais de 4h | P1 | Slack | Tech lead | 4h |
| Custo Claude > R$ 30 em um BP único | P2 | Slack | Tech lead | 24h |
| Erro de checkout > 5% | P1 | Slack | Tech lead | 2h |
| Email bounce rate > 2% | P2 | Slack | Marketing | 24h |
| Cron ETL ANEEL falhou | P2 | Slack | Tech lead | 24h |

---

## 9. Runbooks (em `docs/runbooks/`)

Documentar pelo menos:

### `bp-stuck.md` — BP travado em processing
1. Abrir Inngest dashboard, buscar `business_plan_id`
2. Identificar qual job falhou
3. Se Vision: verificar foto (corrompida? muito pesada?) → re-trigger ou marcar `review_needed`
4. Se integração externa: verificar status do provedor → re-trigger
5. Se cálculo: bug → criar issue, marcar `failed`, refund automático
6. Comunicar cliente (Resend) com transparência

### `stripe-webhook-failed.md` — Webhook Stripe falhando
1. Verificar Stripe dashboard → Webhooks → ver tentativas
2. Reprocessar evento manualmente: `pnpm tsx scripts/reprocess-stripe.ts <event_id>`
3. Se rotacionou secret: atualizar `STRIPE_WEBHOOK_SECRET` no Vercel
4. Validar idempotência: cada evento Stripe tem `id` único; nossa tabela `events` tem unique constraint

### `lead-not-delivered.md` — Lead não chegou ao comercial
1. Verificar `lead_handoffs` no DB: tem registro?
2. Verificar Slack webhook: funcionando?
3. Verificar email do comercial: chegou?
4. Re-trigger: `pnpm tsx scripts/resend-handoff.ts <handoff_id>`

### `cost-spike.md` — Custo Claude explodiu
1. Identificar BP problemático em Axiom (filtro `name=anthropic`)
2. Ver prompt e tamanho de saída
3. Se prompt está sendo abusado (usuário injetando texto enorme): adicionar validação de tamanho no upload
4. Cap de tokens por seção: revisar limites em `packages/ai/src/runners/`

### `data-deletion-request.md` — Pedido LGPD
1. Validar identidade do solicitante (email da conta + segundo fator opcional)
2. Confirmar entendimento (exclusão é definitiva após 30 dias)
3. Acionar endpoint `/api/me/delete`
4. Em 30 dias, hard delete roda automaticamente via Inngest
5. Enviar confirmação por email

---

## 10. Secrets management

- **Nunca** comitar secrets no git
- `.env.local` no `.gitignore`
- Produção: Vercel Environment Variables (encrypted at rest)
- Inngest: dashboard próprio
- Compartilhamento entre time: 1Password (vault "PlugFácil Engenharia")
- Rotação obrigatória:
  - `STRIPE_WEBHOOK_SECRET`: a cada 6 meses
  - `INTERNAL_API_TOKEN`: a cada 3 meses
  - `SUPABASE_SERVICE_ROLE_KEY`: apenas se vazamento (regenera tudo)
  - `ANTHROPIC_API_KEY`: anual ou em saída de membro do time

---

## 11. Custos — como monitorar margem

Dashboard PostHog ou Axiom dedicado: **"Margem por BP"**

Métricas:
- Custo Claude médio por BP (objetivo: < R$ 8)
- Custo Stripe médio por BP (objetivo: ~ R$ 14 fixo a 5%)
- Custo de infraestrutura rateado (custo fixo mensal / BPs do mês)
- Margem bruta por BP (objetivo: > 85%)
- Margem líquida considerando atribuição de tráfego (objetivo: > 60% com CPL R$ 20)

Alertas:
- Custo Claude por BP > R$ 15 → investigar
- Margem mensal < 70% → revisar precificação ou otimizar

---

## 12. Roadmap de hardening pós-MVP

Não bloquear lançamento, mas planejar:

| Item | Quando | Por quê |
|------|--------|---------|
| WAF / rate limit avançado | Após primeira tentativa de abuso visível | Proteger uploads e Vision |
| Bug bounty (Open Bug Bounty / HackerOne) | Após 100 BPs vendidos | Validação externa |
| Penetration test | Antes de fechar contrato grande com WEG/TUPI | Compliance B2B |
| Disaster recovery exercise | Trimestral | Garantir RTO/RPO |
| ISO 27001 simplificada | Quando faturamento > R$ 500k/mês | Vendas enterprise |

---

## 13. Comunicação de incidente

Em caso de incidente que afete dados pessoais ou disponibilidade:

1. **0-15min**: contenção (tirar do ar se necessário, revogar credenciais comprometidas)
2. **15-60min**: investigação e dimensionamento (quantos usuários afetados?)
3. **1-4h**: comunicação aos afetados via email + nota no status page
4. **24-72h**: se aplicável, notificação à ANPD (template em `docs/runbooks/anpd-notification.md`)
5. **7 dias**: post-mortem público (transparência) com timeline, causa-raiz e ações preventivas
