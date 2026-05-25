"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Isso é para investidor ou para engenheiro?",
    a: "Para quem precisa entender o mercado antes de qualquer decisão, técnica ou financeira. O relatório é direto, sem fórmula de engenharia e sem jargão de investimento.",
  },
  {
    q: "Os dados são atualizados?",
    a: "Sim. Usamos dados da ABVE, ANEEL e do que observamos no campo. Incluímos os movimentos mais recentes: BYD com fábrica no Brasil, Cadillac voltando ao mercado e o programa federal de R$ 31 bilhões para financiar VEs.",
  },
  {
    q: "Tem suporte após a compra?",
    a: "Sim. Responda o email de entrega com sua dúvida. Nossa equipe responde em até 1 dia útil.",
  },
  {
    q: "É um curso ou um relatório?",
    a: "É um relatório objetivo, 40 páginas, sem enrolação. Você lê no ritmo que quiser, no celular ou no computador.",
  },
  {
    q: "Como recebo?",
    a: "No email cadastrado, em até 5 minutos após confirmar o pagamento. Se nao encontrar, olha no spam.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
          Perguntas frequentes
        </h2>

        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <div key={faq.q} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                <span className="text-[#4CAF50] flex-shrink-0 text-xl">
                  {open === i ? "−" : "+"}
                </span>
              </button>
              {open === i && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
