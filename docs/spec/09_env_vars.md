# 09 — Variáveis de ambiente

> Lista completa. Copie como base do `.env.example` na raiz do monorepo. `scripts/verify-env.ts` valida presença em runtime e falha em boot se faltar algo crítico.

---

## Template `.env.example`

```bash
# =========================================
# === APP ===
# =========================================
NEXT_PUBLIC_SITE_URL=https://plugfacil.com.br
APP_ENV=production                    # development | preview | production
INTERNAL_API_TOKEN=                   # token aleatório p/ chamadas server-to-server (gerar com `openssl rand -hex 32`)
NEXT_PUBLIC_APP_NAME=PlugFácil

# =========================================
# === SUPABASE ===
# =========================================
NEXT_PUBLIC_SUPABASE_URL=             # https://<projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=        # chave pública (segura no client)
SUPABASE_SERVICE_ROLE_KEY=            # server-only — NUNCA expor no client
SUPABASE_JWT_SECRET=                  # se usar verificação custom de JWT
DATABASE_URL=                         # postgres://... (uso direto do Drizzle/migrations)

# =========================================
# === ANTHROPIC ===
# =========================================
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
ANTHROPIC_MAX_TOKENS_VISION=2048      # cap de saída em prompts de Vision
ANTHROPIC_MAX_TOKENS_NARRATIVE=4096   # cap de saída em prompts narrativos
ANTHROPIC_DAILY_BUDGET_BRL=500        # circuit breaker — alerta Slack ao atingir

# =========================================
# === STRIPE ===
# =========================================
STRIPE_SECRET_KEY=                    # sk_live_... ou sk_test_...
STRIPE_WEBHOOK_SECRET=                # whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=   # pk_live_... ou pk_test_...
STRIPE_PRICE_ID_PDF=                  # price_... R$ 49,90
STRIPE_PRICE_ID_BP=                   # price_... R$ 290
STRIPE_PAYMENT_METHODS=card,pix       # métodos habilitados no Checkout

# =========================================
# === RESEND ===
# =========================================
RESEND_API_KEY=
RESEND_FROM_EMAIL=time@plugfacil.com.br
RESEND_REPLY_TO=contato@plugfacil.com.br
RESEND_AUDIENCE_ID_NUTRITION=         # lista da sequência pdf-to-bp

# =========================================
# === INNGEST ===
# =========================================
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
INNGEST_APP_ID=plugfacil

# =========================================
# === INTEGRAÇÕES EXTERNAS ===
# =========================================
OPENCHARGEMAP_API_KEY=                # registrado em openchargemap.io
GOOGLE_MAPS_API_KEY=                  # geocoding API habilitada no console GCP
# ANEEL CKAN, NASA POWER, ViaCEP: SEM autenticação

# Scraper PlugShare (opcional — Cloudflare Worker URL)
PLUGSHARE_SCRAPER_URL=                # ex: https://plugshare-scraper.plugfacil.workers.dev
PLUGSHARE_SCRAPER_TOKEN=              # token compartilhado p/ proteger o worker

# =========================================
# === REDIS (Upstash) ===
# =========================================
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# =========================================
# === OBSERVABILIDADE ===
# =========================================
SENTRY_DSN=
SENTRY_AUTH_TOKEN=                    # upload de sourcemaps
SENTRY_ORG=plugfacil
SENTRY_PROJECT=plugfacil-web
NEXT_PUBLIC_SENTRY_DSN=               # mesmo DSN — exposto p/ client

NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

AXIOM_TOKEN=
AXIOM_DATASET=plugfacil-prod          # plugfacil-preview em ambientes não-prod

# =========================================
# === CAL.COM ===
# =========================================
NEXT_PUBLIC_CAL_LINK=plugfacil/30min
CAL_WEBHOOK_SECRET=                   # validação HMAC dos webhooks

# =========================================
# === SLACK ===
# =========================================
SLACK_WEBHOOK_VENDAS=                 # canal #vendas — leads quentes
SLACK_WEBHOOK_ALERTAS=                # canal #prod-alertas — incidentes
SLACK_WEBHOOK_CUSTOS=                 # canal #custos — alertas de margem

# =========================================
# === FEATURE FLAGS (opcional, PostHog) ===
# =========================================
# Não são env vars — gerenciadas em runtime pelo PostHog, listadas aqui pra referência:
# - plugshare_scraper_enabled
# - cenario_mercado_livre_visible
# - whatsapp_optin_enabled
```

---

## Variáveis por ambiente

