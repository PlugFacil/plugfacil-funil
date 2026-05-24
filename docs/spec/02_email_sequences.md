# 02 — Sequências de email

> Stack: Resend para transacionais + Resend Broadcasts (ou Loops.so) para sequências.
> Templates React em `packages/email/templates/`. Compilados com `react-email`.

## Princípios

- Português brasileiro, tom direto, sem subserviência ("Olá, espero que esteja bem!")
- Mobile-first (60%+ dos leads vão abrir no celular)
- Um único CTA por email (o cérebro pula múltiplos)
- Assinatura: "— Time PlugFácil" (não nome de pessoa fictícia)
- Footer: link para descadastrar, endereço PlugFácil (CAN-SPAM/LGPD)

---

## A. Transacionais (disparo imediato via Inngest)

### A1. welcome-pdf-buyer
**Trigger:** `purchase/completed` com `product=pdf_mercado`
**Subject:** Seu PDF Mercado de Eletromobilidade chegou
**Body:**

```
Oi, [primeiro_nome].

Obrigado pela compra. Seu material está pronto:

[BOTÃO: BAIXAR PDF AGORA]

Link válido por 7 dias e pode baixar até 5 vezes. Se precisar de novo,
acesse seu painel: https://plugfacil.com.br/dashboard

Nos próximos dias vou te mandar 6 emails curtos com bastidores do mercado:
quanto realmente custa, onde estão os erros mais comuns dos investidores
iniciantes, e o que os relatórios da ABVE não contam.

Se quiser pular essa parte e ir direto para o próximo passo (gerar um
Business Plan personalizado para seu endereço), responde esse email com
"BP" e eu te mando o link.

— Time PlugFácil
```

### A2. bp-processing
**Trigger:** `bp/submitted`
**Subject:** Recebemos seus dados. Seu Business Plan está em construção.
**Body:**

```
[primeiro_nome], tudo certo.

Recebemos seu pedido para o endereço [endereco_resumido].

Nossa IA está analisando agora:
✓ Padrão elétrico do local
✓ Frota EV e demanda na sua região
✓ Tarifa da distribuidora
✓ Carregadores concorrentes próximos
✓ Cenário solar e mercado livre

ETA: até 5 horas. Vou te mandar email quando estiver pronto.

Status em tempo real: https://plugfacil.com.br/dashboard

— Time PlugFácil
```

### A3. bp-completed
**Trigger:** `bp/delivered`
**Subject:** Seu Business Plan PlugFácil está pronto
**Body:**

```
[primeiro_nome],

Seu Business Plan personalizado está pronto. Resumo do que tem dentro:

• Análise do mercado local (frota EV, concorrência, oportunidade)
• Configuração técnica recomendada para seu endereço
• Modelagem financeira em 3 cenários (convencional, solar, mercado livre)
• Payback estimado: [payback_meses] meses no cenário recomendado
• Próximos passos para implementação turn-key

[BOTÃO: BAIXAR BUSINESS PLAN COMPLETO]

Próximo passo lógico: 30 minutos de conversa com nosso time para revisar
juntos e ver se faz sentido seguir para implementação. Sem custo nessa
etapa.

[BOTÃO: AGENDAR CONVERSA — 30 MIN]

— Time PlugFácil
```

### A4. bp-failed
**Trigger:** `business_plans.status = failed`
**Subject:** Tivemos um problema gerando seu BP — vamos resolver
**Body:**

```
[primeiro_nome],

Algo na geração do seu Business Plan não rodou como esperado.
Já fomos notificados e estamos investigando.

O que acontece agora:
1. Um humano vai revisar seu caso nas próximas 24h
2. Se for problema de input (foto ruim, dado faltante), te chamamos
3. Se for problema nosso, geramos manualmente e te entregamos em até 48h

Seu pagamento está garantido. Se em 72h não receber o BP, devolvemos
integral, sem perguntas.

Resposta direta para esse email funciona.

— Time PlugFácil
```

---

## B. Sequência "pdf-to-bp" (7 emails em 14 dias)

Trigger: usuário comprou PDF (`profile.lead_stage = 'pdf_buyer'`).
Para quando: usuário compra o BP OU usuário descadastra OU 14 dias.

### Email 1 — Dia 1 (3h após compra)
**Subject:** Pergunta rápida — qual seu cenário?
**Body:**

