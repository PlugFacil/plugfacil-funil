# 07 — LGPD, Política de Privacidade e Termos

> Este documento serve como base jurídica E como spec técnica do que o sistema deve implementar para estar em compliance. **NÃO é parecer jurídico.** Antes de publicar, contratar revisão com advogado especializado em LGPD/contratos digitais.

---

## Por que isso importa AGORA

O Produto 2 coleta:
1. **Endereço completo** (dado pessoal)
2. **Foto da vaga** (pode conter placa de veículo → dado pessoal indireto)
3. **Foto do padrão de entrada** (pode revelar localização e patrimônio)
4. **CPF/CNPJ no checkout** (dado pessoal)
5. **Dados de pagamento** (via Stripe — Stripe é controlador desses dados, nós só temos o `customer_id`)

Sem compliance: risco de multa (até 2% do faturamento, limitado a R$ 50M por infração) + risco reputacional + risco contratual com WEG/TUPI.

---

## 1. Bases legais para cada tratamento

| Dado | Finalidade | Base legal (Art. 7º LGPD) | Tempo de retenção |
|------|------------|---------------------------|-------------------|
| Email, nome | Cadastro de usuário, login | Execução de contrato (V) | Enquanto conta ativa + 5 anos |
| Endereço do imóvel | Gerar BP customizado | Execução de contrato (V) | 5 anos (prazo prescricional CDC) |
| Foto da vaga | Análise por IA + geração do BP | Execução de contrato (V) + consentimento (I) para uso em IA | 24 meses, depois anonimização |
| Foto do padrão | Análise por IA + geração do BP | Execução de contrato (V) + consentimento (I) para uso em IA | 24 meses, depois anonimização |
| CPF/CNPJ | Nota fiscal, antifraude | Cumprimento de obrigação legal (II) | Mínimo 5 anos (fiscal) |
| Dados de pagamento | Processamento de pagamento | Execução de contrato (V) — operador: Stripe | Stripe controla (ver política deles) |
| Dados de navegação (PostHog) | Análise de produto, otimização | Legítimo interesse (IX) | 12 meses |
| Cookies de marketing | Remarketing | Consentimento (I) | 12 meses ou retirada |

**Regra prática**: para fotos e endereço, o usuário consente explicitamente no momento da submissão do BP, com checkbox NÃO pré-marcado e link para a Política de Privacidade.

---

## 2. Direitos dos titulares e como implementar

A LGPD garante ao titular:

| Direito | Como implementar |
|---------|------------------|
| Confirmação da existência | Endpoint `GET /api/me/data` retorna JSON com todos os dados |
| Acesso | Mesmo endpoint, com link de download |
| Correção | Tela `/conta/perfil` permite editar nome, email, telefone |
| Anonimização ou eliminação | Endpoint `POST /api/me/delete` — soft delete imediato, hard delete em 30 dias |
| Portabilidade | Botão "Exportar meus dados" no perfil → ZIP com JSON + fotos |
| Informação sobre compartilhamento | Política de Privacidade lista todos os operadores |
| Revogação de consentimento | Toggle por categoria em `/conta/privacidade` |
| Oposição | Mesmo toggle + email contato@plugfacil.com.br |

**Implementação obrigatória no Sprint 6 (não pode ir para produção sem isso):**

```typescript
// apps/web/src/app/api/me/data/route.ts
export async function GET() {
  const user = await getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const [profile, purchases, bps, events] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.id, user.id) }),
    db.query.purchases.findMany({ where: eq(purchases.user_id, user.id) }),
    db.query.businessPlans.findMany({ where: eq(businessPlans.user_id, user.id) }),
    db.query.events.findMany({ where: eq(events.user_id, user.id) }),
  ])

  // Signed URLs de fotos por 1 hora
  const bpsWithPhotos = await Promise.all(bps.map(async (bp) => ({
    ...bp,
    foto_vaga_url: bp.foto_vaga_path ? await supabaseAdmin.storage.from('bp-photos').createSignedUrl(bp.foto_vaga_path, 3600) : null,
    foto_padrao_url: bp.foto_padrao_path ? await supabaseAdmin.storage.from('bp-photos').createSignedUrl(bp.foto_padrao_path, 3600) : null,
  })))

  return Response.json({ profile, purchases, business_plans: bpsWithPhotos, events })
}
```

