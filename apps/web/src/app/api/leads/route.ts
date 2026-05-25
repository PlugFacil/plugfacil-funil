import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const PRICE_IDS: Record<string, string> = {
    pdf_mercado: process.env.STRIPE_PRICE_ID_PDF ?? "",
    business_plan: process.env.STRIPE_PRICE_ID_BP ?? "",
  };

  const SUCCESS_URLS: Record<string, string> = {
    pdf_mercado: `${process.env.NEXT_PUBLIC_SITE_URL}/mercado-veiculos-eletricos-brasil/obrigado`,
    business_plan: `${process.env.NEXT_PUBLIC_SITE_URL}/plano-de-negocio/obrigado`,
  };

  const body = (await req.json()) as {
    nome: string;
    email: string;
    whatsapp: string;
    perfil: string;
    produto: string;
  };

  const { nome, email, whatsapp, perfil, produto } = body;

  if (!nome || !email || !whatsapp || !perfil || !produto) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const priceId = PRICE_IDS[produto];
  if (!priceId) {
    return NextResponse.json({ error: "Produto inválido" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    metadata: { nome, whatsapp, perfil, produto },
    success_url: SUCCESS_URLS[produto] ?? `${process.env.NEXT_PUBLIC_SITE_URL}/obrigado`,
    cancel_url: req.headers.get("referer") ?? `${process.env.NEXT_PUBLIC_SITE_URL}`,
    payment_method_types: ["card"],
    locale: "pt-BR",
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
