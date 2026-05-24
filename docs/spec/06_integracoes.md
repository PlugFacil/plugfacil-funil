# 06 — Integrações externas

> Cada integração tem: URL, autenticação, rate limits, esquema de fallback, schema Zod do output, e teste com mock.

Localização: `packages/integrations/src/<provider>/`.

---

## 6.1 ANEEL — Dados Abertos (Tarifas de distribuidoras)

### Acesso
- Portal: https://dadosabertos.aneel.gov.br
- API CKAN: `https://dadosabertos.aneel.gov.br/api/3/action/datastore_search`
- Sem autenticação
- Rate limit: não documentado, mas seja cordial (1 req/s)

### Resource IDs relevantes
Os IDs mudam quando a ANEEL republica datasets. A spec assume verificação **manual** no Sprint 4 antes de codar. Provavelmente:
- "Tarifas Homologadas das Distribuidoras de Energia Elétrica"
- "Componentes Tarifárias das Distribuidoras"

### Estratégia
1. ETL **diário** via cron Inngest `cron-aneel-tarifas` (Sprint 4):
   - Lista resources do CKAN
   - Identifica resource de tarifas vigentes
   - Pagina via `?offset` (limit padrão 100)
   - UPSERT em `tarifas_distribuidora`
2. **Fallback**: tabela embutida com tarifas médias atualizadas manualmente (`packages/integrations/src/aneel/tarifas-fallback.json`)
3. Não tomar a API como online em tempo real — sempre ler do banco local

### Schema
```ts
export const TarifaSchema = z.object({
  distribuidora: z.string(),
  uf: z.string().length(2),
  classe: z.enum(['B1','B3','A4_verde','A4_azul','outros']),
  tarifa_te_kwh: z.number(),
  tarifa_tusd_kwh: z.number(),
  tarifa_total_kwh: z.number(),
  vigencia_inicio: z.string(),
});
```

### CEP → distribuidora
Não há fonte oficial unificada. Estratégia: tabela manual com municípios-cabeça das principais distribuidoras + fallback "tarifa média estadual". Lista em `packages/integrations/src/aneel/cep-distribuidora.ts`.

---

## 6.2 NASA POWER — Irradiação solar

### Acesso
- API: `https://power.larc.nasa.gov/api/temporal/climatology/point`
- Sem autenticação
- Rate limit: 60 req/min por IP (suficiente)

### Request
```
GET https://power.larc.nasa.gov/api/temporal/climatology/point
  ?parameters=ALLSKY_SFC_SW_DWN
  &community=RE
  &longitude=-46.6333
  &latitude=-23.5505
  &format=JSON
```

### Response shape
```json
{
  "properties": {
    "parameter": {
      "ALLSKY_SFC_SW_DWN": {
        "JAN": 5.32, "FEB": 5.10, ..., "DEC": 5.40, "ANN": 4.95
      }
    }
  }
}
```

Unidade: kWh/m²/dia (média diária mensal e anual).

### Strategy
- Chamada **on-demand** durante geração do BP, cacheada em Upstash por 30 dias (lat/lng grid de 0.01°)
- Sem fallback necessário — API muito confiável
- Timeout 8s + retry 1x

### Schema
```ts
export const IrradiacaoSchema = z.object({
  anual_kwh_m2_dia: z.number(),
  mensal: z.object({
    jan: z.number(), feb: z.number(), mar: z.number(), apr: z.number(),
    may: z.number(), jun: z.number(), jul: z.number(), aug: z.number(),
    sep: z.number(), oct: z.number(), nov: z.number(), dec: z.number(),
  }),
  fonte: z.literal('nasa_power'),
  consultado_em: z.string().datetime(),
});
```

---

## 6.3 OpenChargeMap — Carregadores próximos

### Acesso
- Portal: https://openchargemap.org/site/develop
- API: `https://api.openchargemap.io/v3/poi/`
- **Requer chave** gratuita (registrar na PlugFácil; subir em env var `OPENCHARGEMAP_API_KEY`)
- Rate limit: ~25k req/dia no plano free (mais que suficiente)

