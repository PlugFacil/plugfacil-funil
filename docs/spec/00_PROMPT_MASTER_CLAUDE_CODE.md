# PLUGFÁCIL — FUNIL DE ELETROMOBILIDADE
## Spec técnica completa para implementação autônoma via Claude Code

> **Como usar este documento:** Salve todos os arquivos `.md` desta spec dentro do repositório `plugfacil-funil/docs/spec/`. Inicie o Claude Code dentro da raiz do repositório. Cole o conteúdo deste arquivo como **primeiro prompt** ao Claude Code. Os demais arquivos são referenciados ao longo da execução.

---

## 0. FRAMING ESTRATÉGICO — LEIA ANTES DE QUALQUER LINHA DE CÓDIGO

### O produto real
Não estamos construindo "3 produtos". Estamos construindo **um funil de qualificação automatizado** cujo objetivo final é alimentar o pipeline comercial da **franquia/parceria/cessão PlugFácil** (ticket de R$ 23.000 a R$ 160.000+).

| Estágio | Nome interno | Preço | Função real no funil |
|---------|--------------|-------|----------------------|
| Tripwire | **PDF Mercado** | R$ 49,90 | Captura email + valida intenção financeira mínima + educa o lead |
| Core | **BP com IA** | R$ 290 | Coleta dados profundos (endereço, fotos, perfil energético) → entrega documento que demonstra expertise → captura lead ultraqualificado |
| Upsell (futuro) | **Consultoria 1:1** | A definir | Validação final e fechamento de contrato de franquia/cessão |

**Implicação técnica crítica:** o BP entregue ao cliente do estágio 2 **sempre termina** com CTA para "agendar conversa com a PlugFácil para implementação turn-key". Esse handoff é o produto. Sem ele, R$ 290 é uma transação. Com ele, R$ 290 é o custo de aquisição de um lead que pode virar R$ 23k–160k+ de contrato.

### Métricas de norte
- **CPL (custo por lead) no Produto 1** — deve ficar abaixo de R$ 25 para o tripwire pagar o tráfego
- **Conversão PDF → BP** — meta inicial 3–8%
- **Conversão BP → reunião agendada com comercial** — meta inicial 15–30%
- **Conversão reunião → contrato de franquia/cessão assinado** — meta 5–15%
- **LTV médio do lead que entrou pelo funil** — calculado e exposto no dashboard interno

### Pressupostos honestos sobre integrações externas
Você (Claude Code) **não deve assumir** que as APIs abaixo existem e funcionam como o cliente descreveu. Implemente cada uma com a estratégia indicada:

| Fonte mencionada | Realidade verificável | Estratégia |
|------------------|------------------------|-----------|
| ABVE / BVE (frota EV por cidade) | Sem API pública conhecida. ABVE publica relatórios mensais em PDF | Implementar como tabela estática `frota_ev_municipio` atualizada manualmente a cada release dos boletins da ABVE; expor admin para atualização |
| PlugShare (carregadores próximos) | Sem API pública oficial. Tem mobile app + web | Implementar scraping defensivo respeitando robots.txt + cache agressivo; fallback para tabela estática `carregadores_proximos` baseada no OpenChargeMap (que **tem** API pública) |
| "Tupi para tarifa média" | Tupi é plataforma de recarga, não fonte de tarifas. Tarifas são da ANEEL | Usar dados públicos da **ANEEL** via dados.gov.br (PRORET, "Tarifas Homologadas das Distribuidoras") |
| Irradiação solar | Não mencionada, mas necessária para o cenário solar | Usar CRESESB (público) ou NASA POWER API (pública e gratuita) |

### Salvaguardas inegociáveis para a análise de imagem
A spec da feature "foto do padrão de entrada → IA estima disjuntor → IA recomenda potência do carregador" envolve risco real de causar curto-circuito, sobrecarga, incêndio. Toda implementação deve:

1. Sempre apresentar resultado da Vision como **estimativa preliminar não vinculante**
2. Sempre subestimar conservadoramente (regra: usar 70% da capacidade estimada)
3. Sempre exigir confirmação manual do usuário antes de avançar
4. Sempre incluir disclaimer destacado em UI e PDF do BP: *"Esta estimativa não substitui projeto elétrico assinado por engenheiro habilitado. Dimensionamento final requer vistoria presencial e ART."*
5. Sempre oferecer upsell de ART do engenheiro PlugFácil ao final do BP
6. Toda análise é logada para auditoria

### Faseamento obrigatório
Não implemente tudo de uma vez. Cada sprint entrega valor sozinho e valida o próximo:

```
Sprint 1 (sem 1-2):  Landing P1 + Checkout + Entrega PDF + Email confirmação
Sprint 2 (sem 3-4):  Nutrição P1 + Upsell automático para P2 + Área do cliente
Sprint 3 (sem 5-6):  Formulário P2 + Uploads + Vision da foto da vaga
Sprint 4 (sem 7-8):  Engine de cenários energéticos + Integrações fáceis (ANEEL, NASA POWER)
Sprint 5 (sem 9-10): Vision do padrão (com salvaguardas) + Scraping PlugShare/OpenChargeMap
Sprint 6 (sem 11-12): Geração PDF do BP estilizado + CTA franquia + Dashboard interno + Observabilidade
```

