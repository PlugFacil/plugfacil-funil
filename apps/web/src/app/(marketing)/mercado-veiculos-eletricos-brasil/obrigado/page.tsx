import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Compra confirmada — PlugFácil",
  robots: { index: false },
};

export default function ObrigadoPage() {
  return (
    <main className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#4CAF50]/20 mb-8">
          <span className="text-4xl">✅</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Compra confirmada!</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Seu relatório está a caminho. Verifique o email que você cadastrou nos próximos 5 minutos.
          Se não encontrar, confira a caixa de spam.
        </p>

        {/* Plant sutil do Produto 2 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 text-left">
          <p className="text-white font-semibold mb-3">Enquanto o relatório chega…</p>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">
            Muitos que leem o relatório querem dar o próximo passo: entender se o{" "}
            <strong className="text-white">seu ponto específico</strong> é viável — com análise de
            mercado local, dados energéticos e modelagem financeira. Nosso time faz isso com IA em
            menos de 48h.
          </p>
          <a
            href="https://wa.me/5512988506961?text=Olá!%20Acabei%20de%20comprar%20o%20relatório%20e%20quero%20saber%20mais%20sobre%20o%20Plano%20de%20Negócio."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#4CAF50] font-medium hover:underline text-sm"
          >
            Falar com a PlugFácil →
          </a>
        </div>

        {/* Compartilhamento */}
        <a
          href="https://wa.me/?text=Encontrei%20este%20relatório%20sobre%20o%20mercado%20de%20eletropostos%20no%20Brasil%20—%20acho%20que%20pode%20te%20interessar%3A%20https://plugfacil.com.br/mercado-veiculos-eletricos-brasil"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          💬 Compartilhar no WhatsApp
        </a>

        <div className="mt-12">
          <Link href="/" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </main>
  );
}