```typescript
// apps/web/src/app/api/me/delete/route.ts
export async function POST() {
  const user = await getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // 1. Soft delete imediato (RLS impede acesso)
  await db.update(profiles)
    .set({ deleted_at: new Date(), email: `deleted-${user.id}@plugfacil.com.br` })
    .where(eq(profiles.id, user.id))

  // 2. Schedule hard delete em 30 dias (Inngest delay)
  await inngest.send({ name: 'user/hard-delete', data: { userId: user.id }, ts: Date.now() + 30 * 24 * 60 * 60 * 1000 })

  // 3. Log da solicitação
  await db.insert(events).values({ user_id: user.id, type: 'data_deletion_requested', payload: {} })

  return Response.json({ ok: true, hardDeleteScheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
}
```

A função Inngest `user/hard-delete`:
- Apaga fotos do Storage
- Apaga registros de `business_plans`, `purchases`, `events`, `lead_handoffs` que pertencem ao user
- Mantém apenas linha em `profiles` com email anonimizado e `purged: true` (necessária para auditoria fiscal de notas emitidas)

---

## 3. Encarregado (DPO)

Indicar no rodapé do site e na Política:
- **Nome do Encarregado**: [a definir — pode ser sócio até ter volume]
- **Email**: dpo@plugfacil.com.br
- **Prazo de resposta**: 15 dias úteis (LGPD permite até 15)

---

## 4. Política de Privacidade — Template

> Texto-base. Revisar com advogado antes de publicar. Salvar em `apps/web/src/app/(marketing)/privacidade/page.tsx`.

