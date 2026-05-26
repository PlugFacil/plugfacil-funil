"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(form);

    if (error) {
      setError("Email ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          placeholder="••••••••"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7db940]"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
      </div>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-[#7db940] hover:bg-[#5c9423] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors mt-2"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
      <div className="flex justify-between text-sm text-gray-500">
        <Link href="/esqueci-senha" className="hover:text-[#7db940]">Esqueci a senha</Link>
        <Link href="/signup" className="hover:text-[#7db940]">Criar conta</Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f0f4f5] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-[#7db940] font-bold text-2xl">PlugFácil</span>
          <p className="text-gray-500 text-sm mt-2">Acesse sua conta</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