### Request
```
GET https://api.openchargemap.io/v3/poi/
  ?key=YOUR_KEY
  &output=json
  &latitude=-23.5505
  &longitude=-46.6333
  &distance=10
  &distanceunit=KM
  &maxresults=50
  &countrycode=BR
```

### Schema (subset relevante)
```ts
export const ChargerSchema = z.object({
  id: z.string(),
  nome: z.string(),
  endereco: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  distancia_km: z.number(),
  conectores: z.array(z.object({
    tipo: z.string(),       // 'CCS Type 2', 'CHAdeMO', 'Type 2'
    potencia_kw: z.number().nullable(),
  })),
  operador: z.string().optional(),
  fonte: z.literal('open_charge_map'),
});
```

### Cache
Cache 7 dias por par lat/lng + raio. Carregadores não mudam tão rápido.

---

## 6.4 PlugShare — Carregadores (scraping)

### Status oficial
**Sem API pública.** O scraping é frágil e juridicamente cinzento. Implementação opcional, **somente** se OpenChargeMap não cobrir bem a região do cliente.

### Implementação
Em Cloudflare Worker separado (`infra/workers/plugshare-scraper/`):
1. Respeitar `robots.txt`
2. User-Agent identificável: `PlugFacilBot/1.0 (+https://plugfacil.com.br/bot)`
3. Rate limit forte: 1 req / 5s, max 200/dia
4. Timeout 10s
5. Em qualquer erro, fallback OpenChargeMap

### Decisão de fallback
```ts
async function fetchCarregadores(lat, lng, raio_km) {
  // Sempre OpenChargeMap primeiro (rápido e confiável)
  const ocm = await openChargeMap.fetch(lat, lng, raio_km);

  // Se cobertura é muito baixa, suplementar com PlugShare
  if (ocm.length < 5 && raio_km <= 15) {
    try {
      const plugshare = await plugShareScraper.fetch(lat, lng, raio_km);
      return mergeUnique(ocm, plugshare);
    } catch {
      return ocm; // graceful degradation
    }
  }

  return ocm;
}
```

---

## 6.5 ViaCEP

### Acesso
- API: `https://viacep.com.br/ws/{CEP}/json/`
- Sem autenticação, sem rate limit documentado

### Schema
```ts
export const ViaCEPSchema = z.object({
  cep: z.string(),
  logradouro: z.string(),
  complemento: z.string(),
  bairro: z.string(),
  localidade: z.string(),  // município
  uf: z.string(),
  ibge: z.string(),
  ddd: z.string(),
});
```

---

## 6.6 Google Maps Geocoding API

### Acesso
- API: `https://maps.googleapis.com/maps/api/geocode/json`
- Requer chave: `GOOGLE_MAPS_API_KEY`
- $5 por 1000 requests além de $200/mês grátis
- Restringir chave por IP em produção

### Request
```
GET https://maps.googleapis.com/maps/api/geocode/json
  ?address=Rua%20X,%20123,%20São%20Paulo,%20SP
  &region=br
  &key=...
```

### Cache
Cache permanente por endereço normalizado (não muda).

### Fallback
Se Google Maps falhar: usar lat/lng da centroide do município (tabela IBGE).

---

## 6.7 ABVE — Frota EV por município (sem API)

### Realidade
ABVE publica boletins mensais em PDF: https://www.abve.org.br

### Estratégia
1. **Manual no Sprint 1-6**: admin do PlugFácil baixa o boletim e atualiza via `/admin/conteudo/frota-ev`
2. **Automatização futura**: parser do PDF da ABVE (não no MVP)
3. Tabela `frota_ev_municipio` com fallback hierárquico:
   - Município (se existe)
   - UF (média)
   - Brasil (média)

### Form admin
```
/admin/conteudo/frota-ev/novo
Campos:
- Ano + Mês (do boletim)
- UF
- Município (autocomplete IBGE)
- BEV (100% elétricos)
- PHEV (híbridos plug-in)
- HEV (híbridos comuns)
- Upload do PDF de referência (opcional)
- [Salvar]
```

Top 50 municípios pré-cadastrados em seed (`infra/supabase/seeds/frota_ev_initial.sql`).