**Não avance para o próximo sprint sem fechar o anterior em produção e ter 1 venda real.**

---

## 1. STACK TÉCNICA OBRIGATÓRIA

### Frontend / Backend
- **Framework:** Next.js 15 (App Router) + TypeScript estrito
- **Estilização:** Tailwind CSS v4 + shadcn/ui (componentes base) + Lucide icons
- **Forms:** React Hook Form + Zod (validação compartilhada front/back)
- **Estado client-side:** Zustand para estado global leve; nada de Redux

### Dados
- **Banco principal:** Supabase (Postgres 15 + Row Level Security + Auth + Storage)
- **Cache / rate limit:** Upstash Redis
- **Vector store (futuro, sprint 6+):** pgvector dentro do Supabase

### Pagamentos
- **Internacional/Cartão:** Stripe (já suporta Pix no Brasil)
- **Brasil-first com split (opcional sprint 4+):** Asaas ou Pagar.me
- **Para infoproduto (P1) com afiliados (opcional):** Hotmart ou Kiwify via webhook → não recomendado no MVP

### IA
- **LLM principal:** Anthropic Claude Sonnet 4.6 (`claude-sonnet-4-5-20250929` ou modelo mais novo disponível) via API oficial
- **Vision:** mesma API Claude (capacidade nativa) — não usar serviços externos
- **Geração de embeddings (sprint 6+):** `voyage-3` ou OpenAI `text-embedding-3-small`

### Email
- **Transacional:** Resend
- **Sequências de nutrição:** Resend Broadcasts ou Loops.so

### Mensageria assíncrona
- **Jobs/queues:** Inngest (recomendado pelo DX) ou QStash. Toda análise de imagem, scraping e geração de PDF roda como job assíncrono, **nunca** no request HTTP do usuário.

### Geração de PDF do Business Plan
- **Library:** `@react-pdf/renderer` para layout React → PDF, ou Playwright server-side renderizando rota Next.js especial e capturando como PDF (mais flexível, recomendado)

### Observabilidade
- **Errors:** Sentry
- **Analytics produto:** PostHog (events + funnels + session replay)
- **Logs estruturados:** pino + Axiom (ou Logtail)
- **Uptime:** BetterStack

### Hosting
- **App:** Vercel (Pro plan — necessário para functions de longa duração)
- **Banco / Auth / Storage:** Supabase (Pro plan)
- **Edge functions de scraping:** Vercel ou Cloudflare Workers

### Dev tooling
- **Package manager:** pnpm
- **Lint/format:** Biome (substitui ESLint + Prettier)
- **Testes unitários:** Vitest
- **Testes E2E:** Playwright (apenas fluxos críticos: checkout, geração de BP)
- **CI:** GitHub Actions
- **Secrets:** Vercel env vars + Doppler (opcional) — nunca `.env` commitado

---

## 2. ESTRUTURA DO MONOREPO

```
plugfacil-funil/
├── apps/
│   └── web/                          # Next.js 15 app
│       ├── app/
│       │   ├── (marketing)/          # Rotas públicas (LPs, checkout)
│       │   │   ├── page.tsx          # Home / LP principal
│       │   │   ├── pdf-mercado/      # LP do Produto 1
│       │   │   ├── plano-de-negocio/ # LP do Produto 2
│       │   │   └── obrigado/         # Páginas de sucesso pós-compra
│       │   ├── (app)/                # Área logada do cliente
│       │   │   ├── dashboard/
│       │   │   ├── meu-bp/           # Formulário do Produto 2 + status
│       │   │   └── downloads/
│       │   ├── (admin)/              # Dashboard interno PlugFácil
│       │   │   ├── leads/
│       │   │   ├── bps/
│       │   │   └── conteudo/         # CMS leve (atualizar frota ABVE)
│       │   ├── api/
│       │   │   ├── webhooks/
│       │   │   │   ├── stripe/route.ts
│       │   │   │   └── inngest/route.ts
│       │   │   ├── bp/               # Endpoints do BP
│       │   │   ├── leads/
│       │   │   └── health/route.ts
│       │   └── layout.tsx
│       ├── components/
│       ├── lib/
│       └── public/
├── packages/
│   ├── db/                           # Schema Supabase + migrations + types
│   ├── ai/                           # Wrappers Anthropic + prompts versionados
│   ├── integrations/                 # ANEEL, NASA POWER, OpenChargeMap, PlugShare scraper
│   ├── bp-engine/                    # Engine de cenários + cálculos financeiros
│   ├── pdf-renderer/                 # React-PDF components para o BP final
│   └── shared/                       # Tipos, schemas Zod, utils
├── infra/
│   ├── inngest/                      # Definições de jobs
│   └── supabase/                     # SQL migrations + RLS policies
├── docs/
│   └── spec/                         # Esta spec
├── .github/workflows/
├── package.json
├── pnpm-workspace.yaml
├── biome.json
└── tsconfig.base.json
```

