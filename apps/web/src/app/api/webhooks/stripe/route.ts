import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const PDF_DOWNLOAD_URL =
  "https://qntncyakfdwcxoyrfwsc.supabase.co/storage/v1/object/public/produtos/pdf-mercado-v1.pdf";

const BP_URL = "https://plugfacil-funil-web.vercel.app/plano-de-negocio";

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
    await scheduleNurtureSequence({ email, nome });
  }

  return NextResponse.json({ received: true });
}

function addHours(date: Date, hours: number): string {
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function addDays(date: Date, days: number): string {
  return addHours(date, days * 24);
}

async function scheduleNurtureSequence({ email, nome }: { email: string; nome: string }) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const firstName = nome.split(" ")[0] || "você";
  const from = `PlugFácil <${process.env.RESEND_FROM_EMAIL ?? "time@plugfacil.com.br"}>`;
  const replyTo = process.env.RESEND_REPLY_TO ?? "contato@plugfacil.com.br";
  const now = new Date();

  const emails = [
    {
      scheduledAt: addHours(now, 3),
      subject: "Pergunta rápida — qual seu cenário?",
      html: nurture1(firstName),
    },
    {
      scheduledAt: addDays(now, 2),
      subject: "O erro que custou R$ 38 mil para um cliente",
      html: nurture2(firstName),
    },
    {
      scheduledAt: addDays(now, 4),
      subject: "Quanto realmente custa o kWh que você revende",
      html: nurture3(firstName),
    },
    {
      scheduledAt: addDays(now, 6),
      subject: "Solar + eletroposto: quando vale, quando não",
      html: nurture4(firstName),
    },
    {
      scheduledAt: addDays(now, 8),
      subject: "Mercado livre de energia — pra quem é (e quem ignora isso perde dinheiro)",
      html: nurture5(firstName),
    },
    {
      scheduledAt: addDays(now, 11),
      subject: "O que muda em 2026 e por que ninguém fala disso",
      html: nurture6(firstName),
    },
    {
      scheduledAt: addDays(now, 14),
      subject: "Última chance: 20% off no Business Plan até amanhã",
      html: nurture7(firstName),
    },
  ];

  for (const e of emails) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, reply_to: replyTo, to: email, subject: e.subject, html: e.html, scheduled_at: e.scheduledAt }),
    });
    if (!res.ok) {
      console.error(`Nurture email erro (${e.subject}):`, await res.text());
    }
  }
}

