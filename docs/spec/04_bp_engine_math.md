# 04 — Engine de cenários: matemática financeira

> Funções puras em `packages/bp-engine/`. 100% cobertas por Vitest. Sem dependências externas.

## Inputs comuns (todos os cenários)

```ts
export interface BPInput {
  // Configuração do eletroposto (a engine sugere baseado no padrão elétrico)
  carregadores: Array<{
    tipo: 'AC' | 'DC';
    potencia_kw: number;       // 7.4, 22, 30, 40, 80
    custo_capex_brl: number;   // do catálogo PlugFácil
    quantidade: number;
  }>;

  // Mercado local
  frota_ev_municipio: number;
  carregadores_proximos: number;
  tipo_local: TipoLocal;       // afeta taxa de utilização estimada

  // Energia
  tarifa_kwh_brl: number;      // tarifa total da distribuidora
  preco_cobrado_kwh_brl: number;       // padrão R$ 1,50
  taxa_conexao_brl: number;            // padrão R$ 1,00 por sessão

  // Solar (cenário 2)
  irradiacao_kwh_m2_dia: number;
  area_disponivel_m2: number | null;   // se null, cenário solar é skip
  custo_solar_brl_kwp: number;         // ~R$ 3.500/kWp em 2026

  // Mercado livre (cenário 3)
  consumo_atual_total_kwh_mes: number | null;
  preco_ppa_estimado_kwh_brl: number;  // ~R$ 0,28
  elegivel_mercado_livre: boolean;     // true se classe A (média/alta tensão)

  // Parâmetros financeiros
  taxa_desconto_anual_pct: number;     // padrão 10%
  horizonte_analise_meses: number;     // padrão 60
  inflacao_anual_pct: number;          // padrão 4.5%
  reajuste_tarifa_anual_pct: number;   // padrão 6%
}
```

## Taxa de utilização (utilization rate) — estimativa

A receita depende de **quantas horas/dia** os carregadores são usados. Estimativa baseada em tipo de local e mercado:

```ts
// utilization-rate.ts
export function estimateUtilization(input: {
  tipo_local: TipoLocal;
  frota_ev_municipio: number;
  carregadores_proximos: number;
  potencia_kw: number;
  tipo_carregador: 'AC' | 'DC';
}): UtilizationEstimate {
  // Tabela base (horas/dia úteis de carga ativa por carregador)
  const baseHoursPerDay: Record<TipoLocal, { ac: number; dc: number }> = {
    posto_combustivel:        { ac: 1.5, dc: 6.0 },
    shopping:                 { ac: 4.0, dc: 4.5 },
    supermercado:             { ac: 3.0, dc: 3.5 },
    hotel_pousada:            { ac: 5.0, dc: 1.5 },
    estacionamento:           { ac: 3.5, dc: 3.0 },
    concessionaria:           { ac: 2.0, dc: 2.5 },
    condominio_residencial:   { ac: 4.5, dc: 1.0 },
    condominio_comercial:     { ac: 3.0, dc: 2.0 },
    outros:                   { ac: 2.0, dc: 2.5 },
  };

  const base = input.tipo_carregador === 'AC'
    ? baseHoursPerDay[input.tipo_local].ac
    : baseHoursPerDay[input.tipo_local].dc;

  // Ajuste por densidade de EVs no município
  // mais EVs por carregador local = maior utilização
  const evPorCarregadorLocal = input.frota_ev_municipio
    / Math.max(input.carregadores_proximos, 1);

  const densityMultiplier = clamp(
    0.5 + (evPorCarregadorLocal / 80) * 0.5,  // 80 EVs/carregador = neutro
    0.4,
    1.6
  );

  const horasDia = base * densityMultiplier;

  return {
    horas_dia_estimadas: horasDia,
    kwh_dia_estimado: horasDia * input.potencia_kw * 0.85, // 85% taxa real média
    multiplicador_densidade: densityMultiplier,
    confianca: densityMultiplier > 0.8 && densityMultiplier < 1.2 ? 'media' : 'baixa',
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
```

## Cenário 1 — Convencional

