import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Minha área — PlugFácil",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const PDF_DOWNLOAD_URL =
  "https://qntncyakfdwcxoyrfwsc.supabase.co/storage/v1/object/public/produtos/pdf-mercado-v1.pdf";

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: leads } = await admin
    .from("leads")
    .select("*")
    .eq("email", user.email!)
    .eq("status", "paid")
    .order("paid_at", { ascending: false });

  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "você";

  const productInfo: Record<string, { label: string; description: string; downloadUrl: string | null }> = {
    pdf_mercado: {
      label: "Relatório de Mercado",
      description: "Mercado de Eletromobilidade no Brasil",
      downloadUrl: PDF_DOWNLOAD_URL,
    },
    business_plan: {
      label: "Business Plan com IA",
      description: "Análise personalizada do seu endereço",
      downloadUrl: null,
    },
  };

  return (
    <main className="min-h-screen bg-[#f0f4f5]">
      {/* Header */}
      <div className="bg-[#032135] px-6 py-4 flex items-center justify-between">
        <span className="text-[#7db940] font-bold text-xl">PlugFácil</span>
        <form action="/auth/signout" method="POST">
          <button className="text-gray-400 hover:text-white text-sm transition-colors">
            Sair
          </button>
        </form>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-[#032135] mb-1">Oi, {firstName}.</h1>
        <p className="text-gray-500 text-sm mb-8">{user.email}</p>

        {/* Compras */}
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Suas compras
        </h2>

        {(!leads || leads.length === 0) ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-gray-400 text-sm mb-4">Nenhuma compra encontrada para este email.</p>
            <a
              href="/mercado-veiculos-eletricos-brasil"
              className="inline-flex items-center gap-2 bg-[#7db940] hover:bg-[#5c9423] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Ver relatório de mercado — R$ 49,90
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => {
              const info = productInfo[lead.produto ?? ""] ?? {
                label: lead.produto ?? "Produto",
                description: "",
                downloadUrl: null,
              };
              return (
                <div key={lead.id} className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#032135]">{info.label}</p>
                    <p className="text-sm text-gray-500">{info.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Comprado em {formatDate(lead.paid_at)}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {info.downloadUrl ? (
                      <a
                        href={info.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#7db940] hover:bg-[#5c9423] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                      >
                        Baixar
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 bg-[#f0f4f5] text-gray-500 font-medium px-4 py-2 rounded-xl text-sm">
                        Em processamento
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA upsell se só tem PDF */}
        {leads && leads.length > 0 && !leads.some((l) => l.produto === "business_plan") && (
          <div className="mt-8 bg-[#032135] rounded-2xl p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold mb-1">Proximo passo: Business Plan do seu ponto</p>
              <p className="text-gray-400 text-sm">Análise com IA do seu endereço específico. Entrega em até 5 horas.</p>
            </div>
            <a
              href="/plano-de-negocio"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-[#7db940] hover:bg-[#5c9423] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              Ver detalhes
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
