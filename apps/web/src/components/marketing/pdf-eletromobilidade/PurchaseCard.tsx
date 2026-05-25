"use client";

import { useState } from "react";

const PERFIS = [
  { value: "", label: "Qual o seu perfil?" },
  { value: "investidor", label: "Investidor buscando renda" },
  { value: "estabelecimento", label: "Dono de estabelecimento" },
  { value: "sindico", label: "Síndico ou gestor predial" },
  { value: "curioso", label: "Só quero entender o mercado" },
];

interface PurchaseCardProps {
  dark?: boolean;
}

export function PurchaseCard({ dark = false }: PurchaseCardProps) {
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
        body: JSON.stringify({ ...form, produto: "pdf_mercado" }),
      });

      if (!res.ok) throw new Error("Erro ao salvar lead");

      const { checkoutUrl } = (await res.json()) as { checkoutUrl: string };
      window.location.href = checkoutUrl;
    } catch {
      setError("Algo deu errado. Tente novamente.");
      setLoading(false);
    }
  }

  const cardClass = dark
    ? "bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
    : "bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20";

  const labelClass = dark
    ? "text-sm font-medium text-gray-200 mb-1 block"
    : "text-sm font-medium text-gray-700 mb-1 block";
  const inputClass =
    "w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition-all";

  return (
    <div className={cardClass}>
      <p
        className={
          dark
            ? "text-center font-semibold text-white mb-6"
            : "text-center font-semibold text-gray-900 mb-6"
        }
      >
        Acesse o relatório agora
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="nome" className={labelClass}>
            Seu nome
          </label>
          <input
            id="nome"
            type="text"
            placeholder="Como prefere ser chamado?"
            className={inputClass}
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Seu melhor email
          </label>
          <input
            id="email"
            type="email"
            placeholder="onde você recebe o PDF"
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="whatsapp" className={labelClass}>
            WhatsApp
          </label>
          <input
            id="whatsapp"
            type="tel"
            placeholder="(12) 99999-9999"
            className={inputClass}
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1">
            Só para enviar o link direto. Sem spam, sem grupo.
          </p>
        </div>

        <div>
          <label htmlFor="perfil" className={labelClass}>
            Qual seu perfil?
          </label>
          <select
            id="perfil"
            className={inputClass}
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
          className="bg-[#4CAF50] hover:bg-[#43A047] disabled:opacity-60 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] w-full mt-2"
        >
          {loading ? "Redirecionando..." : "Quero o relatório, R$ 49,90"}
        </button>

        <p className="text-xs text-center text-gray-400">
          🔒 Pagamento seguro via Stripe
        </p>
      </form>
    </div>
  );
}
