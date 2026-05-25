const CAPITULOS = [
  {
    num: "01",
    titulo: "Tamanho e crescimento do mercado",
    desc: "Não é achismo. São dados da ABVE, ANEEL e do campo. Frota atual, projeções e onde o crescimento está acontecendo de verdade.",
  },
  {
    num: "02",
    titulo: "Tipos de carregadores",
    desc: "AC 7,4kW, DC 30kW, DC 80kW: quando usar cada um sem gastar errado. A potência certa para o ponto certo.",
  },
  {
    num: "03",
    titulo: "Como funciona o setor",
    desc: "Operador, host, motorista, roaming. Quem ganha o quê em cada modelo. O fluxo de dinheiro explicado sem jargão.",
  },
  {
    num: "04",
    titulo: "Modelos de negócio",
    desc: "Revenue share, aluguel, venda direta. Números reais de cada modelo. Qual faz mais sentido para o seu perfil.",
  },
  {
    num: "05",
    titulo: "Custo de energia e margem",
    desc: "Conta completa: energia, manutenção, plataforma. Sobra quanto? Com exemplos numéricos reais, não simulações otimistas.",
  },
  {
    num: "06",
    titulo: "Estudo de caso simulado",
    desc: "3 cenários detalhados: condomínio residencial, posto de gasolina e estabelecimento de alto fluxo.",
  },
  {
    num: "07",
    titulo: "Regulação e ART",
    desc: "O que é obrigatório, o que é opcional e o que pode travar sua instalação. Normas ABNT, ANEEL e Corpo de Bombeiros.",
  },
  {
    num: "08",
    titulo: "Próximos passos",
    desc: "Se fizer sentido para você, mostramos o próximo nível: uma análise personalizada do seu ponto com IA.",
  },
];

export function ContentSection() {
  return (
    <section className="bg-[#0d0d0d] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4">
          O que está dentro do relatório
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          40 páginas. Sem enrolação. Cada capítulo responde uma pergunta que quem está avaliando o
          setor precisa de resposta antes de tomar qualquer decisão.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {CAPITULOS.map((cap) => (
            <div
              key={cap.num}
              className="flex gap-4 bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/8 transition-colors"
            >
              <span className="text-3xl font-bold text-[#4CAF50]/40 flex-shrink-0 w-12">
                {cap.num}
              </span>
              <div>
                <h3 className="font-semibold text-white mb-2">{cap.titulo}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{cap.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Autoridade */}
        <div className="bg-white/5 border border-[#4CAF50]/20 rounded-2xl p-8 max-w-3xl mx-auto text-center">
          <p className="text-gray-300 leading-relaxed">
            Esse relatório não foi escrito por consultor de slide. Foi escrito por quem instala e
            opera eletropostos no Brasil.{" "}
            <span className="text-white font-medium">
              A PlugFácil é integradora certificada WEG e parceira da Tupi
            </span>
            , a maior plataforma de recarga do Brasil, com mais de 300 mil motoristas cadastrados.
            Sabemos o que funciona e o que não funciona porque somos nós que chegamos no campo.
          </p>
        </div>
      </div>
    </section>
  );
}