---

## 3. SCHEMA DO BANCO (POSTGRES / SUPABASE)

> Arquivo SQL completo em `infra/supabase/migrations/001_initial_schema.sql`. Esquema resumido aqui — RLS policies obrigatórias em todas as tabelas que armazenam dados de cliente.

```sql
-- ============================================================
-- USUÁRIOS E AUTENTICAÇÃO
-- ============================================================
-- Supabase auth.users já existe. Estendemos com profiles.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,                          -- WhatsApp BR formatado E.164
  cpf_cnpj text,
  city text,
  state text,                          -- UF
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Score de qualificação para o comercial PlugFácil
  lead_score int default 0,
  lead_stage text default 'cold'       -- cold | pdf_buyer | bp_buyer | meeting_scheduled | client
    check (lead_stage in ('cold','pdf_buyer','bp_buyer','meeting_scheduled','client','lost')),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  consent_lgpd_at timestamptz,
  consent_marketing_at timestamptz
);

-- ============================================================
-- COMPRAS E PAGAMENTOS
-- ============================================================
create type product_kind as enum ('pdf_mercado','business_plan','consultoria');
create type purchase_status as enum ('pending','paid','refunded','failed');

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete restrict,
  product product_kind not null,
  status purchase_status not null default 'pending',
  amount_cents int not null,
  currency text not null default 'BRL',
  stripe_payment_intent_id text unique,
  stripe_checkout_session_id text unique,
  paid_at timestamptz,
  refunded_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index on purchases(profile_id, status);
create index on purchases(product, status);

-- ============================================================
-- BUSINESS PLAN (PRODUTO 2)
-- ============================================================
create type bp_status as enum (
  'draft',           -- usuário ainda preenchendo
  'submitted',       -- enviado, aguardando processamento
  'processing',      -- jobs rodando
  'review_needed',   -- algum outlier detectado, fila para revisão humana
  'completed',       -- PDF gerado e disponível
  'failed'
);

create table public.business_plans (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id),
  profile_id uuid not null references public.profiles(id),
  status bp_status not null default 'draft',

  -- INPUTS COLETADOS DO USUÁRIO
  endereco_cep text,
  endereco_logradouro text,
  endereco_numero text,
  endereco_complemento text,
  endereco_bairro text,
  endereco_municipio text,
  endereco_uf text,
  endereco_lat double precision,
  endereco_lng double precision,

  tipo_local text check (tipo_local in (
    'condominio_residencial','condominio_comercial','posto_combustivel',
    'shopping','supermercado','hotel_pousada','estacionamento',
    'concessionaria','outros'
  )),

  -- Análise visual da vaga
  foto_vaga_path text,                -- Supabase Storage path
  vaga_analise jsonb,                 -- output da Vision

  -- Análise elétrica do padrão
  foto_padrao_path text,
  padrao_analise jsonb,               -- output da Vision (estimativas)
  padrao_input_manual jsonb,          -- override manual obrigatório

  -- Cenário energético escolhido
  cenarios_selecionados text[] default array['convencional']::text[],
  tarifa_distribuidora_kwh_brl numeric(8,4),
  tarifa_fonte text,                  -- 'aneel_auto' | 'manual' | 'mercado_livre'

  -- Dados de mercado (snapshot)
  frota_ev_municipio_snapshot jsonb,
  carregadores_proximos_snapshot jsonb,
  irradiacao_solar_snapshot jsonb,

  -- OUTPUTS gerados
  cenarios_resultados jsonb,          -- payback, IRR, NPV de cada cenário
  bp_pdf_path text,                   -- Supabase Storage path do PDF final
  bp_html_path text,                  -- versão web do BP (para área do cliente)

  -- Metadados de processamento
  jobs_log jsonb default '[]'::jsonb,
  error_log text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);
create index on business_plans(status);
create index on business_plans(profile_id);

-- ============================================================
-- LEADS PARA O COMERCIAL (handoff humano)
-- ============================================================
create table public.lead_handoffs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id),
  business_plan_id uuid references public.business_plans(id),
  source text not null,               -- 'bp_completed' | 'cta_clicked' | 'meeting_request'
  notes text,
  assigned_to text,                   -- email do comercial PlugFácil
  status text not null default 'new'
    check (status in ('new','contacted','meeting_scheduled','proposal_sent','won','lost')),
  meeting_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- DADOS DE MERCADO (atualizáveis manualmente pelo admin)
-- ============================================================
create table public.frota_ev_municipio (
  id uuid primary key default gen_random_uuid(),
  uf text not null,
  municipio text not null,
  ano int not null,
  mes int not null,
  bev int default 0,                  -- 100% elétricos
  phev int default 0,                 -- híbridos plug-in
  hev int default 0,                  -- híbridos comuns
  fonte text default 'ABVE',
  updated_at timestamptz default now(),
  unique(uf, municipio, ano, mes)
);
create index on frota_ev_municipio(uf, municipio);

create table public.tarifas_distribuidora (
  id uuid primary key default gen_random_uuid(),
  distribuidora text not null,        -- ex: 'CPFL Paulista'
  uf text not null,
  classe text not null,               -- 'B1','B3','A4_verde','A4_azul','mercado_livre'
  tarifa_te_kwh numeric(8,4),         -- Tarifa de Energia
  tarifa_tusd_kwh numeric(8,4),       -- Tarifa de Uso do Sistema de Distribuição
  bandeira text default 'verde',
  vigencia_inicio date,
  vigencia_fim date,
  fonte_url text,
  updated_at timestamptz default now()
);

-- ============================================================
-- EVENTOS (analytics interno + auditoria)
-- ============================================================
create table public.events (
  id bigserial primary key,
  profile_id uuid references public.profiles(id),
  event_name text not null,
  properties jsonb default '{}'::jsonb,
  occurred_at timestamptz default now()
);
create index on events(profile_id, occurred_at desc);
create index on events(event_name, occurred_at desc);

-- ============================================================
-- RLS — exemplos críticos (implementar em todas)
-- ============================================================
alter table public.profiles enable row level security;
create policy "users see own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "users update own profile" on public.profiles
  for update using (auth.uid() = id);

alter table public.purchases enable row level security;
create policy "users see own purchases" on public.purchases
  for select using (auth.uid() = profile_id);

alter table public.business_plans enable row level security;
create policy "users see own bps" on public.business_plans
  for select using (auth.uid() = profile_id);
create policy "users update own draft bps" on public.business_plans
  for update using (auth.uid() = profile_id and status = 'draft');
```

