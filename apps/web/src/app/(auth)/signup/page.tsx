"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "", nome: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.nome },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <main className="min-h-screen bg-[#f0f4f5] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-4">📧</div>
          <h1 className="text-xl font-bold text-[#032135] mb-2">Confirme seu email</h1>
          <p className="text-gray-500 text-sm">Enviamos um link de confirmação para <strong>{form.email}</strong>. Clique no link para ativar sua conta.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f0f4f5] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-[#7db940] font-bold text-2xl">PlugFácil</span>
          <p className="text-gray-500 text-sm mt-2">Crie sua conta</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Nome</label>
              <input
                type="text"
                placeholder="Seu nome"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7db940]"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <input
                type="email"
                placeholder="seu@email.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7db940]"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Senha</label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7db940]"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#7db940] hover:bg-[#5c9423] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors mt-2"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
            <p className="text-sm text-center text-gray-500">
              Já tem conta?{" "}
              <Link href="/login" className="text-[#7db940] hover:underline">Entrar</Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