```ts
// cenario-convencional.ts
export function computeCenarioConvencional(input: BPInput): ResultadoCenario {
  const capex_total = sum(input.carregadores.map(c =>
    c.custo_capex_brl * c.quantidade
  ));

  // Receita mensal por carregador
  const kwhMensalPorCarregador = input.carregadores.map(c => {
    const util = estimateUtilization({
      tipo_local: input.tipo_local,
      frota_ev_municipio: input.frota_ev_municipio,
      carregadores_proximos: input.carregadores_proximos,
      potencia_kw: c.potencia_kw,
      tipo_carregador: c.tipo,
    });
    return util.kwh_dia_estimado * 30 * c.quantidade;
  });

  const kwh_total_mes = sum(kwhMensalPorCarregador);

  // Receita: cobrança por kWh + taxa de conexão por sessão (estima 1 sessão a cada X kWh)
  const sessoes_por_kwh = 0.04; // ~25 kWh por sessão média (BEV típico)
  const sessoes_mes = kwh_total_mes * sessoes_por_kwh;

  const receita_kwh = kwh_total_mes * input.preco_cobrado_kwh_brl;
  const receita_conexao = sessoes_mes * input.taxa_conexao_brl;
  const receita_mensal = receita_kwh + receita_conexao;

  // Custos
  const custo_energia = kwh_total_mes * input.tarifa_kwh_brl;
  const custo_internet = 80;        // assume PlugFácil cobra
  const custo_manutencao = capex_total * 0.005;  // 0.5%/mês = 6%/ano
  const custo_plataforma = receita_mensal * 0.08; // taxa de plataforma PlugFácil 8%
  const custo_total_mensal = custo_energia + custo_internet + custo_manutencao + custo_plataforma;

  const margem_bruta_mensal = receita_mensal - custo_total_mensal;

  // Payback simples (sem desconto)
  const payback_meses = capex_total / Math.max(margem_bruta_mensal, 1);

  // Fluxo de caixa mensal (60 meses, com reajustes anuais)
  const fluxo = buildMonthlyCashflow({
    initialInvestment: capex_total,
    monthlyRevenue: receita_mensal,
    monthlyVariableCost: custo_energia + custo_plataforma,
    monthlyFixedCost: custo_internet + custo_manutencao,
    months: input.horizonte_analise_meses,
    revenueGrowthAnnualPct: 8,  // crescimento da frota EV
    costGrowthAnnualPct: input.reajuste_tarifa_anual_pct,
    inflationAnnualPct: input.inflacao_anual_pct,
  });

  const npv = computeNPV(fluxo, input.taxa_desconto_anual_pct);
  const irr = computeIRR(fluxo);

  return {
    capex_total_brl: round(capex_total),
    receita_mensal_brl: round(receita_mensal),
    custo_energia_mensal_brl: round(custo_energia),
    custos_operacionais_mensal_brl: round(custo_internet + custo_manutencao + custo_plataforma),
    margem_bruta_mensal_brl: round(margem_bruta_mensal),
    payback_meses: round(payback_meses, 1),
    irr_5anos_pct: round(irr * 100, 1),
    npv_5anos_brl: round(npv),
    kwh_mensal_estimado: round(kwh_total_mes),
    sessoes_mensais_estimadas: round(sessoes_mes),
    fluxo_caixa_mensal: fluxo,
  };
}
```

## Cenário 2 — Solar fotovoltaico

```ts
// cenario-solar.ts
export function computeCenarioSolar(
  input: BPInput,
  baseConvencional: ResultadoCenario
): ResultadoCenario | null {

  if (!input.area_disponivel_m2 || input.area_disponivel_m2 < 20) {
    return null;  // sem área suficiente
  }

  // Dimensionamento solar
  // 1 kWp ocupa ~6 m². Painel atual gera ~1.3-1.6 kWh/kWp/dia × irradiação
  const kwp_maximo_area = input.area_disponivel_m2 / 6;
  const kwh_dia_por_kwp = input.irradiacao_kwh_m2_dia * 0.78;  // PR ~0.78
  const kwh_mes_por_kwp = kwh_dia_por_kwp * 30;

  // Dimensiona para cobrir 80-100% do consumo do eletroposto
  const kwh_alvo_mes = baseConvencional.kwh_mensal_estimado * 0.9;
  const kwp_necessario = kwh_alvo_mes / kwh_mes_por_kwp;
  const kwp_instalado = Math.min(kwp_necessario, kwp_maximo_area);

  const capex_solar = kwp_instalado * input.custo_solar_brl_kwp;
  const geracao_kwh_mes = kwp_instalado * kwh_mes_por_kwp;

  // Economia de energia: o que era custo da distribuidora vira "zero"
  // (na verdade compensação SCEE — fio B ainda é cobrado, simplifica para 75% economia)
  const fator_compensacao = 0.75;
  const economia_energia_mensal = Math.min(
    geracao_kwh_mes,
    baseConvencional.kwh_mensal_estimado
  ) * input.tarifa_kwh_brl * fator_compensacao;

  // CAPEX combinado
  const capex_total = baseConvencional.capex_total_brl + capex_solar;

  // Custos e receitas
  const custo_energia_residual = baseConvencional.custo_energia_mensal_brl - economia_energia_mensal;
  const custo_total_mensal = custo_energia_residual
    + baseConvencional.custos_operacionais_mensal_brl
    + capex_solar * 0.0008;  // manutenção solar 1%/ano

  const margem_bruta_mensal = baseConvencional.receita_mensal_brl - custo_total_mensal;
  const payback_meses = capex_total / Math.max(margem_bruta_mensal, 1);

  const fluxo = buildMonthlyCashflow({
    initialInvestment: capex_total,
    monthlyRevenue: baseConvencional.receita_mensal_brl,
    monthlyVariableCost: custo_energia_residual,
    monthlyFixedCost: baseConvencional.custos_operacionais_mensal_brl,
    months: input.horizonte_analise_meses,
    revenueGrowthAnnualPct: 8,
    costGrowthAnnualPct: input.reajuste_tarifa_anual_pct,
    inflationAnnualPct: input.inflacao_anual_pct,
  });

  return {
    capex_total_brl: round(capex_total),
    capex_solar_brl: round(capex_solar),
    kwp_instalado: round(kwp_instalado, 2),
    geracao_kwh_mes: round(geracao_kwh_mes),
    economia_energia_mensal_brl: round(economia_energia_mensal),
    receita_mensal_brl: baseConvencional.receita_mensal_brl,
    custo_energia_mensal_brl: round(custo_energia_residual),
    custos_operacionais_mensal_brl: round(baseConvencional.custos_operacionais_mensal_brl),
    margem_bruta_mensal_brl: round(margem_bruta_mensal),
    payback_meses: round(payback_meses, 1),
    irr_5anos_pct: round(computeIRR(fluxo) * 100, 1),
    npv_5anos_brl: round(computeNPV(fluxo, input.taxa_desconto_anual_pct)),
    fluxo_caixa_mensal: fluxo,
  };
}
```

