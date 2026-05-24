# 01 — Estrutura de repositório

> Monorepo gerenciado por **pnpm workspaces + Turborepo**. Stack confirmada no master.

## Árvore completa

```
plugfacil-funil/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # lint + typecheck + test em PRs
│       ├── deploy-preview.yml        # deploy preview Vercel
│       └── deploy-prod.yml           # deploy produção via tag v*.*.*
├── .vscode/
│   ├── settings.json                 # Biome como formatter padrão
│   └── extensions.json
├── apps/
│   └── web/                          # Next.js 15 (App Router) — ÚNICA app pública
│       ├── public/
│       │   ├── produtos/
│       │   │   └── pdf-mercado-v1.pdf    # PDF do Produto 1 (versionado)
│       │   ├── og/                       # imagens OG por página
│       │   └── favicon.ico
│       ├── src/
│       │   ├── app/                      # App Router (RSC por padrão)
│       │   │   ├── (marketing)/          # rotas públicas com layout marketing
│       │   │   │   ├── page.tsx          # home / produto PDF
│       │   │   │   ├── plano-de-negocio/
│       │   │   │   │   └── page.tsx      # LP do Produto 2
│       │   │   │   ├── obrigado/
│       │   │   │   │   └── page.tsx      # thank-you pós-checkout
│       │   │   │   ├── termos/
│       │   │   │   ├── privacidade/
│       │   │   │   └── layout.tsx        # header/footer marketing
│       │   │   ├── (app)/                # rotas autenticadas
│       │   │   │   ├── conta/
│       │   │   │   │   ├── page.tsx      # dashboard
│       │   │   │   │   ├── compras/
│       │   │   │   │   └── plano/
│       │   │   │   │       ├── novo/
│       │   │   │   │       │   ├── page.tsx           # wizard etapa 1
│       │   │   │   │       │   ├── fotos/page.tsx     # etapa 2
│       │   │   │   │       │   └── confirmar/page.tsx # etapa 3 (confirmar análise padrão)
│       │   │   │   │       └── [id]/
│       │   │   │   │           ├── page.tsx           # acompanhamento processamento
│       │   │   │   │           └── resultado/page.tsx # BP final + CTA reunião
│       │   │   │   └── layout.tsx        # header autenticado
│       │   │   ├── api/                  # Route Handlers
│       │   │   │   ├── webhooks/
│       │   │   │   │   ├── stripe/route.ts            # idempotente
│       │   │   │   │   ├── cal/route.ts               # agendamentos
│       │   │   │   │   └── inngest/route.ts           # registry de funções
│       │   │   │   ├── bp/
│       │   │   │   │   ├── submit/route.ts            # POST: cria BP, dispara Inngest
│       │   │   │   │   └── [id]/status/route.ts       # GET: SSE polling
│       │   │   │   ├── upload/route.ts                # signed URL Supabase Storage
│       │   │   │   └── health/route.ts
│       │   │   ├── auth/
│       │   │   │   ├── callback/route.ts              # Supabase OAuth callback
│       │   │   │   └── login/page.tsx                 # magic link
│       │   │   ├── layout.tsx                         # root layout
│       │   │   ├── error.tsx
│       │   │   ├── not-found.tsx
│       │   │   └── globals.css                        # Tailwind v4
│       │   ├── components/
│       │   │   ├── ui/                                # shadcn/ui (button, input, etc)
│       │   │   ├── marketing/                         # hero, pricing, faq
│       │   │   ├── bp/                                # wizard, upload, status, viewer
│       │   │   └── shared/                            # header, footer, toast
│       │   ├── lib/
│       │   │   ├── supabase/
│       │   │   │   ├── server.ts                      # cliente RSC
│       │   │   │   ├── client.ts                      # cliente browser
│       │   │   │   └── admin.ts                       # service-role (server-only)
│       │   │   ├── stripe.ts
│       │   │   ├── inngest.ts                         # client emit
│       │   │   ├── posthog.ts
│       │   │   ├── auth.ts                            # helpers de sessão
│       │   │   └── utils.ts
│       │   ├── server/                                # lógica server-only
│       │   │   ├── actions/                           # Server Actions
│       │   │   │   ├── bp.ts
│       │   │   │   └── auth.ts
│       │   │   └── queries/                           # leitura DB com cache
│       │   ├── styles/
│       │   ├── middleware.ts                          # auth + rate limit
│       │   └── env.ts                                 # Zod-validated env
│       ├── next.config.ts
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       ├── biome.json
│       ├── package.json
│       └── vitest.config.ts
├── packages/
│   ├── db/                           # Drizzle ORM + schema + migrations
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── profiles.ts
│   │   │   │   ├── purchases.ts
│   │   │   │   ├── business-plans.ts
│   │   │   │   ├── lead-handoffs.ts
│   │   │   │   ├── frota-ev.ts
│   │   │   │   ├── tarifas.ts
│   │   │   │   ├── events.ts
│   │   │   │   └── index.ts
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   ├── migrations/                                # SQL gerado pelo Drizzle
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   ├── ai/                           # wrapper Anthropic + prompts
│   │   ├── src/
│   │   │   ├── client.ts                              # Anthropic SDK config
│   │   │   ├── prompts/
│   │   │   │   ├── vaga-vision.ts                     # VAGA_VISION_V1
│   │   │   │   ├── padrao-vision.ts                   # PADRAO_VISION_V1 (com salvaguardas)
│   │   │   │   ├── bp-sumario.ts
│   │   │   │   ├── bp-analise.ts
│   │   │   │   └── bp-riscos.ts
│   │   │   ├── schemas/                               # Zod schemas para outputs
│   │   │   ├── runners/                               # funções de execução
│   │   │   └── cost-tracking.ts                       # logging custo por chamada
│   │   └── package.json
│   ├── integrations/                 # APIs externas
│   │   ├── src/
│   │   │   ├── aneel/                                 # tarifa por distribuidora
│   │   │   ├── nasa-power/                            # irradiação solar
│   │   │   ├── open-charge-map/                       # carregadores existentes
│   │   │   ├── plugshare/                             # scraper opcional
│   │   │   ├── via-cep/
│   │   │   ├── google-maps/                           # geocoding
│   │   │   └── shared/                                # cache, retry, telemetry
│   │   └── package.json
│   ├── bp-engine/                    # matemática financeira pura
│   │   ├── src/
│   │   │   ├── cenarios/
│   │   │   │   ├── convencional.ts
│   │   │   │   ├── solar.ts
│   │   │   │   └── mercado-livre.ts
│   │   │   ├── financial.ts                           # NPV, IRR, payback
│   │   │   ├── utilization.ts                         # estimativa de uso
│   │   │   ├── catalogo.ts                            # carregadores e custos
│   │   │   ├── recomendacao.ts                        # config recomendada
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── tests/                                     # Vitest — cobertura > 80%
│   │   └── package.json
│   ├── pdf-renderer/                 # geração do BP final em PDF
│   │   ├── src/
│   │   │   ├── templates/
│   │   │   │   ├── bp-template.tsx                    # React-PDF ou Playwright
│   │   │   │   └── components/
│   │   │   ├── render.ts
│   │   │   └── upload.ts                              # envia para Supabase Storage
│   │   └── package.json
│   └── shared/                       # tipos, constantes, utils compartilhados
│       ├── src/
│       │   ├── types.ts
│       │   ├── constants.ts
│       │   └── zod-schemas.ts
│       └── package.json
├── infra/
│   ├── inngest/                      # funções Inngest (orquestração BP)
│   │   ├── src/
│   │   │   ├── bp-orchestrator.ts                     # bp.process
│   │   │   ├── jobs/
│   │   │   │   ├── analyze-vaga.ts
│   │   │   │   ├── analyze-padrao.ts
│   │   │   │   ├── fetch-aneel.ts
│   │   │   │   ├── fetch-nasa.ts
│   │   │   │   ├── fetch-carregadores.ts
│   │   │   │   ├── fetch-frota.ts
│   │   │   │   ├── compute-scenarios.ts
│   │   │   │   ├── generate-narrative.ts
│   │   │   │   ├── render-pdf.ts
│   │   │   │   ├── deliver.ts
│   │   │   │   └── create-handoff.ts
│   │   │   ├── crons/
│   │   │   │   ├── etl-aneel.ts                       # diário
│   │   │   │   └── digest-vendas.ts                   # diário Slack
│   │   │   └── email/
│   │   │       └── nutrition-sequence.ts              # pdf-to-bp
│   │   └── package.json
│   └── supabase/
│       ├── migrations/                                # SQL espelhado de packages/db
│       ├── seed.sql                                   # dados iniciais (tarifas embed)
│       └── config.toml
├── docs/
│   ├── spec/                         # esta pasta — referência viva
│   │   └── (arquivos 00 a 10)
│   ├── runbooks/                     # como agir em incidentes
│   │   ├── bp-stuck.md
│   │   ├── stripe-webhook-failed.md
│   │   └── lead-not-delivered.md
│   ├── decisions/                    # ADRs (Architecture Decision Records)
│   │   ├── 0001-monorepo-pnpm.md
│   │   ├── 0002-supabase-vs-neon.md
│   │   └── 0003-inngest-vs-trigger.md
│   └── README.md
├── scripts/
│   ├── seed-tarifas.ts                                # popula tarifas_distribuidora
│   ├── seed-frota.ts                                  # popula frota_ev_municipio
│   ├── test-bp-e2e.ts                                 # roda BP completo com mocks
│   └── verify-env.ts                                  # checa env vars no boot
├── .env.example                                       # template de variáveis
├── .gitignore
├── .nvmrc                                             # 22 LTS
├── biome.json                                         # raiz
├── package.json                                       # workspaces
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json                                      # base estendida
└── README.md
```

