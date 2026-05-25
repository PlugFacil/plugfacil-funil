const KPIS = [
  {
    numero: "1 para 63",
    label: "carros por carregador",
    detalhe: "Faltam eletropostos. O déficit é real e quem entrar agora pega o melhor da curva.",
  },
  {
    numero: "300 mil+",
    label: "motoristas já conectados",
    detalhe: "Usuários ativos na Tupi, a maior plataforma de recarga do Brasil.",
  },
  {
    numero: "80%+",
    label: "crescimento ao ano",
    detalhe: "Vendas de VEs no Brasil segundo a ABVE. Não é projeção, é o que já aconteceu.",
  },
  {
    numero: "R$ 3 bi",
    label: "em movimento até 2028",
    detalhe: "Estimativa do setor de recarga. O dinheiro está se posicionando agora.",
  },
  {
    numero: "BYD + GM",
    label: "apostando no Brasil",
    detalhe: "BYD com fábrica na Bahia. Cadillac chegando. Captiva PHEV confirmada para 2025.",
  },
  {
    numero: "R$ 31 bi",
    label: "do governo federal",
    detalhe: "MP Move Aplicativos financia VEs até R$ 150 mil para taxistas e motoristas de app.",
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
          Dados da ABVE, ANEEL e do que vemos no campo. Sem enfeite.
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