## Cenário 3 — Mercado livre

```ts
// cenario-mercado-livre.ts
export function computeCenarioMercadoLivre(
  input: BPInput,
  baseConvencional: ResultadoCenario
): ResultadoCenario | null {

  if (!input.elegivel_mercado_livre) return null;
  if (!input.consumo_atual_total_kwh_mes) return null;

  // Mercado livre custa em média 25-35% menos que cativo para classe A
  // Aqui usamos o preço PPA fornecido (deve vir realista)

  const custo_energia_eletroposto_ml = baseConvencional.kwh_mensal_estimado * input.preco_ppa_estimado_kwh_brl;
  const economia_eletroposto = baseConvencional.custo_energia_mensal_brl - custo_energia_eletroposto_ml;

  // Custos adicionais de ACL: encargos de gestão (R$ 500-2000/mês dependendo do operador)
  const custo_acl_mensal = 1500;

  const custo_total_mensal = custo_energia_eletroposto_ml
    + baseConvencional.custos_operacionais_mensal_brl
    + custo_acl_mensal;

  const margem_bruta_mensal = baseConvencional.receita_mensal_brl - custo_total_mensal;

  // CAPEX adicional praticamente zero (sem novos equipamentos)
  // Migração de cativo para ACL leva 6 meses (CCEE). Penalidade modelada.

  return {
    capex_total_brl: baseConvencional.capex_total_brl,
    custo_acl_mensal_brl: custo_acl_mensal,
    economia_energia_mensal_brl: round(economia_eletroposto),
    receita_mensal_brl: baseConvencional.receita_mensal_brl,
    custo_energia_mensal_brl: round(custo_energia_eletroposto_ml),
    custos_operacionais_mensal_brl: round(baseConvencional.custos_operacionais_mensal_brl + custo_acl_mensal),
    margem_bruta_mensal_brl: round(margem_bruta_mensal),
    payback_meses: round(baseConvencional.capex_total_brl / margem_bruta_mensal, 1),
    irr_5anos_pct: round(/* recalc com fluxo */ 0, 1),  // TODO Sprint 4
    npv_5anos_brl: round(/* recalc */ 0),
    fluxo_caixa_mensal: [],
    nota: 'Mercado livre exige migração de 6 meses junto à CCEE. ' +
          'Cenário válido apenas se consumo atual já é > 500 MWh/ano (Lei 14.300).',
  };
}
```

## Funções financeiras

