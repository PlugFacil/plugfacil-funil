import { BpPurchaseCard } from "@/components/marketing/bp/BpPurchaseCard";
import { LpFooter } from "@/components/marketing/pdf-eletromobilidade/LpFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Plan de Eletroposto com IA — PlugFácil",
  description:
    "Informe o endereço do seu ponto, mande a foto do padrão elétrico e receba em até 5 horas um Business Plan completo: frota EV local, concorrência, modelagem financeira em 3 cenários e recomendação técnica. R$ 290.",
  openGraph: {
    title: "Business Plan de Eletroposto com IA — PlugFácil",
    description:
      "Análise personalizada do seu endereço com inteligência artificial. Frota EV, concorrência, payback, IRR e recomendação técnica. Entrega em até 5 horas.",
    type: "website",
  },
};

export default async function PlanoDeNegocioPage({
  searchParams,
}: {
  searchParams: Promise<{ cupom?: string }>;
}) {
  const { cupom } = await searchParams;

  const steps = [
    {
      n: "1",
      title: "Você informa o endereço",
      desc: "CEP, tipo de local (posto, condomínio, shopping, hotel) e envia até 3 fotos da vaga e do padrão elétrico.",
    },
    {
      n: "2",
      title: "A IA analisa tudo",
      desc: "Frota EV no município, carregadores concorrentes no raio de 5km, tarifa da distribuidora local, irradiação solar e padrão elétrico disponível.",
    },
    {
      n: "3",
      title: "Você recebe o documento completo",
      desc: "Business Plan em PDF com 3 cenários financeiros (convencional, solar, mercado livre), payback, TIR e recomendação técnica de qual carregador instalar.",
    },
  ];

  const includes = [
    "Análise da frota EV no seu município (dados ABVE)",
    "Mapa de carregadores concorrentes num raio de 5km",
    "Tarifa real da sua distribuidora (dados ANEEL)",
    "Análise visual do padrão elétrico via IA",
    "Recomendação de qual carregador instalar e por que",
    "Modelagem financeira: cenário convencional",
    "Modelagem financeira: cenário solar fotovoltaico",
    "Modelagem financeira: cenário mercado livre (se aplicável)",
    "Payback, TIR e VPL de cada cenário",
    "Riscos e mitigações do seu caso específico",
    "Roadmap de implementação turn-key PlugFácil",
    "CTA para agendamento de conversa com o time técnico",
  ];

  const faqs = [
    {
      q: "Em quanto tempo recebo o Business Plan?",
      a: "Até 5 horas após o envio dos dados. Na maioria dos casos chega em menos de 2 horas. Você recebe um email de confirmação quando começamos a processar e outro quando o PDF estiver pronto.",
    },
    {
      q: "Precisa de conhecimento técnico para preencher o formulário?",
      a: "Não. Você informa o CEP, o tipo de local, e manda foto da vaga e do quadro elétrico. A IA faz o resto. Se a foto do quadro estiver ruim, pedimos uma nova antes de prosseguir.",
    },
    {
      q: "O Business Plan substitui um projeto elétrico assinado?",
      a: "Não. O BP é uma análise preliminar para ajudar na decisão de investimento. A instalação real exige projeto elétrico com ART assinado por engenheiro habilitado. A PlugFácil oferece esse serviço como parte do contrato de implementação.",
    },
    {
      q: "E se eu já comprei o relatório de mercado?",
      a: "Faz sentido seguir para o BP. O relatório cobre o mercado em geral. O BP analisa especificamente o seu endereço com os dados reais da sua região.",
    },
    {
      q: "O que acontece depois do BP?",
      a: "O documento termina com um CTA para agendar 30 minutos com o time PlugFácil. Sem custo adicional nessa etapa. É a hora de revisar os números juntos e ver se faz sentido seguir para implementação.",
    },
  ];

  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="bg-gradient-to-br from-[#032135] via-[#11364e] to-[#2f4d10] min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#7db940]/20 border border-[#7db940]/30 rounded-full px-4 py-2 mb-8">
                <span className="w-2 h-2 rounded-full bg-[#7db940] animate-pulse" />
                <span className="text-[#7db940] text-sm font-medium">
                  Entrega em até 5 horas. 100% gerado por IA com dados reais.
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white mb-6">
                Business Plan do seu eletroposto.{" "}
                <span className="text-[#7db940]">
                  Com os dados reais do seu endereço.
                </span>
              </h1>

              <p className="text-lg text-gray-300 mb-8 max-w-xl">
                Informe o CEP e mande a foto do ponto. Em até 5 horas você recebe um documento completo com análise de mercado local, modelagem financeira em 3 cenários e recomendação técnica de qual carregador instalar.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <span className="text-[#7db940]">✓</span> Frota EV do seu município
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-[#7db940]">✓</span> Tarifa real da sua distribuidora
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-[#7db940]">✓</span> 3 cenários financeiros
                </span>
              </div>
            </div>

            <div>
              <BpPurchaseCard cupom={cupom} />
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-24 bg-[#f0f4f5]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#032135] mb-4">
            Como funciona
          </h2>
          <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
            Três passos. Sem reunião prévia, sem questionário longo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.n} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-[#7db940] rounded-xl flex items-center justify-center text-white font-bold text-xl mb-6">
                  {s.n}
                </div>
                <h3 className="text-lg font-bold text-[#032135] mb-3">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O QUE ESTÁ INCLUÍDO */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#032135] mb-4">
            O que está no documento
          </h2>
          <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
            Um Business Plan completo, não um template genérico. Cada seção é gerada com os dados reais do seu endereço.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {includes.map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 rounded-xl bg-[#f0f4f5]">
                <span className="text-[#7db940] font-bold mt-0.5 flex-shrink-0">✓</span>
                <p className="text-gray-700 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DISCLAIMER TÉCNICO */}
      <section className="py-12 bg-[#f0f4f5]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong>Aviso técnico:</strong> Este Business Plan é uma análise preliminar gerada por inteligência artificial com base em dados estimados e nas informações fornecidas pelo usuário. Não substitui projeto elétrico assinado por engenheiro habilitado com ART. O dimensionamento final deve ser validado por profissional habilitado antes de qualquer execução. Projeções financeiras são estimativas. A PlugFácil não garante retorno.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-[#032135] mb-16">
            Perguntas frequentes
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-gray-100 pb-6">
                <h3 className="font-semibold text-[#032135] mb-2">{faq.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 bg-gradient-to-br from-[#032135] to-[#11364e]">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Chega de adivinhar se o seu ponto vai funcionar.
          </h2>
          <p className="text-gray-300 mb-12">
            Em até 5 horas você tem os números do seu endereço específico. Sem reunião, sem vendedor, sem compromisso.
          </p>
          <div className="max-w-md mx-auto">
            <BpPurchaseCard cupom={cupom} />
          </div>
        </div>
      </section>

      <LpFooter />
    </main>
  );
}
