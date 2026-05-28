import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KPIs — PlugFácil",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

function kpiCard(label: string, value: string, sub?: string, color = "text-[#032135]") {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function pct(num: number, den: number) {
  if (!den) return "0%";
  return `${((num / den) * 100).toFixed(1)}%`;
}

function brl(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function KpisPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const params = await searchParams;
  const adminKey = process.env.ADMIN_SECRET_KEY ?? "plugfacil2026admin";
  if (params.key !== adminKey) redirect(`/admin/kpis?key=${adminKey}`);

  const supabase = createAdminClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  const all = leads ?? [];
  const pagos = all.filter((l) => l.status === "paid");
  const pdfs = pagos.filter((l) => l.produto === "pdf_mercado");
  const bps = pagos.filter((l) => l.produto === "business_plan");

  const receitaPdf = pdfs.length * 49.9;
  const receitaBp = bps.length * 290;
  const receitaTotal = receitaPdf + receitaBp;

  const convPdfToBp = pdfs.length > 0 ? pct(bps.length, pdfs.length) : "—";

  // Perfis
  const perfilCount: Record<string, number> = {};
  for (const l of pagos) {
    const p = l.perfil_declarado ?? "não informado";
    perfilCount[p] = (perfilCount[p] ?? 0) + 1;
  }
  const perfisOrdenados = Object.entries(perfilCount).sort((a, b) => b[1] - a[1]);

  // Leads por dia (últimos 14 dias)
  const hoje = new Date();
  const dias: { label: string; total: number; pagos: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const dateStr = d.toISOString().slice(0, 10);
    const dayLeads = all.filter((l) => l.created_at?.slice(0, 10) === dateStr);
    dias.push({ label, total: dayLeads.length, pagos: dayLeads.filter((l) => l.status === "paid").length });
  }

  const maxDia = Math.max(...dias.map((d) => d.total), 1);

  return (
    <main className="min-h-screen bg-[#f0f4f5]">
      <div className="bg-[#032135] px-8 py-5 flex items-center gap-4">
        <span className="text-[#7db940] font-bold text-xl">PlugFácil</span>
        <span className="text-gray-500 text-sm">/</span>
        <span className="text-white text-sm">KPIs do Funil</span>
        <div className="ml-auto flex gap-3 text-sm">
          <a href={`/admin/leads?key=${adminKey}`} className="text-gray-400 hover:text-white transition-colors">Leads</a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Receita */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Receita</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpiCard("Receita total", brl(receitaTotal), "todos os produtos", "text-[#7db940]")}
            {kpiCard("PDF R$49,90", brl(receitaPdf), `${pdfs.length} vendas`)}
            {kpiCard("Business Plan R$290", brl(receitaBp), `${bps.length} vendas`)}
            {kpiCard("Ticket médio", brl(pagos.length ? receitaTotal / pagos.length : 0), `${pagos.length} compradores`)}
          </div>
        </section>

        {/* Conversão */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Conversão</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpiCard("Total leads", String(all.length), "cadastros no funil")}
            {kpiCard("Taxa de compra", pct(pagos.length, all.length), "leads → pagantes")}
            {kpiCard("PDF → BP", convPdfToBp, "upsell de R$49 para R$290")}
            {kpiCard("Compradores únicos", String(pagos.length), "pagamentos confirmados")}
          </div>
        </section>

        {/* Perfis */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Perfis dos compradores</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {perfisOrdenados.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum dado ainda.</p>
            ) : (
              <div className="space-y-3">
                {perfisOrdenados.map(([perfil, count]) => (
                  <div key={perfil} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-40 capitalize">{perfil}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-[#7db940] h-2.5 rounded-full"
                        style={{ width: `${(count / pagos.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                      {count} ({pct(count, pagos.length)})
                    </span>
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
                      title={`${d.total} leads, ${d.pagos} pagos`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{d.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Barras = total de leads. Passe o mouse para ver pagos.</p>
          </div>
        </section>

        <p className="text-xs text-gray-400 text-right">Atualiza ao recarregar. Dados em tempo real do Supabase.</p>
      </div>
    </main>
  );
}
