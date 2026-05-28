import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, email, full_name, phone, perfil_declarado, produto, status, paid_at, created_at")
    .eq("email", email);

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }

  return NextResponse.json({
    titular: email,
    dados_coletados: data ?? [],
    finalidade: "Entrega de produto digital (PDF/Business Plan) e comunicação transacional",
    base_legal: "Execução de contrato (Art. 7º, V, LGPD)",
    exportado_em: new Date().toISOString(),
  });
}
