const PERFIS = [
  {
    emoji: "📈",
    titulo: "Investidor",
    desc: "Você quer saber se eletroposto faz sentido no seu portfólio antes de comprometer capital. O relatório mostra os modelos, os custos reais e o que os números indicam. Sem promessa de retorno garantido.",
  },
  {
    emoji: "🏪",
    titulo: "Dono de estabelecimento",
    desc: "Posto, hotel, supermercado, restaurante. Você recebe os carros e quer saber se cabe um carregador, o que isso pode gerar e quem opera. Explicamos cada modelo de parceria.",
  },
  {
    emoji: "🏢",
    titulo: "Sindico ou gestor predial",
    desc: "Seu condomínio já tem moradores com VE ou vai ter em breve. Com o governo injetando R$ 31 bilhões para financiar VEs via MP Move Aplicativos, a pressão vai aumentar. Entenda as opções antes de assinar qualquer proposta.",
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
          Você nao precisa ser engenheiro nem ter decidido nada ainda. Precisa só estar avaliando o
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
