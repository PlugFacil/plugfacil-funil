import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pedido recebido — PlugFácil",
  robots: { index: false },
};

export default function ObrigadoBpPage() {
  return (
    <main className="min-h-screen bg-[#032135] flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#7db940]/20 mb-8">
          <span className="text-4xl">✅</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Pedido recebido.</h1>
        <p className="text-gray-300 mb-8 leading-relaxed">
          Agora é com a gente. Você vai receber um email confirmando o início do processamento. O Business Plan completo chega em até 5 horas.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 text-left">
          <p className="text-[#7db940] font-semibold mb-4">O que acontece agora:</p>
          <ol className="space-y-3">
            {[
              "Você recebe um email confirmando que recebemos seu pedido",
              "Nossa IA analisa frota EV, concorrência, tarifa e padrão elétrico do seu ponto",
              "Você recebe o Business Plan completo em PDF por email",
              "Opcionalmente, agendamos 30 minutos para revisar os números juntos",
            ].map((item, i) => (
              <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                <span className="w-6 h-6 rounded-full bg-[#7db940]/20 text-[#7db940] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>

        <p className="text-gray-500 text-sm mb-8">
          Duvida ou problema? Responde o email de confirmação ou fala direto no WhatsApp.
        </p>

        <a
          href="https://wa.me/5512988506961?text=Olá!%20Acabei%20de%20solicitar%20o%20Business%20Plan%20e%20tenho%20uma%20dúvida."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#7db940] hover:bg-[#5c9423] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm mb-8"
        >
          💬 Falar com a PlugFácil
        </a>

        <div className="mt-4">
          <Link href="/" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
            Voltar para o início
          </Link>
        </div>
      </div>
    </main>
  );
}
