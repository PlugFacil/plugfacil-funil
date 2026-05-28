import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const PROMPT = `Você é um engenheiro elétrico especialista em instalações de eletropostos no Brasil (norma ABNT NBR 5410).

Analise esta foto de um quadro/padrão de entrada elétrico e responda em JSON com exatamente este formato:
{
  "disjuntor_geral_estimado_A": <número ou null>,
  "tensao_estimada": "monofásico" | "bifásico" | "trifásico" | "não identificado",
  "capacidade_disponivel_kW": <número estimado ou null>,
  "adequado_para_AC_7kW": true | false | "incerto",
  "adequado_para_DC_30kW": true | false | "incerto",
  "observacoes": "<string curta com principais pontos visuais>",
  "alertas": ["<lista de alertas críticos se houver>"],
  "confianca": "alta" | "media" | "baixa"
}

Regras:
- Se não conseguir identificar algo, use null ou "não identificado"
- Nunca invente valores sem base visual
- Alertas apenas para problemas reais visíveis (falta de aterramento, disjuntor subdimensionado, etc.)
- Confiança "baixa" se a foto estiver desfocada, cortada ou com iluminação ruim
- Responda APENAS o JSON, sem texto adicional`;

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("foto") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Foto obrigatória" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Foto muito grande. Máximo 5MB." }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mediaType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp";

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    let analise: unknown;
    try {
      analise = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Não foi possível analisar a imagem", raw: text }, { status: 422 });
    }

    return NextResponse.json({ analise, disclaimer: "Estimativa visual. Não substitui laudo técnico de engenheiro habilitado com ART." });
  } catch (err) {
    console.error("Vision error:", err);
    return NextResponse.json({ error: "Erro na análise. Tente novamente." }, { status: 500 });
  }
}