```
Oi, [primeiro_nome].

Antes de tudo: o PDF cobre o mercado em geral. Quem realmente decide investir
acaba precisando de números do CASO específico.

Em qual situação você está hoje?

a) Tenho um imóvel comercial e estou explorando se vale a pena
b) Sou síndico ou gestor condominial avaliando para o condomínio
c) Já tenho experiência em postos/varejo, busco diversificação
d) Investidor exploratório, ainda decidindo se entro
e) Outro — me conta

Resposta direta para esse email cai no nosso WhatsApp.

— Time PlugFácil
```

### Email 2 — Dia 2
**Subject:** O erro que custou R$ 38 mil para um cliente
**Body:**

```
[primeiro_nome],

História real (cliente autorizou contar). Comerciante de Campinas instalou
um DC 30kW achando que o padrão de entrada bifásico dava conta porque "o
eletricista falou que sim".

Falava. Mas o padrão não tinha aterramento conforme NBR 5410, e o disjuntor
geral era de 70A — limite no papel, mas com geladeira industrial e
iluminação LED ligados, restava na média 22kW de margem. O DC pedia 30kW.

Resultado: 4 trips de disjuntor por semana, dois clientes deram nota 1 no
app, e teve que pagar R$ 38 mil para refazer padrão + ART + reinstalar.

Lição: a foto do padrão de entrada conta uma história que não dá pra
adivinhar de longe.

Por isso a etapa 1 do nosso Business Plan personalizado é uma análise
visual do seu padrão antes de qualquer recomendação.

[BOTÃO: VER COMO FUNCIONA O BP]

— Time PlugFácil
```

### Email 3 — Dia 4
**Subject:** Quanto realmente custa o kWh que você revende
**Body:**

```
[primeiro_nome],

Conta básica, com números reais de São Paulo (CPFL, B3 dezembro/2025):

Tarifa cativa total: R$ 0,82/kWh
Bandeira amarela: + R$ 0,02
Tributos: já inclusos

Você revende: R$ 1,50/kWh

Margem aparente: R$ 0,66 por kWh — bonita.

Margem real depois do que ninguém te conta:
• Taxa da plataforma de cobrança (8-12% do bruto)
• Manutenção (~0,5%/mês do CAPEX)
• Internet 4G do carregador
• Energia para o carregador EM STANDBY (sim, ele consome)
• Reajuste anual da distribuidora (~6%/ano)

Margem real: R$ 0,38-0,48 por kWh nos primeiros 3 anos.

Ainda bom. Mas quem entra esperando R$ 0,66 fica frustrado.

O Business Plan PlugFácil calcula isso pro seu município, sua tarifa,
seu tipo de local.

[BOTÃO: GERAR BP DO MEU ENDEREÇO]

— Time PlugFácil
```

### Email 4 — Dia 6
**Subject:** Solar + eletroposto: quando vale, quando não
**Body:**

```
Resumo curto:

Vale quando:
• Você tem área disponível (telhado ou solo) > 30m²
• Tarifa local > R$ 0,70/kWh
• Carregador AC com uso constante (não DC esporádico)
• Município com irradiação > 4,8 kWh/m²/dia (boa parte do Brasil)

Não vale quando:
• Padrão elétrico não suporta inversor sem upgrade
• Imóvel alugado com contrato < 5 anos
• Já está no mercado livre com PPA bom (compete com solar)

O BP PlugFácil calcula o payback combinado solar+eletroposto pro seu
caso específico e diz claramente: vale ou não vale.

[BOTÃO: VER MEU CENÁRIO]

— Time PlugFácil
```

### Email 5 — Dia 8
**Subject:** Mercado livre de energia — pra quem é (e quem ignora isso perde dinheiro)
**Body:** (curto, ~120 palavras, explica os requisitos legais + CTA BP)

### Email 6 — Dia 11
**Subject:** O que muda em 2026 e por que ninguém fala disso
**Body:** (cobre Lei 14.300 — taxação solar; aprovação NBR 17019 para eletropostos; reforma tributária impacto)

### Email 7 — Dia 14
**Subject:** Última chance: 20% off no Business Plan até amanhã
**Body:** Cupom único `PRIMEIRO20` válido 24h. Se passar, sai do funil de nutrição.

---

## C. Métricas a monitorar (PostHog + Resend)

- Open rate por email da sequência (meta: > 35% emails 1-3, > 25% emails 4-7)
- Click rate por CTA (meta: > 4%)
- Conversão final pdf-to-bp (meta: 3-8%)
- Descadastros por email (alerta se > 2%)
- Bounces (alerta se > 1%)

---
