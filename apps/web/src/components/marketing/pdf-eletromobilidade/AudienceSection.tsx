const PERFIS = [
  {
    emoji: "📈",
    titulo: "Investidor",
    desc: "Você quer entender se eletroposto faz sentido no seu portfólio antes de comprometer capital. Este relatório mostra os modelos, os custos e o que os números reais indicam.",
  },
  {
    emoji: "🏪",
    titulo: "Dono de estabelecimento",
    desc: "Posto, hotel, supermercado, restaurante. Você recebe os carros, quer saber se cabe um carregador e o que isso pode gerar para o seu negócio.",
  },
  {
    emoji: "🏢",
    titulo: "Síndico ou gestor predial",
    desc: "Seu condomínio já tem moradores com VE ou vai ter. Você precisa entender as opções antes de abrir licitação ou assinar qualquer proposta.",
  },
];

export function AudienceSection() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
          Para quem é este relatório
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Você não precisa ser engenheiro nem ter decidido nada ainda. Precisa só estar avaliando o
          setor com seriedade.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PERFIS.map((perfil) => (
            <div
              key={perfil.titulo}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
            >
              <div className="text-4xl mb-4">{perfil.emoji}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{perfil.titulo}</h3>
              <p className="text-gray-600 leading-relaxed">{perfil.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
