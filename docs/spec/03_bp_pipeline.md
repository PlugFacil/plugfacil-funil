# 03 — Pipeline do Business Plan (Produto 2)

## Visão de alto nível

```
[Usuário] paga R$ 290 → [Stripe webhook] → status purchase=paid
   ↓
[Usuário] preenche formulário multi-etapa (draft persistido a cada passo)
   ↓
[Usuário] confirma submit → business_plans.status = 'submitted'
   ↓
[Inngest] dispara orquestrador `bp.process`
   ↓
   ├── Etapa A: Análise visual
   │     ├── bp.analyze-vaga (Claude Vision)
   │     └── bp.analyze-padrao (Claude Vision com SALVAGUARDAS)
   ↓
   ├── Etapa B: Coleta de dados externos (paralelo)
   │     ├── bp.fetch-frota-ev
   │     ├── bp.fetch-tarifa
   │     ├── bp.fetch-carregadores
   │     └── bp.fetch-irradiacao
   ↓
   ├── Etapa C: Cálculo
   │     └── bp.compute-cenarios (engine pura)
   ↓
   ├── Etapa D: Geração de narrativa
   │     └── bp.generate-bp (Claude LLM)
   ↓
   ├── Etapa E: Renderização
   │     └── bp.render-pdf (Playwright)
   ↓
   └── Etapa F: Entrega
         ├── bp.deliver (email + storage)
         └── bp.create-handoff (cria lead_handoff)
```

## Definição de cada job Inngest

Todos os jobs:
- São idempotentes (consultam `business_plans.jobs_log` antes de rodar)
- Têm retry exponencial (3 tentativas)
- Logam início, fim, duração e custo (quando aplicável)
- Em caso de falha permanente, mudam status para `failed` e notificam Slack

### bp.analyze-vaga

```ts
// packages/ai/jobs/analyze-vaga.ts
// Trigger: 'bp/vaga.requested'
// Input: { businessPlanId }
// Steps:
//   1. Carrega business_plan + foto_vaga_path do Supabase Storage
//   2. Baixa imagem como base64
//   3. Chama Claude API com prompt VAGA_VISION_V1 (em prompts/v1/vaga-vision.ts)
//   4. Valida output com schema Zod (VagaAnaliseSchema)
//   5. Salva em business_plans.vaga_analise
//   6. Emite evento 'bp/vaga.completed'
//   7. Loga custo da chamada
```

**Schema de saída `VagaAnaliseSchema`:**

```ts
export const VagaAnaliseSchema = z.object({
  tipo_vaga: z.enum([
    'garagem_coberta','garagem_descoberta','estacionamento_externo',
    'box_individual','vaga_demarcada_solo','vaga_em_rua','outros'
  ]),
  area_estimada_m2: z.number().nullable(),    // null se não puder estimar
  largura_estimada_m: z.number().nullable(),
  comprimento_estimado_m: z.number().nullable(),
  cobertura: z.enum(['coberta','descoberta','parcial','desconhecida']),
  obstaculos_identificados: z.array(z.string()), // ex: 'pilar próximo', 'caixa de luz'
  distancia_estimada_padrao_eletrico_m: z.number().nullable(),
  qualidade_imagem: z.enum(['boa','aceitavel','ruim','inutilizavel']),
  recomendacoes_instalacao: z.array(z.string()),
  confianca: z.enum(['alta','media','baixa']),
  observacoes_livres: z.string()
});
```

### bp.analyze-padrao — SALVAGUARDAS OBRIGATÓRIAS

```ts
// packages/ai/jobs/analyze-padrao.ts
// REGRA INNEGOCIÁVEL: este job NUNCA recomenda potência final.
// Apenas ESTIMA componentes visíveis. Recomendação final vem do engine
// com aplicação de fator de segurança 0.7.
```

**Schema:**

