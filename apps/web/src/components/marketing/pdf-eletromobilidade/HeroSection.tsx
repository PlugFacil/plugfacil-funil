import { PurchaseCard } from "./PurchaseCard";

export function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-[#0d0d0d] via-[#1a1a1a] to-[#1b3a1c] min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-16 items-center">
          {/* Texto */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#4CAF50]/20 border border-[#4CAF50]/30 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse" />
              <span className="text-[#4CAF50] text-sm font-medium">
                1 carregador para cada 63 carros no Brasil
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white mb-6">
              Todo mundo fala que eletroposto é o futuro.{" "}
              <span className="text-[#4CAF50]">
                Quase ninguém explica como o negócio funciona de verdade.
              </span>
            </h1>

            <p className="text-lg text-gray-300 mb-8 max-w-xl">
              Este relatório mostra os números reais do mercado brasileiro de recarga. Sem promessa
              de retorno garantido, sem achismo. Dados, modelos e o que aprendemos operando
              eletropostos no Brasil.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <span className="text-[#4CAF50]">✓</span> 40+ páginas
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#4CAF50]">✓</span> Dados ABVE e ANEEL atualizados
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#4CAF50]">✓</span> 7 dias de garantia
              </span>
            </div>
          </div>

          {/* Formulário */}
          <div>
            <PurchaseCard />
          </div>
        </div>

        {/* Bullets de problema */}
        <div className="mt-20 border-t border-white/10 pt-16">
          <p className="text-gray-400 text-center mb-10 text-sm uppercase tracking-widest">
            Se você está pensando em investir em eletroposto, provavelmente já se perguntou:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Você já ouviu que VE é tendência. Mas não sabe se a demanda é real na sua cidade.",
              "Todo mundo fala em renda recorrente. Ninguém mostra o custo de energia no detalhe.",
              "Quer saber qual carregador faz sentido — AC, DC, potência — sem virar engenheiro.",
              "Só encontrou conteúdo de 2021 ou material de fornecedor vendendo equipamento.",
              "Quer comparar franquia, parceria e cessão — mas ninguém explica a diferença de forma clara.",
              "Não sabe se o seu ponto é viável antes de contratar um engenheiro.",
            ].map((bullet) => (
              <div key={bullet} className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
                <span className="text-[#4CAF50] mt-0.5 flex-shrink-0">→</span>
                <p className="text-gray-300 text-sm">{bullet}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
