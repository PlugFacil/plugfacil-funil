import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KPIs de Tráfego — PlugFácil",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const PERSONAS: Record<string, string> = {
  investidor: "Investidor",
  sindico: "Síndico",
  supermercado: "Supermercado",
  "posto-gasolina": "Posto de Gasolina",
  hotel: "Hotel",
  "cafe-restaurante": "Café / Restaurante",
  concessionaria: "Concessionária",
  shopping: "Shopping",
  canhao: "Canhão (geral)",
};

function pct(n: number, d: number) {
  if (!d) return "—";
  return `${((n / d) * 100).toFixed(1)}%`;
}

export default async function TrafegoPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const params = await searchParams;
  const adminKey = process.env.ADMIN_SECRET_KEY ?? "plugfacil2026admin";
  if (params.key !== adminKey) redirect(`/admin/trafego?key=${adminKey}`);

  const supabase = createAdminClient();

  // Todos os leads do Canhão (origens das LPs)
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  const all = (leads ?? []).filter((l) =>
    Object.keys(PERSONAS).includes(l.produto ?? ""),
  );

  // Leads por persona
  const byPersona: Record<string, { total: number; qualificados: number }> = {};
  for (const l of all) {
    const p = l.produto ?? "canhao";
    if (!byPersona[p]) byPersona[p] = { total: 0, qualificados: 0 };
    byPersona[p].total++;
    if (l.status === "qualificado") byPersona[p].qualificados++;
  }

  const personasOrdenadas = Object.entries(byPersona).sort((a, b) => b[1].total - a[1].total);
  const maxTotal = Math.max(...personasOrdenadas.map(([, v]) => v.total), 1);

  // Leads por dia (últimos 14 dias)
  const hoje = new Date();
  const dias: { label: string; total: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const dateStr = d.toISOString().slice(0, 10);
    const count = all.filter((l) => l.created_at?.slice(0, 10) === dateStr).length;
    dias.push({ label, total: count });
  }

  const maxDia = Math.max(...dias.map((d) => d.total), 1);

  // UTM sources
  const utmCount: Record<string, number> = {};
  for (const l of all) {
    const s = l.utm_source ?? "direto";
    utmCount[s] = (utmCount[s] ?? 0) + 1;
  }
  const utmOrdenado = Object.entries(utmCount).sort((a, b) => b[1] - a[1]);

  return (
    <main className="min-h-screen bg-[#f0f4f5]">
      <div className="bg-[#032135] px-8 py-5 flex items-center gap-4">
        <span className="text-[#7db940] font-bold text-xl">PlugFácil</span>
        <span className="text-gray-500 text-sm">/</span>
        <span className="text-white text-sm">KPIs de Tráfego — Canhão de Vendas</span>
        <div className="ml-auto flex gap-4 text-sm">
          <a href={`/admin/leads?key=${adminKey}`} className="text-gray-400 hover:text-white transition-colors">Leads</a>
          <a href={`/admin/kpis?key=${adminKey}`} className="text-gray-400 hover:text-white transition-colors">KPIs Funil</a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* KPIs globais */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Visão geral</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total leads Canhão", value: String(all.length) },
              { label: "Personas ativas", value: String(Object.keys(byPersona).length) },
              { label: "Leads hoje", value: String(dias[dias.length - 1]?.total ?? 0) },
              { label: "Leads esta semana", value: String(dias.slice(-7).reduce((s, d) => s + d.total, 0)) },
            ].map((k) => (
              <div key={k.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{k.label}</p>
                <p className="text-3xl font-bold text-[#032135]">{k.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Leads por persona */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Leads por persona</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {personasOrdenadas.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum lead ainda. Compartilhe as LPs e os leads aparecerão aqui.</p>
            ) : (
              <div className="space-y-4">
                {personasOrdenadas.map(([persona, data]) => (
                  <div key={persona}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">{PERSONAS[persona] ?? persona}</span>
                        <a
                          href={`/franquia/${persona}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#7db940] text-xs hover:underline"
                        >
                          ver LP →
                        </a>
                      </div>
                      <span className="font-bold text-[#032135]">{data.total} leads</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-[#7db940] h-2.5 rounded-full transition-all"
                        style={{ width: `${(data.total / maxTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Leads por dia */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Leads últimos 14 dias</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-end gap-2 h-32">
              {dias.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: "96px" }}>
                    <div
                      className="w-full bg-[#032135] rounded-t"
                      style={{ height: `${(d.total / maxDia) * 96}px`, minHeight: d.total ? "4px" : "0" }}
                      title={`${d.total} leads`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* UTM Sources */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Origem dos leads (UTM source)</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {utmOrdenado.length === 0 ? (
              <p className="text-gray-400 text-sm">Sem dados de UTM ainda. Configure as URLs dos anúncios com ?utm_source=meta&utm_medium=paid&utm_campaign=[persona]</p>
            ) : (
              <div className="space-y-3">
                {utmOrdenado.map(([source, count]) => (
                  <div key={source} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-32 capitalize">{source}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-[#00AFCE] h-2.5 rounded-full"
                        style={{ width: `${(count / all.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-20 text-right">
                      {count} ({pct(count, all.length)})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* UTM padrão para anúncios */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">URLs para anúncios Meta Ads</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-xs text-gray-500 mb-4">Copie e use como URL de destino nos anúncios. Os UTMs aparecem automaticamente no dashboard acima.</p>
            <div className="space-y-2">
              {Object.keys(PERSONAS).filter(p => p !== "canhao").map((persona) => (
                <div key={persona} className="flex items-center gap-3 text-xs font-mono bg-gray-50 rounded-lg px-4 py-2.5">
                  <span className="text-gray-500 w-32 shrink-0">{PERSONAS[persona]}</span>
                  <span className="text-[#032135] truncate">
                    {`https://plugfacil-funil-web.vercel.app/franquia/${persona}?utm_source=meta&utm_medium=paid&utm_campaign=${persona}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <p className="text-xs text-gray-400 text-right">Atualiza ao recarregar. Dados em tempo real do Supabase.</p>
      </div>
    </main>
  );
}