## Convenções

### Imports
- `@plugfacil/db` → `packages/db`
- `@plugfacil/ai` → `packages/ai`
- `@plugfacil/bp-engine` → `packages/bp-engine`
- `@plugfacil/integrations` → `packages/integrations`
- `@plugfacil/shared` → `packages/shared`
- `@plugfacil/pdf-renderer` → `packages/pdf-renderer`
- `@/...` dentro de `apps/web` → `apps/web/src/...`

### TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true` em todos os pacotes
- Path aliases configurados em `tsconfig.base.json`
- Zod para todo input externo (forms, API, integrações, output de IA)

### Boundary rules
- `apps/web` PODE importar de qualquer `package`
- `packages/*` NUNCA importam de `apps/*`
- `packages/bp-engine` é puro (sem I/O, sem fetch, sem DB) — só matemática
- `packages/integrations` é o único lugar que faz `fetch` externo (exceto webhooks)
- `infra/inngest` orquestra os outros — não contém lógica de negócio

### Server-only
Arquivos em `apps/web/src/server/` e `apps/web/src/lib/supabase/admin.ts` declaram `import 'server-only'` no topo. Falha em build se forem importados de Client Components.

### Comandos pnpm

```bash
pnpm dev                  # apps/web em watch + inngest dev server
pnpm build                # build de tudo via Turbo
pnpm test                 # vitest em todos os packages
pnpm test:e2e             # Playwright contra preview
pnpm lint                 # biome check
pnpm typecheck            # tsc --noEmit em workspaces
pnpm db:generate          # drizzle-kit generate
pnpm db:migrate           # aplica migrations no Supabase
pnpm db:seed              # roda scripts/seed-*.ts
```