```ts
export const PadraoAnaliseSchema = z.object({
  disjuntor_geral_estimado_a: z.number().nullable(),  // em Ampères
  tensao_estimada_v: z.enum(['127','220','380','desconhecida']),
  fases: z.enum(['monofasico','bifasico','trifasico','desconhecida']),
  potencia_maxima_disponivel_kw_estimada: z.number().nullable(),
  // ↑ calculada do disjuntor × tensão × fator de utilização 0.7
  presenca_dps: z.boolean().nullable(),
  presenca_dr: z.boolean().nullable(),
  qualidade_imagem: z.enum(['boa','aceitavel','ruim','inutilizavel']),
  confianca: z.enum(['alta','media','baixa']),
  itens_nao_identificados: z.array(z.string()),  // sempre listar o que IA não viu
  alertas_seguranca: z.array(z.string()),  // ex: "padrão antigo, recomenda inspeção"
  observacoes_livres: z.string(),
  // CAMPO OBRIGATÓRIO sempre preenchido:
  disclaimer: z.literal(
    'Esta estimativa não substitui inspeção presencial por engenheiro habilitado. ' +
    'Dimensionamento final do carregador requer ART.'
  )
});
```

**Após a análise**, o frontend mostra a tela:

```
┌──────────────────────────────────────────────────────┐
│ ⚠️  Estimativa da IA (não vinculante)                │
│                                                       │
│ Disjuntor geral estimado: 50 A                       │
│ Tensão: 220V bifásico                                │
│ Potência máxima estimada: 7,7 kW                     │
│ Confiança: média                                      │
│                                                       │
│ ☐ Confirmo que esses dados batem com meu padrão      │
│   OU ajustarei abaixo:                               │
│                                                       │
│ Disjuntor geral (A):    [____]                       │
│ Tensão:                 ( ) 127V ( ) 220V ( ) 380V   │
│ Fases:                  ( ) Mono ( ) Bi ( ) Tri      │
│                                                       │
│ ❗ A recomendação final de carregador será           │
│    sempre conservadora. O dimensionamento definitivo │
│    requer engenheiro habilitado (ART).               │
│                                                       │
│ [Confirmar e continuar]                              │
└──────────────────────────────────────────────────────┘
```

O valor confirmado vai para `padrao_input_manual` (que sobrescreve a estimativa da Vision para fins de cálculo).

### bp.fetch-frota-ev

```ts
// Trigger: 'bp/data.requested'
// Lookup em frota_ev_municipio:
//   1. Tenta município exato (UF + nome)
//   2. Fallback: total UF
//   3. Fallback: média nacional dos últimos 12 meses
//   4. Salva em business_plans.frota_ev_municipio_snapshot
//      { tipo: 'municipio'|'uf'|'nacional', dados: {...}, fallback_usado: true|false }
```

### bp.fetch-tarifa

```ts
// 1. Identifica distribuidora pelo CEP (tabela CEP→distribuidora local)
// 2. Busca tarifa vigente em tarifas_distribuidora
// 3. Calcula tarifa total (TE + TUSD) + bandeira atual + tributos
// 4. Salva snapshot
// Fallback: tarifa média nacional B3 (publicada pela ANEEL anualmente)
```

### bp.fetch-carregadores

```ts
// 1. Try PlugShare scraper (Cloudflare Worker)
//    - timeout 8s, max 1 retry
// 2. Fallback OpenChargeMap API:
//    GET /poi/?latitude=...&longitude=...&distance=10&distanceunit=KM&maxresults=50
// 3. Normaliza output:
//    { fonte, total, dc_count, ac_count, lista: [{nome, lat, lng, potencia_kw, ...}] }
// 4. Salva snapshot
```

### bp.fetch-irradiacao

```ts
// NASA POWER API:
//   GET https://power.larc.nasa.gov/api/temporal/climatology/point
//   ?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=X&latitude=Y&format=JSON
// Retorna irradiação média anual em kWh/m²/dia
// Fallback: tabela CRESESB por município (offline, gerada uma vez)
```

### bp.compute-cenarios

Função pura `computeCenarios(input: BPInput): CenariosResult`. Detalhes matemáticos em `04_bp_engine_math.md`.

Salva em `business_plans.cenarios_resultados`:

