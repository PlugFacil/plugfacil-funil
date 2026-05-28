"use client";

import { useState, useMemo } from "react";

const MODELOS = [
  { id: "essencial", label: "Essencial", investimento: 28000, ac: 2, dc: 0, descricao: "Hotéis e pousadas" },
  { id: "start", label: "Start", investimento: 75000, ac: 0, dc: 1, descricao: "Cafés e restaurantes" },
  { id: "pro", label: "PRO", investimento: 97000, ac: 1, dc: 1, descricao: "Postos e comércios" },
  { id: "turbo", label: "Turbo", investimento: 180000, ac: 2, dc: 1, descricao: "Shoppings e mercados" },
  { id: "hub", label: "HUB", investimento: 240000, ac: 3, dc: 1, descricao: "Eletropostos completos" },
];

// Taxas fixas (fonte: planilha APP_ROI)
const ROYALTIES = 0.12;         // PlugFácil variável
const TAXA_TUPI = 0.10;         // plataforma de gestão
const IMPOSTOS = 0.10;          // impostos sobre receita
const PROVISIONAMENTO = 0.08;   // reserva manutenção
const MENSALIDADE_TUPI = 50;    // R$/mês fixo
const PERDAS_TECNICAS = 0.05;   // 5% do kWh não faturado
const CDI_MENSAL = 0.0084;
const CDB_MENSAL = 0.0080;

// Consumo típico por carregador
const KWH_POR_SESSAO_AC = 7.4; // 1h de carga
const KWH_POR_SESSAO_DC = 15;  // 30min a 30kW

function fmt(val: number, decimais = 0) {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  });
}