| Variável | dev | preview | production |
|----------|-----|---------|------------|
| `APP_ENV` | `development` | `preview` | `production` |
| `STRIPE_*` | test mode keys | test mode keys | **live keys** |
| `RESEND_API_KEY` | test key | test key | **live key** |
| `ANTHROPIC_API_KEY` | mesma key OK (paga por uso) | mesma key OK | mesma key |
| `SUPABASE_URL` | local (`http://localhost:54321`) ou projeto staging | staging | **projeto prod** |
| `SENTRY_DSN` | omitir (dev) | DSN staging | DSN prod |
| `INNGEST_*` | branch env Inngest dev | branch staging | branch main |
| `AXIOM_DATASET` | `plugfacil-dev` | `plugfacil-preview` | `plugfacil-prod` |
| `SLACK_WEBHOOK_*` | webhook de canal #dev | webhook de canal #dev | webhooks de canais prod |

---

## Validação em runtime

Em `apps/web/src/env.ts`:

```typescript
import { z } from 'zod'
import 'server-only'

const serverSchema = z.object({
  // App
  APP_ENV: z.enum(['development', 'preview', 'production']),
  INTERNAL_API_TOKEN: z.string().min(32),

  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-5-20250929'),
  ANTHROPIC_MAX_TOKENS_VISION: z.coerce.number().int().positive().default(2048),
  ANTHROPIC_MAX_TOKENS_NARRATIVE: z.coerce.number().int().positive().default(4096),
  ANTHROPIC_DAILY_BUDGET_BRL: z.coerce.number().positive().default(500),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_PRICE_ID_PDF: z.string().startsWith('price_'),
  STRIPE_PRICE_ID_BP: z.string().startsWith('price_'),

  // Resend
  RESEND_API_KEY: z.string().startsWith('re_'),
  RESEND_FROM_EMAIL: z.string().email(),
  RESEND_REPLY_TO: z.string().email(),

  // Inngest
  INNGEST_EVENT_KEY: z.string().min(1),
  INNGEST_SIGNING_KEY: z.string().min(1),

  // Integrações
  OPENCHARGEMAP_API_KEY: z.string().min(1),
  GOOGLE_MAPS_API_KEY: z.string().min(1),

  // Redis
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // Observabilidade — opcionais em dev
  SENTRY_DSN: z.string().url().optional(),
  AXIOM_TOKEN: z.string().optional(),

  // Slack — opcionais em dev
  SLACK_WEBHOOK_VENDAS: z.string().url().optional(),
  SLACK_WEBHOOK_ALERTAS: z.string().url().optional(),
})

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url(),
  NEXT_PUBLIC_CAL_LINK: z.string().min(1),
  NEXT_PUBLIC_APP_NAME: z.string().default('PlugFácil'),
})

export const env = serverSchema.parse(process.env)

export const publicEnv = clientSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_CAL_LINK: process.env.NEXT_PUBLIC_CAL_LINK,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
})
```

Importe `env` em código server-only e `publicEnv` em qualquer lugar.

`scripts/verify-env.ts` roda no CI e em `predev`/`prebuild`:

```typescript
// scripts/verify-env.ts
import { config } from 'dotenv'
import { env, publicEnv } from '../apps/web/src/env'

config({ path: '.env.local' })

try {
  // Parse força validação Zod
  void env
  void publicEnv
  console.log('✅ Env válido')
  process.exit(0)
} catch (err) {
  console.error('❌ Env inválido:', err)
  process.exit(1)
}
```

---

## Onde configurar cada uma

| Ambiente | Onde |
|----------|------|
| Local dev | `.env.local` (gitignored) |
| Preview Vercel | Vercel → Project → Settings → Environment Variables (escopo: Preview) |
| Production Vercel | Vercel → Project → Settings → Environment Variables (escopo: Production) |
| Inngest jobs | Inngest dashboard → Project → Environment Variables (espelhar do Vercel) |
| GitHub Actions | Repository Settings → Secrets and variables → Actions |

**Regra de ouro**: variáveis com `NEXT_PUBLIC_` são embutidas no bundle do client — qualquer pessoa que abrir o site verá. **Nunca** colocar credencial sensível com esse prefixo.

---

## Rotação e segurança

Documentado em `08_deploy_ops.md` seção 10. Resumo:

| Variável | Rotação |
|----------|---------|
| `STRIPE_WEBHOOK_SECRET` | 6 meses |
| `INTERNAL_API_TOKEN` | 3 meses |
| `INNGEST_SIGNING_KEY` | 6 meses |
| `SUPABASE_SERVICE_ROLE_KEY` | apenas se suspeita de vazamento |
| `ANTHROPIC_API_KEY` | anual ou em saída de membro |
| `CAL_WEBHOOK_SECRET` | 6 meses |
| `PLUGSHARE_SCRAPER_TOKEN` | 3 meses |

Em caso de vazamento confirmado: revogar todas e reemitir; o `02_email_sequences.md` tem template de comunicação ao cliente; `08_deploy_ops.md` tem playbook de incidente.
