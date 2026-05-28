import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json() as {
    nome: string;
    email: string;
    whatsapp: string;
    perfil: string;
    cidade?: string;
    origem?: string; // qual LP: investidor, sindico, etc.
  };

  const { nome, email, whatsapp, perfil, cidade = "", origem = "canhao" } = body;

  if (!nome || !email || !whatsapp || !perfil) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  // 1. Salvar no Supabase
  const supabase = createAdminClient();
  await supabase.from("leads").upsert(
    { email, full_name: nome, phone: whatsapp, perfil_declarado: perfil, produto: origem, status: "lead" },
    { onConflict: "email" },
  );

  // 2. Criar card no Pipefy + 3. Notificar SDR — em paralelo
  await Promise.allSettled([
    createPipefyCard({ nome, email, whatsapp, perfil, cidade, origem }),
    notifySdr({ nome, whatsapp, perfil, cidade, origem }),
  ]);

  return NextResponse.json({ ok: true });
}

async function createPipefyCard({
  nome, email, whatsapp, perfil, cidade, origem,
}: { nome: string; email: string; whatsapp: string; perfil: string; cidade: string; origem: string }) {
  const token = process.env.PIPEFY_TOKEN;
  const pipeId = process.env.PIPEFY_PIPE_ID;
  const phaseId = process.env.PIPEFY_PHASE_ENTRY;
  if (!token || !pipeId) return;

  const info = `Perfil: ${perfil} | Cidade: ${cidade || "não informada"} | LP: ${origem} | Email: ${email}`;
  const fields = [
    { field_id: "nome", field_value: nome },
    { field_id: "empresa", field_value: "PlugFácil" },
    { field_id: "telefone", field_value: whatsapp.replace(/\D/g, "") },
    { field_id: "email", field_value: email },
    { field_id: "origem_do_lead", field_value: "Outra" },
    { field_id: "informa_es_do_cliente", field_value: info },
  ];

  const fieldsInput = fields
    .map((f) => `{ field_id: "${f.field_id}", field_value: "${f.field_value.replace(/"/g, '\\"')}" }`)
    .join(", ");

  const mutation = `mutation { createCard(input: { pipe_id: ${pipeId} ${phaseId ? `phase_id: ${phaseId}` : ""} fields_attributes: [${fieldsInput}] }) { card { id } } }`;

  try {
    await fetch("https://api.pipefy.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: mutation }),
    });
  } catch (err) {
    console.error("Pipefy canhao error:", err);
  }
}

async function notifySdr({
  nome, whatsapp, perfil, cidade, origem,
}: { nome: string; whatsapp: string; perfil: string; cidade: string; origem: string }) {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;
  const sdrPhone = process.env.SDR_WHATSAPP ?? "5512988506961";
  if (!instanceId || !token) return;

  const msg =
    `🔔 *Novo lead — ${origem}*\n` +
    `Nome: ${nome}\n` +
    `WhatsApp: ${whatsapp}\n` +
    `Perfil: ${perfil}\n` +
    `Cidade: ${cidade || "não informada"}`;

  try {
    await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(clientToken ? { "Client-Token": clientToken } : {}),
      },
      body: JSON.stringify({ phone: sdrPhone.replace(/\D/g, ""), message: msg }),
    });
  } catch (err) {
    console.error("Z-API SDR notify error:", err);
  }
}