```markdown
# Política de Privacidade — PlugFácil

**Última atualização: [data]**

A PlugFácil Mobilidade Elétrica Ltda. ("PlugFácil", "nós") respeita sua privacidade e está comprometida com a proteção dos seus dados pessoais nos termos da Lei nº 13.709/2018 (LGPD).

## 1. Quem somos
- Razão social: [a preencher]
- CNPJ: [a preencher]
- Endereço: [a preencher], Vale do Paraíba/SP
- Contato do Encarregado (DPO): dpo@plugfacil.com.br

## 2. Quais dados coletamos

### 2.1 Dados que você nos fornece
- Nome, email, telefone (cadastro)
- CPF ou CNPJ (emissão de nota fiscal)
- Endereço do imóvel (para gerar seu Business Plan)
- Fotos da vaga e do padrão de entrada elétrica
- Mensagens trocadas com nosso comercial

### 2.2 Dados que coletamos automaticamente
- Endereço IP, tipo de navegador, dispositivo
- Páginas visitadas, tempo de permanência
- Identificadores de sessão (cookies)

### 2.3 Dados de terceiros
- Localização aproximada via CEP (ViaCEP)
- Coordenadas geográficas (Google Maps)
- Dados públicos de tarifa de energia (ANEEL)
- Quando aplicável, dados de pagamento via Stripe (não armazenamos número de cartão)

## 3. Para que usamos seus dados

| Finalidade | Base legal |
|------------|-----------|
| Criar e manter sua conta | Execução do contrato |
| Processar seu pagamento | Execução do contrato |
| Gerar seu Business Plan personalizado | Execução do contrato + consentimento para fotos |
| Enviar emails transacionais (recibo, status) | Execução do contrato |
| Enviar emails de novidades e ofertas | Consentimento (opt-out a qualquer momento) |
| Cumprir obrigações fiscais e legais | Obrigação legal |
| Melhorar nossos produtos (analytics) | Legítimo interesse |
| Defesa em processos judiciais | Exercício regular de direitos |

## 4. Com quem compartilhamos

Compartilhamos seus dados apenas com:

- **Operadores tecnológicos**: Supabase (hospedagem), Stripe (pagamentos), Resend (emails), Anthropic (análise de imagens e geração de texto via IA), Cloudflare (CDN), Vercel (hospedagem da aplicação)
- **Equipe comercial PlugFácil**: para retornar seu contato após geração do Business Plan
- **Autoridades**: mediante ordem judicial ou exigência legal

Não vendemos seus dados.

## 5. Análise por inteligência artificial

Suas fotos são processadas pela Anthropic (Claude) para gerar análise técnica do espaço e do padrão elétrico. A Anthropic não usa essas imagens para treinar seus modelos (conforme política de uso da API Anthropic). Após 24 meses, as imagens são anonimizadas (rosto/placa/identificadores removidos) ou excluídas.

**Importante**: a análise gerada por IA é uma estimativa preliminar. NÃO substitui projeto elétrico assinado por engenheiro responsável (ART). A PlugFácil oferece esse serviço separadamente.

## 6. Quanto tempo guardamos

| Tipo | Prazo |
|------|-------|
| Conta ativa | Enquanto você não solicitar exclusão |
| Notas fiscais e dados fiscais | 5 anos (obrigação legal) |
| Fotos de vaga e padrão | 24 meses, depois anonimizadas ou excluídas |
| Dados de navegação | 12 meses |
| Conta excluída | 30 dias para reativação, depois excluída permanentemente |

## 7. Seus direitos

Você tem direito a, a qualquer momento:
- Saber quais dados temos sobre você
- Pedir cópia (portabilidade)
- Corrigir dados incorretos
- Pedir exclusão
- Revogar consentimentos
- Reclamar à ANPD (gov.br/anpd)

Para exercer: acesse `/conta/privacidade` quando logado, ou escreva para dpo@plugfacil.com.br.

## 8. Segurança

- Conexões TLS 1.3
- Senhas armazenadas com hash bcrypt
- Storage de fotos privado com links assinados de curta duração
- Acesso a dados restrito por papel (RLS no banco)
- Logs de acesso a dados sensíveis
- Backup criptografado diário

Notificamos você em até 72 horas em caso de incidente que afete seus dados.

## 9. Cookies

Usamos cookies essenciais (sessão), analíticos (PostHog, opt-out disponível) e de marketing (Meta Pixel, Google Ads — requerem consentimento).

Você gerencia em `/conta/privacidade` ou pelo banner inicial.

## 10. Alterações

Pequenas mudanças: avisamos no site. Mudanças relevantes: avisamos por email com 30 dias de antecedência.

## 11. Contato
- Dúvidas gerais: contato@plugfacil.com.br
- LGPD/dados: dpo@plugfacil.com.br
- ANPD: gov.br/anpd
```

---

## 5. Termos de Uso — Template

> Texto-base. Salvar em `apps/web/src/app/(marketing)/termos/page.tsx`.