---

## 4. PRODUTO 1 — PDF MERCADO DE ELETROMOBILIDADE (R$ 49,90)

### 4.1 Landing page `/pdf-mercado`

**Seções obrigatórias (na ordem):**
1. Hero com headline contrarian: *"O mercado brasileiro de recarga vai movimentar R$ 3 bi até 2028. Quem entender as regras agora, captura o ciclo. Quem entrar tarde, paga 3x mais caro."* — CTA *"Quero o material — R$ 49,90"*
2. Bullets de problema: "Você está pensando em investir em eletroposto mas não sabe X, Y, Z"
3. Conteúdo do PDF (sumário detalhado em 8–12 tópicos)
4. Bio do autor / autoridade PlugFácil (engenheiros, parceria WEG/TUPI)
5. Prova social (logos de cidades atendidas, número de leads servidos)
6. Garantia: 7 dias de devolução incondicional
7. FAQ
8. CTA final

**Conversão obrigatória:** captura email + nome + WhatsApp **antes** do checkout (lead nasce mesmo se não pagar).

### 4.2 Conteúdo do PDF
- Capítulo 1: Tamanho e crescimento do mercado (dados ABVE atualizados)
- Capítulo 2: Tipos de carregadores (AC 7,4 kW / DC 30 kW / DC 80 kW) e quando usar cada
- Capítulo 3: Como funciona o setor (operador, host, motorista, roaming)
- Capítulo 4: Modelos de negócio (revenue share, aluguel, venda direta)
- Capítulo 5: Custo de energia e cálculo de margem (com exemplo numérico)
- Capítulo 6: Estudo de caso simulado (3 modelos: residencial, comercial, alto fluxo)
- Capítulo 7: Regulação e ART
- Capítulo 8: Próximos passos (CTA velado para Produto 2)

**Geração do PDF:** o PDF é estático no MVP (Claude Code gera versão inicial em `assets/produtos/pdf-mercado-v1.pdf`). A partir do sprint 4, pode virar versão personalizada com nome do comprador na capa via `@react-pdf/renderer`.

### 4.3 Fluxo de checkout

```
LP → coleta lead (email/nome/whatsapp) → cria profile (anônimo) → Stripe Checkout
  → webhook `checkout.session.completed` → marca purchase.status='paid'
  → dispara job Inngest `deliver-pdf-mercado`:
      1. Gera link assinado do PDF no Supabase Storage (validade 7d, max 5 downloads)
      2. Manda email transacional via Resend com link + PDF anexado
      3. Atualiza profile.lead_stage = 'pdf_buyer'
      4. Adiciona à sequência de nutrição "pdf-to-bp" no Resend Broadcasts
      5. Envia evento PostHog 'product_purchased'
      6. Notifica Slack interno PlugFácil #vendas-pdf
```

### 4.4 Sequência de nutrição pós-PDF (7 emails em 14 dias)
Detalhada em `docs/spec/02_email_sequences.md` (a criar). Objetivo: levar para o Produto 2.

---

## 5. PRODUTO 2 — BUSINESS PLAN COM IA (R$ 290)

Detalhado em `docs/spec/03_bp_pipeline.md` (a criar — próximo passo). Visão geral aqui:

### 5.1 Fluxo de coleta
Formulário multi-etapa em `/app/meu-bp` com 5 passos:
1. **Endereço** (CEP → ViaCEP autocomplete + geocoding via Google Maps Geocoding API ou MapBox)
2. **Tipo de local** (selectbox + descrição livre)
3. **Foto da vaga** (upload obrigatório; até 3 fotos) + dimensões aproximadas
4. **Padrão de entrada elétrico** (foto **OU** inputs manuais: corrente do disjuntor geral, tensão, monofásico/bifásico/trifásico)
5. **Cenários desejados** (checkboxes: convencional / solar / mercado livre — este último só habilitado se média tensão)