## Setup inicial (Sprint 1, tarefa 1)

```bash
# 1. Criar repo
mkdir plugfacil-funil && cd plugfacil-funil
git init
pnpm init

# 2. pnpm-workspace.yaml
cat > pnpm-workspace.yaml <<EOF
packages:
  - 'apps/*'
  - 'packages/*'
  - 'infra/*'
EOF

# 3. Instalar Turbo
pnpm add -Dw turbo @biomejs/biome typescript

# 4. Scaffold Next.js
pnpm create next-app@latest apps/web --typescript --tailwind --app --src-dir --import-alias "@/*" --use-pnpm --no-eslint

# 5. Criar packages vazios
for p in db ai integrations bp-engine pdf-renderer shared; do
  mkdir -p packages/$p/src
  cat > packages/$p/package.json <<EOF
{
  "name": "@plugfacil/$p",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
EOF
done

# 6. Criar infra
mkdir -p infra/inngest/src infra/supabase

# 7. Configurar Biome (substitui ESLint+Prettier)
pnpm biome init

# 8. Primeiro commit
git add . && git commit -m "chore: scaffold monorepo"
```

## Critério de aceite do Sprint 1, tarefa 1

- [ ] `pnpm install` roda sem erros
- [ ] `pnpm dev` sobe Next.js em http://localhost:3000
- [ ] `pnpm typecheck` retorna 0 erros
- [ ] `pnpm lint` retorna 0 erros
- [ ] Commit inicial no GitHub com README explicando setup
