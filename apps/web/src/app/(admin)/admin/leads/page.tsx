import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Leads PlugFácil",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

interface Lead {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  perfil_declarado: string | null;
  produto: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    paid: { label: "Pago", color: "bg-green-100 text-green-800" },
    pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
    refunded: { label: "Reembolsado", color: "bg-red-100 text-red-800" },
  };
  const s = map[status] ?? { label: status, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>
      {s.label}
    </span>
  );
}

function produtoBadge(produto: string | null) {
  if (produto === "business_plan")
    return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">BP R$290</span>;
  if (produto === "pdf_mercado")
    return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">PDF R$49</span>;
  return <span className="text-gray-400 text-xs">{produto ?? "-"}</span>;
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; status?: string; produto?: string }>;
}) {
  const params = await searchParams;

  // Proteção por chave
  const adminKey = process.env.ADMIN_SECRET_KEY ?? "plugfacil-admin";
  if (params.key !== adminKey) {
    redirect(`/admin/leads?key=${adminKey}`);
  }

  const supabase = createAdminClient();

  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (params.status) query = query.eq("status", params.status);
  if (params.produto) query = query.eq("produto", params.produto);

  const { data: leads, error } = await query;

  if (error) {
    return <div className="p-8 text-red-600">Erro ao carregar leads: {error.message}</div>;
  }

  const total = leads?.length ?? 0;
  const pagos = leads?.filter((l) => l.status === "paid").length ?? 0;
  const bps = leads?.filter((l) => l.produto === "business_plan").length ?? 0;
  const pdfs = leads?.filter((l) => l.produto === "pdf_mercado").length ?? 0;

  const baseUrl = `/admin/leads?key=${adminKey}`;

  return (
    <main className="min-h-screen bg-[#f0f4f5]">
      {/* Header */}
      <div className="bg-[#032135] px-8 py-5 flex items-center gap-4">
        <span className="text-[#7db940] font-bold text-xl">PlugFácil</span>
        <span className="text-gray-500 text-sm">/</span>
        <span className="text-white text-sm">Admin — Leads</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total leads", value: total },
            { label: "Pagos", value: pagos },
            { label: "PDF R$49", value: pdfs },
            { label: "BP R$290", value: bps },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{kpi.label}</p>
              <p className="text-3xl font-bold text-[#032135]">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6">
          <a href={baseUrl} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!params.status && !params.produto ? "bg-[#032135] text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}>
            Todos
          </a>
          <a href={`${baseUrl}&status=paid`} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${params.status === "paid" ? "bg-[#7db940] text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}>
            Pagos
          </a>
          <a href={`${baseUrl}&status=pending`} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${params.status === "pending" ? "bg-yellow-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}>
            Pendentes
          </a>
          <a href={`${baseUrl}&produto=pdf_mercado`} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${params.produto === "pdf_mercado" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}>
            PDF
          </a>
          <a href={`${baseUrl}&produto=business_plan`} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${params.produto === "business_plan" ? "bg-purple-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}>
            Business Plan
          </a>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">WhatsApp</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Perfil</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Produto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pago em</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">WA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(leads as Lead[])?.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{lead.full_name ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.email}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.phone ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{lead.perfil_declarado ?? "-"}</td>
                    <td className="px-4 py-3">{produtoBadge(lead.produto)}</td>
                    <td className="px-4 py-3">{statusBadge(lead.status)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(lead.paid_at)}</td>
                    <td className="px-4 py-3">
                      {lead.phone && (
                        <a
                          href={`https://wa.me/55${lead.phone.replace(/\D/g, "")}?text=Olá%20${encodeURIComponent(lead.full_name?.split(" ")[0] ?? "")}!%20Aqui%20é%20o%20time%20PlugFácil.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#7db940] hover:text-[#5c9423] font-medium"
                        >
                          Abrir
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                {(!leads || leads.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                      Nenhum lead encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-right">
          Exibindo {total} registro(s). Atualiza ao recarregar a página.
        </p>
      </div>
    </main>
  );
}