Cada passo persiste no banco como `business_plans` em status `draft`. Usuário pode retomar.

### 5.2 Pipeline de processamento (após submit)
Tudo via Inngest, **nunca** em request HTTP:

```
Job: bp.process (orchestrator)
├── 1. bp.analyze-vaga         (Claude Vision: tipo de vaga, área estimada, obstáculos)
├── 2. bp.analyze-padrao        (Claude Vision: estima disjuntor — COM SALVAGUARDAS)
├── 3. bp.fetch-frota-ev        (lookup em frota_ev_municipio com fallback nacional)
├── 4. bp.fetch-tarifa          (ANEEL API → fallback tabela local)
├── 5. bp.fetch-carregadores    (PlugShare scrape → fallback OpenChargeMap API)
├── 6. bp.fetch-irradiacao      (NASA POWER API — gratuito, confiável)
├── 7. bp.compute-cenarios      (engine financeira em bp-engine/)
├── 8. bp.generate-bp           (Claude LLM gera narrativa do BP com base nos dados)
├── 9. bp.render-pdf            (Playwright renderiza rota /bp/[id]/print → PDF)
├── 10. bp.deliver              (email com link + área do cliente atualizada)
└── 11. bp.create-handoff       (cria lead_handoff para o comercial)
```

Cada job é idempotente, com retry, e loga em `business_plans.jobs_log`.

### 5.3 Engine de cenários (`packages/bp-engine`)

Calcula 3 cenários financeiros independentes. Funções puras, totalmente testadas com Vitest. Detalhamento em `docs/spec/04_bp_engine_math.md`.

**Cenário 1 — Convencional (energia da distribuidora):**
- Inputs: tarifa kWh, potência carregador, horas/dia uso estimado, preço cobrado ao motorista (R$/kWh)
- Outputs: receita mensal, custo de energia mensal, margem bruta, CAPEX (do catálogo PlugFácil), payback, IRR (5 anos), NPV

**Cenário 2 — Solar fotovoltaico:**
- Inputs adicionais: irradiação média do município, área disponível, CAPEX solar (tabela)
- Outputs: % de autoconsumo, economia de energia, payback combinado (eletroposto + solar), IRR combinada

**Cenário 3 — Mercado livre (só média/alta tensão):**
- Inputs adicionais: consumo médio mensal, preço PPA estimado (input ou tabela)
- Outputs: economia vs cativo, viabilidade técnica (binário), payback

### 5.4 Geração do Business Plan (LLM)

Prompt orquestrado em `packages/ai/prompts/bp-generator.ts`. Template em `docs/spec/05_bp_prompt_template.md`. Estrutura do documento gerado:

1. **Capa personalizada** (endereço, nome do cliente, data)
2. **Sumário executivo** (1 página, gerado por LLM com base em todos os dados)
3. **Caracterização do local** (output da Vision + dados manuais)
4. **Análise de mercado local** (frota EV no município, carregadores próximos, oportunidade)
5. **Solução técnica recomendada** (qual carregador PlugFácil, justificativa)
6. **Modelagem financeira — 3 cenários** (tabelas e gráficos)
7. **Riscos e mitigações** (LLM gera lista contextualizada)
8. **Roadmap de implementação** (cronograma turn-key PlugFácil)
9. **Disclaimers e responsabilidades técnicas** (texto fixo, jurídico)
10. **Próximos passos com a PlugFácil** (CTA agendar reunião — Cal.com embed)

**Total estimado:** 25–40 páginas. Custo de API por BP: aprox R$ 3–8 (ainda com margem confortável sobre R$ 290).

---

## 6. INTEGRAÇÕES EXTERNAS

Detalhamento em `docs/spec/06_integracoes.md`. Resumo:

### 6.1 ANEEL — Tarifas
- Endpoint público: `https://dadosabertos.aneel.gov.br/api/3/action/datastore_search`
- Resource ID das tarifas homologadas: variar (verificar em https://dadosabertos.aneel.gov.br)
- Estratégia: ETL diário via cron Inngest popula `tarifas_distribuidora` por CEP/município
- Fallback: tabela manual atualizada pelo admin

### 6.2 NASA POWER — Irradiação solar
- Endpoint: `https://power.larc.nasa.gov/api/temporal/climatology/point`
- Parâmetro: `ALLSKY_SFC_SW_DWN` (irradiação global horizontal kWh/m²/dia)
- Gratuito, sem auth, lat/lng do endereço

### 6.3 OpenChargeMap — Carregadores
- Endpoint: `https://api.openchargemap.io/v3/poi/`
- Requer chave (gratuita): `https://openchargemap.org/site/develop`
- Filtra por lat/lng + raio (km)

### 6.4 PlugShare — Carregadores (scraping)
- **CUIDADO:** não tem API oficial. Implementar scraper que respeita robots.txt, com User-Agent identificável, rate-limit forte (1 req / 5s), e fallback obrigatório para OpenChargeMap.
- Roda em Cloudflare Worker ou função Vercel separada.
- Disclaimer no código: se o site mudar, fallback assume tráfego completo.

### 6.5 ViaCEP + Geocoding
- ViaCEP (gratuito) para CEP → endereço
- Google Maps Geocoding API ou MapBox para endereço → lat/lng (limites no MVP, monitor de quota)

### 6.6 ABVE — Frota EV
- **Sem API.** Boletins mensais em PDF.
- Estratégia: admin do PlugFácil baixa o PDF mensal, copia número-chave por município em form simples no `/admin/conteudo/frota-ev`. Pode evoluir para parser de PDF no sprint 6+.

---

## 7. EMAIL & WHATSAPP

Detalhado em `docs/spec/02_email_sequences.md`. Stack:
- **Resend** para transacionais (boas-vindas, entrega de PDF/BP, recuperação de senha)
- **Resend Broadcasts** ou **Loops.so** para sequências
- **WhatsApp opcional sprint 4+:** API oficial do WhatsApp Business via parceiros (Twilio, Z-API, Take Blip) — somente após volume justificar custo

---

## 8. COMPLIANCE — LGPD E ENGENHARIA

### 8.1 LGPD
- Política de Privacidade obrigatória, gerada com base no template em `docs/spec/07_lgpd.md`
- Banner de cookies (somente analytics — funcionais sem consent)
- Consentimento explícito antes de coletar foto do padrão elétrico (dado considerado mais sensível pela exposição patrimonial)
- Direito ao esquecimento: endpoint `/api/lgpd/delete` que anonimiza profile + remove fotos
- Retenção: fotos do BP por 24 meses, anonimização automática após

### 8.2 Engenharia / responsabilidade técnica
- Disclaimer fixo em UI e PDF: *"Este Business Plan é uma análise preliminar gerada por inteligência artificial com base em dados estimados e nas informações fornecidas pelo usuário. Não substitui projeto elétrico assinado por engenheiro habilitado com ART. O dimensionamento final do disjuntor, padrão de entrada, condutores e proteções deve ser validado por profissional habilitado antes de qualquer execução. A PlugFácil oferece este serviço como parte do contrato de franquia/cessão (orçamento sob demanda)."*
- Termos de Uso explícitos sobre limitação de responsabilidade
- Toda análise de imagem é logada para auditoria (5 anos)

---

## 9. DEPLOY E OPERAÇÃO

Detalhado em `docs/spec/08_deploy_ops.md`. Resumo:

### 9.1 Ambientes
- `development` — local + Supabase local
- `preview` — Vercel preview por PR + Supabase branch
- `production` — Vercel prod + Supabase prod + Sentry prod

### 9.2 CI/CD (GitHub Actions)
- Lint + typecheck + test em todo push
- Deploy automático: `main` → produção; PRs → preview
- Migrations Supabase via Supabase CLI no CI

### 9.3 Variáveis de ambiente obrigatórias
Lista completa em `docs/spec/09_env_vars.md`. Categorias:
- `NEXT_PUBLIC_*` — públicas (Supabase URL, PostHog key, etc)
- Supabase service role key (server-only)
- `ANTHROPIC_API_KEY`
- Stripe (publishable + secret + webhook secret)
- Resend
- Inngest (event + signing keys)
- OpenChargeMap, NASA POWER, ViaCEP, Geocoding
- Sentry DSN

### 9.4 Monitoramento de margem por BP
Dashboard interno mostra custo real de API (Anthropic + Vision) por BP gerado. Se passar de R$ 30 por BP, alerta no Slack.

---

## 10. CONVENÇÕES DE CÓDIGO

Para o Claude Code seguir:

1. **TypeScript estrito.** `strict: true`, `noUncheckedIndexedAccess: true`. Sem `any`.
2. **Schemas Zod compartilhados** entre front e back em `packages/shared/schemas/`. Inferir tipos de schemas, não declarar manualmente.
3. **Server Actions** para mutations simples; Route Handlers `app/api/*/route.ts` para integrações com webhooks ou multipart.
4. **Nada de business logic em componentes.** Componentes UI são burros. Lógica em `lib/` ou em `packages/`.
5. **Erros são objetos tipados** (não strings). Padrão: classe `AppError` com `code`, `message`, `httpStatus`, `cause`.
6. **Testes obrigatórios** para: cálculos financeiros em `bp-engine`, validações Zod, e fluxos de checkout (E2E Playwright).
7. **Commits semânticos** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). Um commit por unidade lógica — não amontoar.
8. **Prompts versionados.** Toda interação com Claude API tem prompt versionado em `packages/ai/prompts/v1/`. Mudança de prompt = nova versão.
9. **Idempotência em jobs.** Todo Inngest job verifica se já rodou antes via `business_plans.jobs_log`.
10. **Logs estruturados.** `logger.info({ businessPlanId, step: 'vision_vaga' }, 'started')` — nunca `console.log('processing...')`.

---

## 11. ROADMAP DE EXECUÇÃO — SPRINTS DETALHADOS