```ts
// finance.ts
export function computeNPV(cashflows: number[], annualRatePct: number): number {
  const monthlyRate = Math.pow(1 + annualRatePct / 100, 1 / 12) - 1;
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + monthlyRate, t), 0);
}

// Newton-Raphson para IRR mensal, depois anualiza
export function computeIRR(cashflows: number[], guess = 0.01): number {
  let rate = guess;
  for (let i = 0; i < 100; i++) {
    const { npv, derivative } = npvAndDerivative(cashflows, rate);
    if (Math.abs(npv) < 1e-6) break;
    const newRate = rate - npv / derivative;
    if (Math.abs(newRate - rate) < 1e-8) break;
    rate = newRate;
  }
  // anualiza
  return Math.pow(1 + rate, 12) - 1;
}

function npvAndDerivative(cf: number[], r: number) {
  let npv = 0, deriv = 0;
  for (let t = 0; t < cf.length; t++) {
    const denom = Math.pow(1 + r, t);
    npv += cf[t] / denom;
    if (t > 0) deriv -= t * cf[t] / Math.pow(1 + r, t + 1);
  }
  return { npv, derivative: deriv };
}

export function buildMonthlyCashflow(params: {
  initialInvestment: number;
  monthlyRevenue: number;
  monthlyVariableCost: number;
  monthlyFixedCost: number;
  months: number;
  revenueGrowthAnnualPct: number;
  costGrowthAnnualPct: number;
  inflationAnnualPct: number;
}): number[] {
  const out: number[] = [-params.initialInvestment];

  const revM = Math.pow(1 + params.revenueGrowthAnnualPct / 100, 1/12) - 1;
  const costM = Math.pow(1 + params.costGrowthAnnualPct / 100, 1/12) - 1;
  const fixedM = Math.pow(1 + params.inflationAnnualPct / 100, 1/12) - 1;

  for (let t = 1; t <= params.months; t++) {
    const rev = params.monthlyRevenue * Math.pow(1 + revM, t);
    const varCost = params.monthlyVariableCost * Math.pow(1 + costM, t);
    const fixCost = params.monthlyFixedCost * Math.pow(1 + fixedM, t);
    out.push(rev - varCost - fixCost);
  }
  return out;
}

function round(n: number, decimals = 0): number {
  const k = Math.pow(10, decimals);
  return Math.round(n * k) / k;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}
```

## Catálogo de equipamentos (CAPEX)

Mantido em `packages/bp-engine/catalog.ts`. Valores PlugFácil 2026 (atualizar via admin):

```ts
export const CATALOGO_CARREGADORES = {
  'ac_7kw_weg':   { potencia_kw: 7.4,  custo_capex_brl: 11000, descricao: 'Carregador AC WEG 7,4 kW (mono ou bi)' },
  'ac_22kw_weg':  { potencia_kw: 22,   custo_capex_brl: 18000, descricao: 'Carregador AC WEG 22 kW (trifásico)' },
  'dc_30kw_weg':  { potencia_kw: 30,   custo_capex_brl: 65000, descricao: 'Carregador DC WEG 30 kW' },
  'dc_40kw_weg':  { potencia_kw: 40,   custo_capex_brl: 78000, descricao: 'Carregador DC WEG 40 kW' },
  'dc_80kw_weg':  { potencia_kw: 80,   custo_capex_brl: 135000, descricao: 'Carregador DC WEG 80 kW' },
};

// Inclui também custos de instalação, civil, sinalização
export const CUSTOS_INSTALACAO = {
  obra_civil_base_brl: 8000,
  obra_civil_dc_extra_brl: 12000,
  cabeamento_base_brl: 4000,
  sinalizacao_brl: 1500,
};
```

## Recomendação automática de configuração

```ts
// recommend-config.ts
export function recomendarConfiguracao(input: {
  tipo_local: TipoLocal;
  potencia_maxima_disponivel_kw: number;
  frota_ev_municipio: number;
  area_disponivel_m2: number;
}): Array<{tipo, potencia_kw, custo_capex_brl, quantidade}> {

  // Aplica fator de segurança no padrão elétrico
  const potenciaUtil = input.potencia_maxima_disponivel_kw * 0.7;

  // Mapeia tipo de local para configuração ideal
  // Esses são heurísticos, atualizar baseado em vendas reais
  if (input.tipo_local === 'posto_combustivel' && potenciaUtil >= 80 && input.frota_ev_municipio > 300) {
    return [
      { ...CATALOGO_CARREGADORES.dc_80kw_weg, quantidade: 1 },
      { ...CATALOGO_CARREGADORES.ac_7kw_weg, quantidade: 2 },
    ];
  }
  // ... outras regras
  // Default conservador
  return [{ ...CATALOGO_CARREGADORES.ac_7kw_weg, quantidade: 1 }];
}
```

## Testes obrigatórios

`packages/bp-engine/__tests__/`:

1. `finance.test.ts` — NPV/IRR com casos conhecidos (validados contra Excel)
2. `cenario-convencional.test.ts` — 10 cenários representativos (residencial, shopping, posto)
3. `cenario-solar.test.ts` — incluindo caso sem área disponível
4. `cenario-mercado-livre.test.ts` — incluindo caso não elegível
5. `utilization-rate.test.ts` — clamps e edge cases
6. `recommend-config.test.ts` — cada tipo de local

**Critério:** todos os testes verdes antes de gerar 1 BP real.
