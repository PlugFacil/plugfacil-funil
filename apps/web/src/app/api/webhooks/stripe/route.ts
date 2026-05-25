import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const PDF_DOWNLOAD_URL =
  "https://qntncyakfdwcxoyrfwsc.supabase.co/storage/v1/object/public/produtos/pdf-mercado-v1.pdf";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  const email = session.customer_email;
  const nome = session.metadata?.nome ?? "";
  const whatsapp = session.metadata?.whatsapp ?? "";
  const perfil = session.metadata?.perfil ?? "";
  const produto = session.metadata?.produto ?? "pdf_mercado";

  if (!email) {
    console.error("Webhook: email ausente na sessão", session.id);
    return NextResponse.json({ error: "No email" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("leads").upsert(
    {
      email,
      full_name: nome,
      phone: whatsapp,
      perfil_declarado: perfil,
      produto,
      stripe_checkout_session_id: session.id,
      status: "paid",
      paid_at: new Date().toISOString(),
    },
    { onConflict: "stripe_checkout_session_id" },
  );

  if (error) {
    console.error("Webhook: erro ao salvar lead", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (produto === "pdf_mercado") {
    await sendPdfEmail({ email, nome, downloadUrl: PDF_DOWNLOAD_URL });
  }

  return NextResponse.json({ received: true });
}

async function sendPdfEmail({
  email,
  nome,
  downloadUrl,
}: {
  email: string;
  nome: string;
  downloadUrl: string;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("RESEND_API_KEY não configurado, pulando email");
    return;
  }

  const firstName = nome.split(" ")[0] || "Olá";

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
          <span style="color:#4CAF50;font-size:28px;font-weight:bold;">PlugFácil</span>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="font-size:18px;color:#111;font-weight:bold;margin:0 0 16px;">Oi, ${firstName}!</p>
          <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Seu relatório <strong>Mercado de Eletromobilidade no Brasil</strong> está pronto para download.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 32px;">
              <a href="${downloadUrl}" style="background:#4CAF50;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:16px 40px;border-radius:8px;display:inline-block;">
                Baixar o relatório
              </a>
            </td></tr>
          </table>
          <p style="color:#888;font-size:13px;line-height:1.6;margin:0 0 16px;">
            Se o botão não funcionar, acesse o link direto:<br>
            <a href="${downloadUrl}" style="color:#4CAF50;">${downloadUrl}</a>
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
          <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 12px;">
            Depois de ler, se quiser entender a viabilidade do <strong>seu ponto específico</strong>,
            nossa equipe faz uma análise personalizada com IA em menos de 48h.
          </p>
          <a href="https://wa.me/5512988506961?text=Olá!%20Li%20o%20relatório%20e%20quero%20saber%20mais%20sobre%20o%20Plano%20de%20Negócio."
             style="color:#4CAF50;font-size:14px;">Falar com a PlugFácil pelo WhatsApp</a>
        </td></tr>
        <tr><td style="background:#f9f9f9;padding:24px 40px;text-align:center;">
          <p style="color:#aaa;font-size:12px;margin:0;">
            PlugFácil Mobilidade Elétrica · CNPJ 66.053.337/0001-75<br>
            São José dos Campos, SP · contato@plugfacil.com.br
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `PlugFácil <${process.env.RESEND_FROM_EMAIL ?? "time@plugfacil.com.br"}>`,
      reply_to: process.env.RESEND_REPLY_TO ?? "contato@plugfacil.com.br",
      to: email,
      subject: "Seu relatório chegou: Mercado de Eletromobilidade",
      html,
    }),
  });

  if (!res.ok) {
    console.error("Resend error:", await res.text());
  }
}