function brl(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function pct(val: number, decimais = 1) {
  return `${(val * 100).toFixed(decimais)}%`;
}

export function RoiSimulator() {
  const [modeloId, setModeloId] = useState("pro");
  const [recargasAcDia, setRecargasAcDia] = useState(4);
  const [recargasDcDia, setRecargasDcDia] = useState(6);
  const [tarifaCobranca, setTarifaCobranca] = useState(2.70);
  const [tarifaEnergia, setTarifaEnergia] = useState(0.82);
  const [diasMes, setDiasMes] = useState(25);

  const modelo = MODELOS.find((m) => m.id === modeloId)!;

  const resultado = useMemo(() => {
    // kWh entregue já com perdas técnicas descontadas
    const kwhAcMes = modelo.ac * recargasAcDia * KWH_POR_SESSAO_AC * (1 - PERDAS_TECNICAS) * diasMes;
    const kwhDcMes = modelo.dc * recargasDcDia * KWH_POR_SESSAO_DC * (1 - PERDAS_TECNICAS) * diasMes;

    const faturamentoAcMes = kwhAcMes * tarifaCobranca;
    const faturamentoDcMes = kwhDcMes * tarifaCobranca;
    const faturamentoBruto = faturamentoAcMes + faturamentoDcMes;

    // Custo de energia: kWh consumido (sem desconto de perdas — paga tudo da distribuidora)
    const custoEnergiaMes =
      (modelo.ac * recargasAcDia * KWH_POR_SESSAO_AC + modelo.dc * recargasDcDia * KWH_POR_SESSAO_DC) *
      tarifaEnergia * diasMes;

    const descontosPercentual = faturamentoBruto * (ROYALTIES + TAXA_TUPI + IMPOSTOS + PROVISIONAMENTO);
    const descontos = descontosPercentual + MENSALIDADE_TUPI;
    const lucroLiquido = faturamentoBruto - custoEnergiaMes - descontos;

    const rendimentoMensalPct = lucroLiquido / modelo.investimento;
    const rendimentoAnualPct = Math.pow(1 + rendimentoMensalPct, 12) - 1;
    const paybackMeses = lucroLiquido > 0 ? Math.ceil(modelo.investimento / lucroLiquido) : null;

    // Projeção 10 anos
    const anos10Eletroposto = (() => {
      let acumulado = 0;
      for (let i = 0; i < 120; i++) acumulado += lucroLiquido;
      return acumulado;
    })();

    const anos10CDI = modelo.investimento * (Math.pow(1 + CDI_MENSAL, 120) - 1);
    const anos10CDB = modelo.investimento * (Math.pow(1 + CDB_MENSAL, 120) - 1);

    return {
      faturamentoBruto,
      custoEnergiaMes,
      descontos,
      lucroLiquido,
      rendimentoMensalPct,
      rendimentoAnualPct,
      paybackMeses,
      anos10Eletroposto,
      anos10CDI,
      anos10CDB,
      cdiMensalPct: CDI_MENSAL,
      cdbMensalPct: CDB_MENSAL,
    };
  }, [modelo, recargasAcDia, recargasDcDia, tarifaCobranca, tarifaEnergia, diasMes]);

  const inputClass =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent";
  const labelClass = "text-xs font-medium text-gray-600 mb-1 block";

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Header */}
      <div className="bg-[#032135] px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <span className="text-[#7db940] font-bold text-xl">PlugFácil</span>
          <span className="text-gray-500 text-sm">/</span>
          <span className="text-white text-sm">Simulador de Rendimento</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#032135] mb-2">
            Quanto rende um eletroposto?
          </h1>
          <p className="text-gray-500 text-sm">
            Ajuste os parâmetros e veja o rendimento mensal, anual e a comparação com CDI e CDB.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Painel de inputs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Configurar cenário</h2>

            {/* Modelo */}
            <div>
              <label className={labelClass}>Modelo de investimento</label>
              <div className="grid grid-cols-5 gap-1">
                {MODELOS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModeloId(m.id)}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                      modeloId === m.id
                        ? "bg-[#032135] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {modelo.descricao} · {brl(modelo.investimento)} investimento ·{" "}
                {modelo.ac > 0 ? `${modelo.ac}× AC 7,4kW` : ""}{modelo.ac > 0 && modelo.dc > 0 ? " + " : ""}
                {modelo.dc > 0 ? `${modelo.dc}× DC 30kW` : ""}
              </p>
            </div>

            {/* Recargas */}
            {modelo.ac > 0 && (
              <div>
                <label className={labelClass}>Recargas AC por carregador por dia</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={1} max={12} value={recargasAcDia}
                    onChange={(e) => setRecargasAcDia(Number(e.target.value))}
                    className="flex-1 accent-[#4CAF50]"
                  />
                  <span className="text-sm font-bold text-[#032135] w-6 text-right">{recargasAcDia}</span>
                </div>
              </div>
            )}

            {modelo.dc > 0 && (
              <div>
                <label className={labelClass}>Recargas DC por carregador por dia</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={1} max={24} value={recargasDcDia}
                    onChange={(e) => setRecargasDcDia(Number(e.target.value))}
                    className="flex-1 accent-[#4CAF50]"
                  />
                  <span className="text-sm font-bold text-[#032135] w-6 text-right">{recargasDcDia}</span>
                </div>
              </div>
            )}

            {/* Tarifa de cobrança */}
            <div>
              <label className={labelClass}>Preço cobrado por kWh (R$)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={1.50} max={4.00} step={0.10} value={tarifaCobranca}
                  onChange={(e) => setTarifaCobranca(Number(e.target.value))}
                  className="flex-1 accent-[#4CAF50]"
                />
                <span className="text-sm font-bold text-[#032135] w-10 text-right">
                  R$ {tarifaCobranca.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Tarifa de energia */}
            <div>
              <label className={labelClass}>Tarifa de energia da distribuidora (R$/kWh)</label>
              <input
                type="number" step="0.01" min="0.30" max="2.00"
                value={tarifaEnergia}
                onChange={(e) => setTarifaEnergia(Number(e.target.value))}
                className={inputClass}
              />
            </div>

            {/* Dias/mês */}
            <div>
              <label className={labelClass}>Dias de operação por mês</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={15} max={31} value={diasMes}
                  onChange={(e) => setDiasMes(Number(e.target.value))}
                  className="flex-1 accent-[#4CAF50]"
                />
                <span className="text-sm font-bold text-[#032135] w-6 text-right">{diasMes}</span>
              </div>
            </div>
          </div>

          {/* Painel de resultados */}
          <div className="space-y-4">
            {/* Rendimento */}
            <div className="bg-[#032135] rounded-2xl p-6 text-white">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">Rendimento do seu dinheiro</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Mensal</p>
                  <p className="text-3xl font-bold text-[#7db940]">
                    {pct(resultado.rendimentoMensalPct)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{brl(resultado.lucroLiquido)}/mês</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Anual</p>
                  <p className="text-3xl font-bold text-[#7db940]">
                    {pct(resultado.rendimentoAnualPct)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{brl(resultado.lucroLiquido * 12)}/ano</p>
                </div>
              </div>
              {resultado.paybackMeses && (
                <p className="text-xs text-gray-400">
                  Payback estimado: <span className="text-white font-semibold">{resultado.paybackMeses} meses</span>
                </p>
              )}
            </div>

            {/* Comparativo */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-4 font-semibold">
                Comparativo — rendimento mensal
              </p>
              {[
                { label: "Eletroposto PlugFácil", pct: resultado.rendimentoMensalPct, color: "bg-[#7db940]", destaque: true },
                { label: "CDI (referência mai/26)", pct: CDI_MENSAL, color: "bg-gray-300", destaque: false },
                { label: "CDB (100% CDI)", pct: CDB_MENSAL, color: "bg-gray-200", destaque: false },
              ].map((item) => {
                const max = Math.max(resultado.rendimentoMensalPct, CDI_MENSAL) * 1.1;
                return (
                  <div key={item.label} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={item.destaque ? "font-semibold text-gray-800" : "text-gray-500"}>{item.label}</span>
                      <span className={item.destaque ? "font-bold text-[#032135]" : "text-gray-500"}>
                        {pct(item.pct)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className={`${item.color} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min((item.pct / max) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Projeção 10 anos */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-4 font-semibold">
                Projeção 10 anos (reinvestindo lucros)
              </p>
              {[
                { label: "Eletroposto", val: resultado.anos10Eletroposto, color: "text-[#7db940]" },
                { label: "CDI", val: resultado.anos10CDI, color: "text-gray-600" },
                { label: "CDB", val: resultado.anos10CDB, color: "text-gray-500" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className={`text-sm font-bold ${item.color}`}>{brl(item.val)}</span>
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-3">
                Diferença eletroposto vs CDI:{" "}
                <span className="font-semibold text-[#032135]">
                  {brl(resultado.anos10Eletroposto - resultado.anos10CDI)} a mais
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Detalhamento */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-4 font-semibold">Detalhamento mensal</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-1">Faturamento bruto</p>
              <p className="font-bold text-gray-800">{brl(resultado.faturamentoBruto)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Custo de energia</p>
              <p className="font-bold text-red-500">- {brl(resultado.custoEnergiaMes)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Royalties 12% + Tupi 10% + Impostos 10% + Prov. 8% + R$50</p>
              <p className="font-bold text-red-500">- {brl(resultado.descontos)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Lucro líquido</p>
              <p className="font-bold text-[#7db940]">{brl(resultado.lucroLiquido)}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <a
            href="/plano-de-negocio"
            className="inline-block bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold py-4 px-10 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            Quero o Business Plan do meu endereço
          </a>
          <p className="text-xs text-gray-400 mt-3 max-w-md mx-auto">
            Projeções são estimativas baseadas em médias de mercado. A PlugFácil não garante retorno.
            Resultados reais variam conforme localização, fluxo de veículos elétricos e operação.
          </p>
        </div>
      </div>
    </div>
  );
}