---

## 6.8 Stripe

### Configuração
- Conta Brasil habilitada com Pix
- Webhook endpoint: `https://plugfacil.com.br/api/webhooks/stripe`
- Eventos a escutar:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `charge.refunded`

### Produtos no Stripe
Criar via dashboard:
1. **PDF Mercado Eletromobilidade** — R$ 49,90 — one-time
2. **Business Plan IA** — R$ 290,00 — one-time

### Idempotência
Toda mutation no webhook usa `stripe_payment_intent_id` como chave única. Webhook é idempotente.

---

## 6.9 Resend

### Configuração
- Domínio verificado: `plugfacil.com.br`
- DKIM + SPF + DMARC configurados
- API key em `RESEND_API_KEY`

### Templates principais
1. **welcome-pdf-buyer** — entrega do PDF + link assinado
2. **bp-processing** — confirma submit, dá ETA
3. **bp-completed** — entrega BP + CTA reunião
4. **bp-failed** — algo deu errado + suporte
5. **nurture-1** a **nurture-7** — sequência pós-PDF

Cada template em `packages/email/templates/` como componente React (`react-email`).

### Sequência via Broadcasts
Configurar no dashboard Resend. Trigger: adicionar contato a audiência `pdf-buyers`. Agenda manual ou via API.

---

## 6.10 Inngest

### Configuração
- Conta Inngest gratuita até 50k steps/mês
- Webhook endpoint: `https://plugfacil.com.br/api/inngest`
- Event keys: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`

### Eventos custom
```
bp/submitted          → orquestrador
bp/vaga.completed
bp/padrao.completed
bp/data.completed
bp/cenarios.completed
bp/narrative.completed
bp/pdf.completed
bp/delivered

purchase/completed    → entrega P1 ou inicia P2
lead/handoff.created  → notifica comercial

cron/aneel-tarifas    → ETL diário
cron/cleanup-storage  → limpeza fotos > 24m
```

---

## 6.11 PostHog

### Configuração
- Self-hosted ou cloud (cloud é OK no MVP)
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- Session replay habilitado para usuários logados (com mascaramento de inputs sensíveis)

### Eventos principais
```
page_view (auto)
lead_captured                 // formulário LP
checkout_started
purchase_completed            // properties: product, amount
bp_form_step_completed        // properties: step
bp_submitted
bp_delivered
cta_meeting_clicked
```

### Funnels configurados
1. LP → lead_captured → checkout_started → purchase_completed (P1)
2. P1 buyer → P2 LP view → checkout → submit → delivered
3. BP delivered → meeting clicked → meeting scheduled

---

## 6.12 Cal.com (agendamento)

### Configuração
- Conta Cal.com com calendário do comercial PlugFácil
- Tipo de evento: "Conversa PlugFácil — 30 min"
- Embed via `<Cal>` no link do BP

### Integração
Após entrega do BP, no email e na área do cliente:
```
[Agendar conversa com a PlugFácil] → abre Cal.com embed
```

Cal.com webhook → Inngest event `meeting/scheduled` → atualiza `lead_handoffs.status`.

---

## Convenções para o pacote `packages/integrations`

```
packages/integrations/
├── src/
│   ├── aneel/
│   │   ├── client.ts
│   │   ├── schema.ts
│   │   ├── tarifas-fallback.json
│   │   ├── etl.ts          # roda no cron
│   │   └── __tests__/
│   ├── nasa-power/
│   ├── openchargemap/
│   ├── plugshare/
│   ├── viacep/
│   ├── google-maps/
│   └── shared/
│       ├── cache.ts        # wrapper Upstash
│       ├── retry.ts
│       └── http.ts         # fetch com timeout, retry, log
└── package.json
```

Cada cliente expõe interface mínima:
```ts
export interface IntegrationClient<Input, Output> {
  fetch(input: Input): Promise<Output>;
  // Cada cliente lida com seu próprio cache, retry, e fallback internamente
}
```

Testes em todo cliente cobrem: caminho feliz, timeout, erro 4xx, erro 5xx, fallback acionado.
