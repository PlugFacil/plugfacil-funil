"use client";

import { useState } from "react";

const PERFIS = [
  { value: "", label: "Qual o seu perfil?" },
  { value: "investidor", label: "Investidor buscando renda" },
  { value: "estabelecimento", label: "Dono de estabelecimento" },
  { value: "sindico", label: "Síndico ou gestor predial" },
  { value: "construtora", label: "Construtora ou incorporadora" },
  { value: "outro", label: "Outro" },
];

export function BpPurchaseCard({ cupom }: { cupom?: string }) {
  const [form, setForm] = useState({ nome: "", email: "", whatsapp: "", perfil: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.nome || !form.email || !form.whatsapp || !form.perfil) {
      setError("Preencha todos os campos para continuar.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, produto: "business_plan", cupom }),
      });

      if (!res.ok) throw new Error("Erro ao salvar lead");

      const { checkoutUrl } = (await res.json()) as { checkoutUrl: string };
      window.location.href = checkoutUrl;
    } catch {
      setError("Algo deu errado. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
      <div className="text-center mb-6">
        {cupom ? (
          <>
            <p className="text-sm text-gray-500 line-through mb-1">De R$ 290,00</p>
            <p className="text-3xl font-bold text-[#457216]">R$ 232,00</p>
            <p className="text-xs text-[#7db940] font-semibold mt-1">Cupom {cupom} aplicado</p>
          </>
        ) : (
          <p className="text-3xl font-bold text-gray-900">R$ 290,00</p>
        )}
        <p className="text-sm text-gray-500 mt-1">pagamento único, sem assinatura</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="bp-nome" className="text-sm font-medium text-gray-700 mb-1 block">
            Seu nome
          </label>
          <input
            id="bp-nome"
            type="text"
            placeholder="Como prefere ser chamado?"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7db940] focus:border-transparent transition-all"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="bp-email" className="text-sm font-medium text-gray-700 mb-1 block">
            Seu melhor email
          </label>
          <input
            id="bp-email"
            type="email"
            placeholder="onde você recebe o Business Plan"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7db940] focus:border-transparent transition-all"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="bp-whatsapp" className="text-sm font-medium text-gray-700 mb-1 block">
            WhatsApp
          </label>
          <input
            id="bp-whatsapp"
            type="tel"
            placeholder="(12) 99999-9999"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7db940] focus:border-transparent transition-all"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1">Vamos confirmar o recebimento por aqui.</p>
        </div>

        <div>
          <label htmlFor="bp-perfil" className="text-sm font-medium text-gray-700 mb-1 block">
            Qual seu perfil?
          </label>
          <select
            id="bp-perfil"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7db940] focus:border-transparent transition-all"
            value={form.perfil}
            onChange={(e) => setForm({ ...form, perfil: e.target.value })}
          >
            {PERFIS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-[#7db940] hover:bg-[#5c9423] disabled:opacity-60 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] w-full mt-2"
        >
          {loading ? "Redirecionando..." : "Gerar meu Business Plan"}
        </button>

        <p className="text-xs text-center text-gray-400">
          🔒 Pagamento seguro via Stripe. Entrega em até 5 horas.
        </p>
      </form>
    </div>
  );
}
