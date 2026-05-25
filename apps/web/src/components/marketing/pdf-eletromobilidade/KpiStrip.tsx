const KPIS = [
  {
    numero: "1 para 63",
    label: "carros por carregador",
    detalhe: "déficit crítico de infraestrutura no Brasil",
  },
  {
    numero: "300 mil",
    label: "motoristas na Tupi",
    detalhe: "maior plataforma de recarga do Brasil",
  },
  { numero: "80%+", label: "crescimento ao ano", detalhe: "vendas de veículos elétricos (ABVE)" },
  { numero: "R$ 3 bi", label: "até 2028", detalhe: "movimentação estimada no setor de recarga" },
  {
    numero: "BYD",
    label: "fábrica na Bahia",
    detalhe: "maior montadora de VE do mundo chega ao Brasil",
  },
  {
    numero: "SP já exige",
    label: "em novos empreendimentos",
    detalhe: "infraestrutura de recarga obrigatória",
  },
];

export function KpiStrip() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
          O mercado não está esperando
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Estes números são de fontes públicas — ABVE, ANEEL e do que vemos no campo todos os dias.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {KPIS.map((kpi) => (
            <div
              key={kpi.numero}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center"
            >
              <p className="text-3xl font-bold text-[#4CAF50] mb-1">{kpi.numero}</p>
              <p className="font-semibold text-gray-900 text-sm mb-1">{kpi.label}</p>
              <p className="text-xs text-gray-500">{kpi.detalhe}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