> Cada sprint = 2 semanas. Cada sprint termina com: deploy em produção, smoke test manual, 1 cliente real (mesmo que interno) usando.

### Sprint 1 — Fundação + Produto 1 (semanas 1-2)
**Entregável:** Pessoa consegue comprar e baixar o PDF.

Tarefas em ordem:
1. Setup monorepo + Next.js + Supabase + Tailwind + shadcn/ui
2. Schema do banco (migration 001)
3. Auth Supabase + páginas `/login`, `/signup`, `/esqueci-senha`
4. LP `/pdf-mercado` (versão estática inicial)
5. Lead capture form → cria profile
6. Stripe Checkout configurado (modo produção com Pix BR)
7. Webhook Stripe → cria purchase
8. Upload do PDF estático (gerado pelo Claude Code via docx skill — texto fornecido em `docs/spec/10_pdf_content.md`)
9. Job Inngest `deliver-pdf-mercado` (email + link assinado)
10. Página `/obrigado/pdf-mercado` com link de download imediato
11. Deploy em produção (Vercel + Supabase prod)
12. Smoke test E2E + venda real interna

### Sprint 2 — Nutrição e área do cliente (semanas 3-4)
**Entregável:** Comprador do PDF recebe 7 emails de nutrição + tem área logada + vê CTA de upsell para BP.

Tarefas:
1. Sequência Resend Broadcasts "pdf-to-bp" (7 emails, textos em `docs/spec/02_email_sequences.md`)
2. Área `/dashboard` mostrando compras e downloads
3. LP `/plano-de-negocio` (estática primeiro)
4. CTA upsell em emails + dashboard
5. Tracking PostHog dos eventos-chave
6. Admin básico `/admin/leads` (lista de leads + filtro por stage)
7. Notificações Slack para vendas
8. Deploy + smoke test

### Sprint 3 — Coleta do BP (semanas 5-6)
**Entregável:** Comprador do BP consegue submeter o formulário completo (5 passos) e receber email "estamos processando".

Tarefas:
1. Checkout do Produto 2 (R$ 290) — Stripe
2. Formulário multi-etapa `/app/meu-bp/novo` com React Hook Form + Zod
3. Persistência em `business_plans` status `draft`
4. Upload de fotos para Supabase Storage (com compressão client-side)
5. Geocoding via Google Maps
6. Vision da foto da vaga (Claude API) — output em `vaga_analise`
7. Tela de revisão antes de submit
8. Submit → muda status para `submitted` + dispara orquestrador Inngest (mock por enquanto)
9. Email "estamos processando, fica pronto em até 24h"

### Sprint 4 — Engine de cenários + dados ANEEL/NASA (semanas 7-8)
**Entregável:** Os 3 cenários financeiros calculam corretamente a partir dos inputs do usuário.

Tarefas:
1. `packages/bp-engine` — funções puras de cálculo (NPV, IRR, payback)
2. Testes Vitest cobrindo casos-limite
3. Integração ANEEL — ETL de tarifas
4. Integração NASA POWER — irradiação solar por lat/lng
5. Tabela `frota_ev_municipio` populada manualmente para top 50 municípios
6. Jobs Inngest 3-8 (fetch + compute)
7. Tela de preview dos cenários em `/app/meu-bp/[id]/cenarios` (antes do PDF final)
8. Override manual de tarifa (caso usuário queira testar outro valor)

### Sprint 5 — Vision do padrão + carregadores próximos (semanas 9-10)
**Entregável:** Vision do padrão funciona com salvaguardas; PlugShare/OpenChargeMap retornam carregadores num raio do endereço.

Tarefas:
1. Prompt versionado para Vision do padrão de entrada (com regra: sempre subestimar)
2. UI mostrando estimativa + obrigando confirmação manual do usuário
3. Disclaimer fixo
4. Integração OpenChargeMap
5. Scraper PlugShare (Cloudflare Worker separado, com fallback)
6. Snapshot no `business_plans.carregadores_proximos_snapshot`
7. Mapa visual dos carregadores próximos (Leaflet ou MapBox)

### Sprint 6 — PDF final + handoff + observabilidade (semanas 11-12)
**Entregável:** BP em PDF é gerado, entregue, e cria lead_handoff para o comercial. Dashboard interno mostra funil completo.

Tarefas:
1. Layout do BP em React (rota `/bp/[id]/print`)
2. Playwright server-side renderiza PDF
3. Geração da narrativa via Claude (prompt em `bp-generator.ts`)
4. Email final entregando link + PDF anexado
5. CTA "Agendar com PlugFácil" (Cal.com embed)
6. `lead_handoffs` criado automaticamente em status `new`
7. Dashboard `/admin/funnel` com métricas de conversão por estágio
8. Sentry + PostHog + Axiom em produção
9. Termos, Política de Privacidade, página de LGPD
10. Auditoria final + lançamento público

---

## 12. PROMPT DE KICKOFF PARA O CLAUDE CODE

Use este texto como primeiro prompt ao Claude Code dentro do diretório vazio do projeto:

