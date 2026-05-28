import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Anonimizar — não deletar fisicamente para manter integridade de relatórios
  const { error } = await supabase
    .from("leads")
    .update({
      full_name: "[removido]",
      phone: null,
      perfil_declarado: null,
      email: `anonimizado_${Date.now()}@removido.local`,
    })
    .eq("email", email);

  if (error) {
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 });
  }

  return NextResponse.json({
    message: "Dados pessoais removidos com sucesso conforme Art. 18, VI, LGPD",
    processado_em: new Date().toISOString(),
  });
}