```json
{
  "convencional": {
    "capex_total_brl": 85000,
    "receita_mensal_brl": 9500,
    "custo_energia_mensal_brl": 2800,
    "custos_operacionais_mensal_brl": 600,
    "margem_bruta_mensal_brl": 6100,
    "payback_meses": 29,
    "irr_5anos_pct": 41.2,
    "npv_5anos_brl_taxa10": 184000
  },
  "solar": { /* ... */ },
  "mercado_livre": { /* ... ou null se não elegível */ },
  "recomendacao_engine": "convencional"
}
```

### bp.generate-bp

Orquestra **3 chamadas separadas** à API Claude (para ficar dentro de janelas de contexto e permitir cache de prompt):

1. **Sumário Executivo** (~300 tokens out)
2. **Análise de Mercado Local + Recomendação Técnica** (~1500 tokens out)
3. **Riscos e Próximos Passos** (~800 tokens out)

Cada chamada usa prompt versionado em `packages/ai/prompts/v1/bp-*.ts`.

Total estimado por BP: 5-10k tokens de output. Com Sonnet 4.6: ~R$ 3-6/BP.

### bp.render-pdf

```ts
// 1. Marca business_plan.status = 'rendering'
// 2. Chama rota interna /bp/[id]/print autenticada via service token
// 3. Playwright Chromium em modo headless → page.pdf()
// 4. Salva PDF em Supabase Storage: bps/[profile_id]/[bp_id].pdf
// 5. Salva bp_pdf_path
// 6. Status = 'completed'
```

**Por que Playwright e não @react-pdf:** Layout do BP usa gráficos complexos (Recharts), tabelas, mapas. React-PDF tem limitações sérias para isso. Playwright renderiza HTML/CSS completo.

### bp.deliver

```ts
// 1. Gera link assinado de 30 dias para bp_pdf_path
// 2. Envia email transacional (Resend) com:
//      - link de download
//      - PDF anexado (se < 10MB)
//      - CTA "Agendar conversa com PlugFácil"
// 3. Atualiza profile.lead_stage = 'bp_buyer'
// 4. Evento PostHog 'bp_delivered'
// 5. Notifica Slack #vendas-bp
```

### bp.create-handoff

```ts
// 1. Cria registro em lead_handoffs com:
//      source: 'bp_completed'
//      status: 'new'
// 2. Calcula lead_score baseado em:
//      - Tipo de local (posto/shopping > residencial)
//      - Potência disponível
//      - Frota EV do município
//      - Cenário com melhor payback < 36 meses → +30 pontos
// 3. Atribui ao comercial via round-robin
// 4. Envia email para o comercial atribuído
// 5. SLA: comercial deve marcar como 'contacted' em 24h
```

## Tempo total estimado de processamento

| Etapa | Tempo |
|-------|-------|
| analyze-vaga | 8-15s |
| analyze-padrao | 8-15s |
| fetch-* (paralelo) | 10-20s |
| compute-cenarios | <1s |
| generate-bp | 30-60s |
| render-pdf | 15-30s |
| deliver | 5-10s |
| **Total** | **~2-3 minutos** |

UX: mostra ao usuário "Seu BP está sendo gerado. Estimativa: 5 minutos. Avisaremos por email quando estiver pronto." E na verdade fica pronto antes.

## Estados de erro e recuperação

| Erro | Ação |
|------|------|
| Vision falha 3x | Status `review_needed`, alerta Slack, ofereçer ao usuário refazer upload da foto |
| ANEEL API fora | Usa fallback de tabela local, segue normal |
| Cálculo retorna NaN | Status `failed`, alerta Slack, refund automático |
| Playwright falha | Retry 1x, depois fallback para @react-pdf simplificado |
| LLM gera output que não passa no schema | Retry com prompt corretivo, max 2 tentativas |

## Anexo: como o Claude Code deve testar este pipeline

1. **Mocks em dev:** todas integrações têm modo `mock: true` controlado por env var, retornando fixtures determinísticas.
2. **Vitest:** cada job tem teste unitário com mocks.
3. **Inngest dev server:** rodar `inngest dev` localmente, disparar evento manualmente, observar o flow.
4. **E2E Playwright:** 1 teste que cria business_plan via fixture e roda todo o pipeline com mocks.