```
Você vai construir o sistema PlugFácil Funil de Eletromobilidade.

A spec completa está em docs/spec/ — leia primeiro 00_PROMPT_MASTER_CLAUDE_CODE.md
integralmente. Depois leia as referências citadas conforme avança.

REGRAS:
1. Execute estritamente o Sprint 1 antes de qualquer coisa do Sprint 2.
2. Antes de codar cada tarefa, escreva um plano curto do que vai fazer e
   peça confirmação se houver ambiguidade.
3. Use pnpm. Não instale dependências que não estão na stack obrigatória
   (seção 1 da spec) sem justificar.
4. Toda função pública exposta em packages/ tem teste Vitest.
5. Toda migration SQL é incremental e versionada.
6. Commit semântico após cada tarefa concluída.
7. Quando uma tarefa exigir secret/API key, pare e me pergunte
   antes de gerar valor placeholder.
8. Ao final do Sprint 1, gere um relatório docs/sprints/sprint-01-report.md
   listando o que foi feito, o que não foi feito, e os riscos identificados.

Comece agora pela tarefa 1 do Sprint 1: setup do monorepo.
```

---

## 13. ARQUIVOS REFERENCIADOS NESTA SPEC (A CRIAR)

Esta spec mestre referencia outros documentos que você (Claude Code) deve criar ou que estão sendo entregues juntos:

- `docs/spec/01_estrutura_repo.md` — detalhes da estrutura de pastas
- `docs/spec/02_email_sequences.md` — textos das sequências de email
- `docs/spec/03_bp_pipeline.md` — pipeline do Business Plan
- `docs/spec/04_bp_engine_math.md` — fórmulas financeiras detalhadas
- `docs/spec/05_bp_prompt_template.md` — template de prompt para geração do BP
- `docs/spec/06_integracoes.md` — detalhes das integrações externas
- `docs/spec/07_lgpd.md` — política e termos
- `docs/spec/08_deploy_ops.md` — deploy e operação
- `docs/spec/09_env_vars.md` — variáveis de ambiente
- `docs/spec/10_pdf_content.md` — conteúdo do PDF do Produto 1

Todos são entregues neste pacote.

---

## 14. RISCOS CONHECIDOS E COMO MITIGAR

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| PlugShare bloqueia scraping | Alta | Médio | Fallback OpenChargeMap obrigatório desde sprint 1 |
| Análise de padrão elétrico gera recomendação errada | Média | Alto (jurídico) | Sempre subestimar 30%, disclaimer destacado, exigir confirmação manual, ART como upsell |
| Custo de API Claude > R$ 30 por BP | Média | Médio | Cap de tokens por seção, monitoramento em tempo real, alerta Slack |
| Conversão PDF→BP abaixo de 3% | Alta | Alto (modelo) | Sequência de nutrição de 7 emails + retargeting Meta Ads + WhatsApp opt-in |
| LGPD: vazamento de fotos de padrão de entrada | Baixa | Crítico | Storage privado, links assinados curtos, anonimização em 24m, logs de acesso |
| Tarifa ANEEL desatualizada | Alta | Médio | ETL diário + fallback tabela manual + override pelo usuário |
| Lead frio não chega ao comercial | Média | Alto (funil quebrado) | `lead_handoffs` criado automático + Slack notification + SLA 24h |
| Frota EV ABVE não disponível para município | Alta | Baixo | Fallback para média estadual + disclaimer "estimativa baseada em dados estaduais" |

---

## 15. CRITÉRIO DE SUCESSO POR FASE

| Fim do Sprint | Critério mínimo (não negociável) |
|---------------|----------------------------------|
| 1 | 1 venda real do PDF passou pelo pipeline completo |
| 2 | 1 lead recebeu pelo menos 3 emails da sequência sem erro |
| 3 | 1 BP submetido, com fotos, sem erro de upload |
| 4 | 1 BP com cenários calculados, valores plausíveis (revisão manual) |
| 5 | 1 BP com mapa de carregadores próximos correto |
| 6 | 1 BP completo entregue em PDF, com lead_handoff criado, comercial notificado |

**Se um sprint não atingir o critério, NÃO AVANCE para o próximo. Itere.**

---

## FIM DO DOCUMENTO MESTRE

Próximo arquivo de leitura: `docs/spec/01_estrutura_repo.md` (estrutura de pastas e setup do monorepo).

Em seguida, na ordem do faseamento:
- Sprint 1: `01_estrutura_repo.md`, `02_email_sequences.md` (transacionais), `09_env_vars.md`, `10_pdf_content.md`
- Sprint 2: `02_email_sequences.md` (nutrição), `06_integracoes.md` (Stripe/Resend/Inngest)
- Sprint 3: `03_bp_pipeline.md`, `05_bp_prompt_template.md` (Vision vaga)
- Sprint 4: `04_bp_engine_math.md`, `06_integracoes.md` (ANEEL, NASA POWER)
- Sprint 5: `05_bp_prompt_template.md` (Vision padrão), `06_integracoes.md` (OCM, PlugShare)
- Sprint 6: `07_lgpd.md`, `08_deploy_ops.md`