function emailWrapper(content: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:#032135;padding:24px 40px;text-align:center;">
          <span style="color:#7db940;font-size:22px;font-weight:bold;">PlugFácil</span>
        </td></tr>
        <tr><td style="padding:36px 40px;font-size:15px;color:#333;line-height:1.7;">
          ${content}
        </td></tr>
        <tr><td style="background:#f9f9f9;padding:20px 40px;text-align:center;">
          <p style="color:#aaa;font-size:11px;margin:0;">
            PlugFácil Mobilidade Elétrica · CNPJ 66.053.337/0001-75<br>
            São José dos Campos, SP · contato@plugfacil.com.br<br>
            <a href="https://plugfacil-funil-web.vercel.app/descadastrar?email={{email}}" style="color:#aaa;">Descadastrar</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(label: string, url: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
    <a href="${url}" style="background:#7db940;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 36px;border-radius:8px;display:inline-block;">${label}</a>
  </td></tr></table>`;
}

function sig() {
  return `<p style="color:#555;margin-top:24px;">— Time PlugFácil</p>`;
}

function nurture1(name: string) {
  return emailWrapper(`
    <p>Oi, ${name}.</p>
    <p>Antes de tudo: o relatório cobre o mercado em geral. Quem realmente decide investir acaba precisando de números do <strong>caso específico</strong>.</p>
    <p>Em qual situação você está hoje?</p>
    <ul style="padding-left:20px;">
      <li style="margin-bottom:8px;">Tenho um imóvel comercial e estou explorando se vale a pena</li>
      <li style="margin-bottom:8px;">Sou síndico ou gestor condominial avaliando para o condomínio</li>
      <li style="margin-bottom:8px;">Já tenho experiência em postos/varejo, busco diversificação</li>
      <li style="margin-bottom:8px;">Investidor exploratório, ainda decidindo se entro</li>
      <li style="margin-bottom:8px;">Outro</li>
    </ul>
    <p>Resposta direta para esse email cai no nosso WhatsApp.</p>
    ${sig()}
  `);
}

function nurture2(name: string) {
  return emailWrapper(`
    <p>${name},</p>
    <p>História real (cliente autorizou contar). Comerciante de Campinas instalou um DC 30kW achando que o padrão de entrada bifásico dava conta porque "o eletricista falou que sim".</p>
    <p>Falava. Mas o padrão não tinha aterramento conforme NBR 5410, e o disjuntor geral era de 70A. Com geladeira industrial e iluminação LED ligados, restava na média 22kW de margem. O DC pedia 30kW.</p>
    <p>Resultado: 4 trips de disjuntor por semana, dois clientes deram nota 1 no app, e teve que pagar <strong>R$ 38 mil</strong> para refazer padrão + ART + reinstalar.</p>
    <p>Lição: a foto do padrão de entrada conta uma história que não dá para adivinhar de longe.</p>
    <p>Por isso a etapa 1 do nosso Business Plan personalizado é uma análise visual do seu padrão antes de qualquer recomendação.</p>
    ${btn("Ver como funciona o BP", BP_URL)}
    ${sig()}
  `);
}

function nurture3(name: string) {
  return emailWrapper(`
    <p>${name},</p>
    <p>Conta básica, com números reais de São Paulo (CPFL, B3 dezembro/2025):</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr style="background:#f5f5f5;"><td style="padding:10px 14px;font-size:14px;">Tarifa cativa total</td><td style="padding:10px 14px;font-size:14px;font-weight:bold;">R$ 0,82/kWh</td></tr>
      <tr><td style="padding:10px 14px;font-size:14px;">Você revende</td><td style="padding:10px 14px;font-size:14px;font-weight:bold;">R$ 1,50/kWh</td></tr>
      <tr style="background:#f5f5f5;"><td style="padding:10px 14px;font-size:14px;">Margem aparente</td><td style="padding:10px 14px;font-size:14px;font-weight:bold;color:#7db940;">R$ 0,66/kWh</td></tr>
    </table>
    <p>Margem real depois do que ninguém te conta:</p>
    <ul style="padding-left:20px;">
      <li style="margin-bottom:6px;">Taxa da plataforma de cobrança (8-12% do bruto)</li>
      <li style="margin-bottom:6px;">Manutenção (~0,5%/mês do CAPEX)</li>
      <li style="margin-bottom:6px;">Internet 4G do carregador</li>
      <li style="margin-bottom:6px;">Energia do carregador em standby</li>
      <li style="margin-bottom:6px;">Reajuste anual da distribuidora (~6%/ano)</li>
    </ul>
    <p><strong>Margem real: R$ 0,38-0,48 por kWh nos primeiros 3 anos.</strong></p>
    <p>Ainda bom. Mas quem entra esperando R$ 0,66 fica frustrado.</p>
    <p>O Business Plan PlugFácil calcula isso pro seu município, sua tarifa, seu tipo de local.</p>
    ${btn("Gerar BP do meu endereço", BP_URL)}
    ${sig()}
  `);
}

function nurture4(name: string) {
  return emailWrapper(`
    <p>${name}, resumo curto:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="width:50%;padding:16px;background:#eef6e5;border-radius:8px;vertical-align:top;">
        <p style="font-weight:bold;color:#457216;margin:0 0 10px;">Vale quando</p>
        <ul style="padding-left:16px;margin:0;font-size:14px;">
          <li style="margin-bottom:6px;">Tem area disponivel maior que 30m²</li>
          <li style="margin-bottom:6px;">Tarifa local acima de R$ 0,70/kWh</li>
          <li style="margin-bottom:6px;">Carregador AC com uso constante</li>
          <li>Municipio com boa irradiacao solar</li>
        </ul>
      </td><td style="width:8px;"></td>
      <td style="width:50%;padding:16px;background:#ffebee;border-radius:8px;vertical-align:top;">
        <p style="font-weight:bold;color:#c62828;margin:0 0 10px;">Nao vale quando</p>
        <ul style="padding-left:16px;margin:0;font-size:14px;">
          <li style="margin-bottom:6px;">Padrao eletrico nao suporta inversor</li>
          <li style="margin-bottom:6px;">Imovel alugado com contrato curto</li>
          <li>Ja esta no mercado livre com PPA bom</li>
        </ul>
      </td></tr>
    </table>
    <p>O BP PlugFácil calcula o payback combinado solar+eletroposto pro seu caso e diz claramente: vale ou nao vale.</p>
    ${btn("Ver meu cenário", BP_URL)}
    ${sig()}
  `);
}

function nurture5(name: string) {
  return emailWrapper(`
    <p>${name},</p>
    <p>Mercado livre de energia existe no Brasil desde 1995. A maioria das pessoas nunca ouviu falar porque o varejo nao tem acesso.</p>
    <p><strong>Quem pode entrar:</strong> consumidores com demanda contratada acima de 500kW (alta tensao). Alguns condomínios comerciais grandes se encaixam.</p>
    <p><strong>O que muda para o eletroposto:</strong> voce compra energia mais barata via PPA (Power Purchase Agreement), reduz o custo do kWh de R$ 0,82 para algo entre R$ 0,35-0,55 dependendo do contrato, e a margem do eletroposto sobe significativamente.</p>
    <p><strong>O problema:</strong> contratos de mercado livre tem prazo minimo de 1 ano, multa por saida antecipada, e nao fazem sentido para locais com consumo inconsistente.</p>
    <p>O BP PlugFácil verifica automaticamente se seu local se qualifica e, se sim, inclui o cenario de mercado livre na modelagem.</p>
    ${btn("Verificar se meu local se qualifica", BP_URL)}
    ${sig()}
  `);
}

function nurture6(name: string) {
  return emailWrapper(`
    <p>${name},</p>
    <p>Tres mudancas regulatorias em 2026 que afetam diretamente quem investe em eletroposto:</p>
    <p><strong>1. Lei 14.300 e tributacao do solar</strong><br>
    A isenção de ICMS para energia solar injetada na rede acabou em 2026 para sistemas acima de 5kW em varios estados. Quem planejava o ROI do solar+eletroposto com esse beneficio precisa refazer a conta.</p>
    <p><strong>2. NBR 17019 aprovada</strong><br>
    A norma tecnica brasileira para eletropostos foi aprovada em 2025. Instalacoes anteriores que nao estao em conformidade podem ter problemas de seguro e certificacao. Instalacoes novas precisam seguir a norma desde o inicio.</p>
    <p><strong>3. Obrigatoriedade de NF por recarga em 2027</strong><br>
    A Receita Federal confirmou: a partir de 2027, cada sessao de recarga precisa emitir nota fiscal. Plataformas que nao estiverem prontas vao parar de funcionar. A Tupi (plataforma que a PlugFácil usa) ja tem o modulo fiscal em desenvolvimento.</p>
    <p>Quem entra agora ainda pega o ciclo de crescimento antes do mercado ficar competitivo de verdade.</p>
    ${btn("Gerar meu Business Plan agora", BP_URL)}
    ${sig()}
  `);
}

function nurture7(name: string) {
  const couponUrl = `${BP_URL}?cupom=PRIMEIRO20`;
  return emailWrapper(`
    <p>${name},</p>
    <p>Esse é o último email desta sequência.</p>
    <p>Nos ultimos 14 dias você viu como funciona o mercado por dentro: custo real do kWh, os erros que custam caro, quando solar faz sentido, o impacto do mercado livre, e as mudancas regulatorias de 2026.</p>
    <p>Se depois de tudo isso você ainda nao gerou o Business Plan do seu endereço, provavelmente é por um desses motivos:</p>
    <ul style="padding-left:20px;">
      <li style="margin-bottom:6px;">Nao tem certeza se o local vai funcionar</li>
      <li style="margin-bottom:6px;">Quer mais segurança nos numeros antes de decidir</li>
      <li style="margin-bottom:6px;">Achou R$ 290 caro para um documento</li>
    </ul>
    <p>O BP foi feito exatamente para resolver os dois primeiros. E pra resolver o terceiro:</p>
    <p style="background:#eef6e5;border-left:4px solid #7db940;padding:16px 20px;border-radius:4px;font-weight:bold;">
      Cupom <span style="color:#457216;font-size:18px;">PRIMEIRO20</span> — 20% de desconto, valido por 24h a partir de agora.
    </p>
    <p>Depois desse prazo o cupom expira e voce sai desta lista automaticamente.</p>
    ${btn("Gerar meu Business Plan com 20% off", couponUrl)}
    ${sig()}
  `);
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

  const firstName = nome.split(" ")[0] || "você";

  const html = emailWrapper(`
    <p style="font-size:18px;font-weight:bold;color:#111;margin:0 0 16px;">Oi, ${firstName}!</p>
    <p>Seu relatório <strong>Mercado de Eletromobilidade no Brasil</strong> está pronto para download.</p>
    ${btn("Baixar o relatório agora", downloadUrl)}
    <p style="color:#888;font-size:13px;">
      Se o botão nao funcionar, acesse o link direto:<br>
      <a href="${downloadUrl}" style="color:#7db940;">${downloadUrl}</a>
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0;">
    <p style="font-size:14px;color:#555;">
      Nos proximos dias vou te mandar 6 emails curtos com bastidores do mercado: quanto realmente custa, onde estao os erros mais comuns dos investidores iniciantes, e o que os relatorios da ABVE nao contam.
    </p>
    <p style="font-size:14px;color:#555;">
      Se quiser pular essa parte e ir direto para o proximo passo, responde esse email com "BP".
    </p>
    ${sig()}
  `);

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