```markdown
# Termos de Uso — PlugFácil

**Última atualização: [data]**

Estes Termos regem o uso da plataforma PlugFácil (plugfacil.com.br) e dos produtos digitais ofertados ("PDF Mercado de Eletromobilidade" e "Business Plan com IA").

Ao usar a plataforma, você concorda com estes Termos e com a Política de Privacidade.

## 1. Quem pode usar
- Pessoas físicas maiores de 18 anos
- Pessoas jurídicas regularmente constituídas
- Não permitimos uso por menores ou em nome de terceiros sem autorização

## 2. Produtos

### 2.1 PDF Mercado de Eletromobilidade (R$ 49,90)
- Material educacional em formato digital
- Entrega imediata após confirmação do pagamento
- Você recebe atualizações por 12 meses (eventuais novas versões)
- Uso pessoal — proibida revenda ou redistribuição
- Direitos autorais pertencem à PlugFácil

### 2.2 Business Plan com IA (R$ 290)
- Análise personalizada gerada com base em dados que você fornece
- Tempo de processamento: até 24 horas
- Entrega em PDF + acesso à plataforma para revisão
- **A análise é uma estimativa, gerada por IA, baseada em dados públicos e nas informações que você fornece. NÃO substitui projeto elétrico assinado por engenheiro, parecer técnico de viabilidade, parecer da distribuidora ou consultoria personalizada presencial. A PlugFácil pode contratar separadamente os serviços de engenharia caso o cliente deseje aprofundar o estudo.**
- Você é responsável pela veracidade das informações fornecidas

## 3. Pagamento e reembolso

- Pagamentos processados via Stripe
- Aceitamos cartão de crédito, débito e Pix
- Política de reembolso:
  - **PDF**: reembolso em até 7 dias do pagamento (direito de arrependimento — Art. 49 CDC)
  - **Business Plan**: reembolso em até 7 dias **se o BP ainda não foi gerado**. Após geração, reembolso apenas em caso de erro grave atribuível à PlugFácil (avaliado caso a caso)

## 4. Uso aceitável

Proibido:
- Compartilhar conta com terceiros
- Tentar burlar pagamento
- Acessar áreas restritas sem autorização
- Realizar engenharia reversa, web scraping ou bot de scraping
- Inserir informações falsas ou ofensivas
- Submeter fotos que não sejam suas ou que contenham conteúdo ilícito

A PlugFácil pode suspender ou cancelar contas que violem estes termos.

## 5. Limitação de responsabilidade

- A PlugFácil não garante que as projeções financeiras do Business Plan se concretizem
- Variações de tarifa, regulação, mercado e operação podem alterar significativamente os resultados reais
- Recomendamos validação por profissional habilitado antes de qualquer investimento
- A PlugFácil não se responsabiliza por decisões de investimento tomadas com base exclusivamente no material

## 6. Propriedade intelectual

- Marca, identidade visual, conteúdo do PDF, estrutura do Business Plan e código da plataforma pertencem à PlugFácil
- Você mantém propriedade sobre suas fotos e dados, mas nos concede licença não-exclusiva para usá-los na geração do BP

## 7. Comunicação com nosso comercial

Ao gerar um Business Plan, você concorda em ser contatado por nossa equipe comercial em até 10 dias úteis, por email, telefone ou WhatsApp, para apresentar opções de parceria. Você pode optar por não receber esse contato em `/conta/privacidade`.

## 8. Foro

Foro da comarca de São José dos Campos/SP, exceto quando o consumidor optar por foro de seu domicílio (CDC).

## 9. Contato
- contato@plugfacil.com.br
- WhatsApp: [a preencher]
```

---

## 6. Checklist de compliance antes de produção

- [ ] Política de Privacidade publicada em `/privacidade`
- [ ] Termos de Uso publicados em `/termos`
- [ ] Banner de cookies (essenciais sempre on; analytics e marketing opt-in)
- [ ] Checkbox de consentimento no envio do BP, com link para Política
- [ ] Checkbox de consentimento separado para "aceito ser contatado por comercial"
- [ ] Endpoint `/api/me/data` funcional
- [ ] Endpoint `/api/me/delete` funcional
- [ ] Página `/conta/privacidade` com toggles por categoria
- [ ] Storage de fotos privado (RLS Supabase) + signed URLs com TTL ≤ 1h
- [ ] Logs de acesso a dados sensíveis em `events` (tipo `data_accessed`)
- [ ] Encarregado (DPO) definido e email funcional
- [ ] Procedimento documentado para responder solicitações de titulares em 15 dias
- [ ] Plano de resposta a incidente (notificar ANPD e titulares em 72h)
- [ ] Revisão jurídica final dos textos
- [ ] Treinamento da equipe comercial sobre o que NÃO pode ser dito a leads

---

## 7. O que NÃO fazer (riscos comuns)

- ❌ Pedir consentimento "geral" em uma única caixinha — precisa ser granular por finalidade
- ❌ Pré-marcar checkbox de marketing
- ❌ Manter fotos no Storage público mesmo "por engano"
- ❌ Compartilhar foto do padrão elétrico em grupo de WhatsApp da equipe
- ❌ Reaproveitar fotos do cliente A para ilustrar marketing genérico
- ❌ Demorar mais de 15 dias para responder solicitação de exclusão
- ❌ Cobrar pelo exercício de direito do titular
- ❌ Treinar modelo próprio com fotos dos clientes (Anthropic não treina; nossa política também não)
