# 10 — Conteúdo do PDF Produto 1

> O PDF é estático no MVP. Gerado por Claude usando a skill `docx` (output em `.pdf` via Pandoc ou react-pdf). Conteúdo abaixo é o **briefing completo** para o Claude Code gerar o arquivo.

---

## Especificação do entregável

- **Formato**: PDF, paisagem ou retrato (preferência retrato A4)
- **Páginas**: 40-55 (corpo) + 5-10 (anexos)
- **Fonte**: Inter ou Source Sans 3 (sans-serif, 11pt corpo, 10pt notas)
- **Espaçamento**: 1.4 linha
- **Cores**: paleta PlugFácil (verde primário, cinza neutro, vermelho para alertas)
- **Marca**: logo no rodapé de toda página, cabeçalho com capítulo corrente
- **Arquivo final**: `apps/web/public/produtos/pdf-mercado-v1.pdf` (≤ 8MB)

---

## Estrutura final do PDF (40-55 páginas)

### Capa (página 1)
- Título: **"O Mercado Brasileiro de Eletromobilidade — Guia para Investidores 2026"**
- Subtítulo: "Como entender o setor, dimensionar o investimento e capturar margem antes da próxima onda"
- Logo PlugFácil
- Versão e data: "Edição 2026.1 — Maio/2026"

### Sumário (página 2)
- Lista numerada de capítulos com numeração de página

### Introdução (página 3-4)
- Por que agora — janela de mercado de 18-36 meses
  - Citar adoção crescente de VE no Brasil
  - Gargalo atual: infraestrutura de recarga (oferta < demanda)
- O que esperar deste material
  - Não é manual de instalação; é guia de investidor
  - Foca em decisão de capital, não em engenharia
- Quem somos
  - PlugFácil — operadora especializada em eletropostos
  - Parcerias estratégicas: WEG (equipamento) + TUPI (roaming)
  - Atuação Vale do Paraíba/SP e expansão para SP/MG/RJ

### Capítulo 1 — Panorama do mercado (5-8 páginas)

**Sub-tópicos:**
- Frota EV no Brasil: histórico 2018-2025 e projeção até 2030
- Comparativo regional (concentração SP > MG > RJ > demais)
- BEV vs PHEV vs HEV — o que cada um significa pro investidor de recarga
  - BEV (100% elétrico) → cliente de DC, alto kWh por sessão
  - PHEV → cliente AC residencial principalmente
  - HEV → não usa carregador externo
- Tamanho do mercado de recarga (mercado atual e projetado)
- Densidade de carregadores por região
- Fontes a citar (com data): ABVE, EPE/MME, Anfavea, BloombergNEF, BNDES, MCTI

**Disclaimer ao final**: "Dados sujeitos a revisão. Última atualização desta seção: [data]."

### Capítulo 2 — Tipos de carregadores e infraestrutura (6-8 páginas)

- AC vs DC — diferenças técnicas e de uso
  - AC: corrente alternada, conversão no veículo, mais barato, mais lento
  - DC: corrente contínua, conversão no carregador, mais caro, rápido
- Potências comerciais e tempo típico de recarga
  - 7,4 kW AC monofásico: residencial e condomínio
  - 11 / 22 kW AC trifásico: comercial leve
  - 30 kW DC: comércio e estacionamento
  - 40 kW DC: posto urbano, hotel, shopping
  - 80 kW DC: rodovia, posto premium
  - 150+ kW DC: HPC (High Power Charging) — não foco deste material
- Conectores: Type 2 (Mennekes — padrão BR para AC), CCS2 (padrão DC), GB/T (China — raro no BR), CHAdeMO (obsolescência)
- Padrão de entrada elétrico do imóvel: o que importa
  - Potência disponível (kVA)
  - Tipo (monofásico vs bifásico vs trifásico)
  - Distância do quadro ao ponto de carregamento
- Bitola de cabo, disjuntor, aterramento (NBR 5410, 14039, 17019)
- Diagrama unifilar simplificado (figura)

**Box de alerta**: "Projeto elétrico deve ser assinado por engenheiro responsável (ART obrigatória). Esta seção é informativa."

### Capítulo 3 — Funcionamento do setor (5-7 páginas)

- Cadeia de valor:
  - Fabricante (WEG, ABB, Tritium) → Integrador → Operador (CPO) → Host (espaço) → Motorista
- Plataformas de roaming (TUPI, EVgo, ABRP)
  - Como roaming amplia alcance e receita
- Modelos de cobrança
  - R$/kWh (mais comum)
  - Por sessão (raro)
  - Por tempo (em pontos públicos)
  - Assinatura mensal (premium)
- Mercado de "MaaS" e gestão remota (visão de futuro)
- Como o PlugFácil se posiciona
  - Operador (CPO) com modelos de franquia, parceria e cessão
  - Roaming via TUPI
  - Equipamento WEG

### Capítulo 4 — Modelos de negócio (5-7 páginas)

- Investidor 100% (host paga, opera, fica com margem) → barreira de entrada
- Franquia turn-key (PlugFácil model) → investidor com baixo trabalho operacional
- Cessão (host cede espaço, operador investe e divide receita) → host com zero CAPEX
- Revenue share — fixo ou variável
- Comparativo financeiro de cada modelo (**tabela**)
  - Colunas: CAPEX inicial, OPEX mensal, % receita, payback estimado, perfil de risco

**Tabela 4.1: Comparativo de modelos**

| Modelo | CAPEX inicial | OPEX mensal | % receita do host | Perfil |
|--------|---------------|-------------|---------------------|--------|
| Investidor 100% | R$ 25k-150k | 8-12% receita | 100% líquido | Maior risco, maior margem |
| Franquia turn-key | R$ 23k-160k | gerido pela franqueadora | revenue share contratual | Risco intermediário |
| Cessão comercial | R$ 0 | R$ 0 | % a definir | Baixo risco, sem operação |
| Cessão residencial | R$ 0 | R$ 0 (reembolso garantido) | reembolso de energia | Conveniência do morador |

### Capítulo 5 — Custo de energia e margem (5-7 páginas)

- Estrutura de tarifa no Brasil
  - TE (Tarifa de Energia)
  - TUSD (Tarifa de Uso do Sistema de Distribuição)
  - Bandeira (verde, amarela, vermelha 1, vermelha 2)
  - Tributos (ICMS, PIS, COFINS)
- Cativo vs mercado livre
  - Cativo: maioria dos imóveis comerciais
  - Mercado livre: consumo ≥ 500 MWh/ano (Lei 14.300 ampliando)
- Solar fotovoltaico como hedge
  - Compensação 1:1 até Lei 14.300 (transição até 2029)
  - Dimensionamento típico: 1 kWp gera ~120-150 kWh/mês no BR
- Exemplo numérico passo-a-passo
  - Premissa: 1 carregador DC 40 kW, 4 sessões/dia, 30 kWh/sessão
  - Receita: 4 × 30 × R$ 1,80 = R$ 216/dia → R$ 6.480/mês
  - Custo energia (B3 R$ 0,75/kWh): R$ 2.700/mês
  - Demais custos (plataforma, internet, manutenção): R$ 320/mês
  - **Margem operacional: R$ 3.460/mês**
- Tabela de margem por tipo de instalação (**Tabela 5.1**)

### Capítulo 6 — Estudo de caso (4-6 páginas)

3 estudos simulados, cada um em 1-2 páginas:

**Estudo 1: Condomínio residencial 100 unidades**
- Setup: 2× AC 7 kW para vagas comuns
- CAPEX: ~R$ 28k (equipamento + obra)
- Receita projetada: R$ 1.800/mês
- Payback: 18-24 meses
- Riscos: ocupação variável, conflito com regulamento interno

**Estudo 2: Posto de combustível em rodovia**
- Setup: 1× DC 80 kW + 2× AC 22 kW
- CAPEX: ~R$ 180k
- Receita projetada: R$ 22.000/mês
- Payback: 12-18 meses
- Riscos: concorrência (Eletropostos próximos), perfil de tráfego

**Estudo 3: Shopping center médio**
- Setup: 4× AC 22 kW + 1× DC 30 kW
- CAPEX: ~R$ 145k
- Receita projetada: R$ 16.500/mês
- Payback: 14-20 meses
- Riscos: contrato com shopping, taxa de ocupação fim de semana vs dia útil

**Cada estudo**: bloco com CAPEX, receita, payback, IRR, riscos, sinais de validação.

### Capítulo 7 — Regulação e ART (3-5 páginas)

- ART do CREA — quando obrigatório (resposta: sempre, para qualquer instalação elétrica de eletroposto)
- Lei das Franquias (13.966/2019) — se aplica ao modelo de franquia PlugFácil
- Resolução ANEEL 482/2012 e atualizações (geração distribuída)
- Lei 14.300/2022 (taxação da geração distribuída — fim do net metering 1:1)
- LGPD para dados de motoristas (CPF, placa, app)
- Bombeiros e licenças municipais (varia por município)
- Resolução ANEEL 1.000/2021 (deveres das distribuidoras)

**Box jurídico**: "Este capítulo é informativo. Consulte advogado e engenheiro antes de cada operação."

### Capítulo 8 — Próximos passos (2 páginas)

- Checklist de 12 itens para validar um local:
  1. Padrão elétrico disponível ≥ potência desejada?
  2. Distância quadro → ponto de carregamento ≤ 30m?
  3. Vaga acessível para veículo elétrico (largura, cobertura)?
  4. Visibilidade do ponto para o motorista?
  5. Comportamento do tráfego (fluxo passante vs cativo)?
  6. Concorrência próxima (carregadores em raio de 5km)?
  7. Densidade EV na região?
  8. Tarifa de energia local?
  9. Possibilidade de solar fotovoltaico?
  10. Contrato com host (cessão, locação, sociedade)?
  11. Licenças municipais aplicáveis?
  12. Plano de manutenção e suporte 24/7?
- O que fazer com o que aprendeu — recomendação prática
- Como o BP Personalizado PlugFácil acelera essa análise
- **CTA discreto**: "Gere seu Business Plan customizado em https://plugfacil.com.br/plano-de-negocio"

### Anexos (5-10 páginas)

- **Anexo A: Glossário** (40 termos)
  - AC, DC, BEV, PHEV, HEV, CCS2, Type 2, GB/T, CPO, MaaS, ART, kVA, kWh, IRR, NPV, CAPEX, OPEX, TE, TUSD, etc.
- **Anexo B: Tabela de potências e tempos de carga típicos**
  - Linha: potência. Coluna: capacidade da bateria. Célula: tempo
- **Anexo C: Lista de distribuidoras e tarifas médias B3**
  - Top 20 distribuidoras + tarifa B3 média (referência ANEEL)
- **Anexo D: Fontes citadas**
  - ABVE, EPE, MME, Anfavea, BNDES, BloombergNEF, ANEEL, INMET, NASA POWER
- **Anexo E: Disclaimer técnico e jurídico**
  - Texto longo padrão (próxima seção)

---

## Diretrizes de tom e estilo

- **Português brasileiro**
- Linguagem técnica mas acessível (leitor padrão: 15+ anos de bagagem profissional, não necessariamente engenheiro)
- **Sem clichês**: "alavancar", "sinergia", "disruptivo", "ecossistema", "mindset", "game changer", "unicórnio", "robusto", "ponta-a-ponta"
- Tabelas e gráficos sempre numerados (Tabela 1, Figura 1, etc) com legendas claras
- Citações com fonte e ano: "Segundo a ABVE (2025), ..."
- Disclaimers ao final de cada capítulo técnico: "Os números são estimativas baseadas em [fonte]; resultados reais variam conforme [variáveis]."
- Evitar primeira pessoa do plural ("nós", "nosso") fora do contexto institucional
- Frases curtas. Parágrafos com 3-5 frases. Idéia única por parágrafo
- Sem emojis no corpo (apenas em CTAs, opcional)
- Bullets devem ter pelo menos uma frase completa, não apenas uma palavra

---

## Disclaimer padrão (Anexo E)

```
Este material foi produzido pela PlugFácil Mobilidade Elétrica Ltda. com base
em dados públicos disponíveis em [data]. Embora tenhamos buscado precisão,
o setor de mobilidade elétrica evolui rapidamente e algumas informações podem
estar desatualizadas no momento da leitura.

Os estudos de caso, projeções financeiras e exemplos numéricos são ilustrativos.
Resultados reais dependem de variáveis específicas de cada projeto — localização,
perfil de uso, tarifa de energia, custos de instalação, capacidade do padrão
elétrico, regulação local, entre outros.

ESTE MATERIAL NÃO SUBSTITUI:
- Projeto elétrico assinado por engenheiro com ART
- Parecer técnico de viabilidade de conexão da distribuidora
- Consultoria contábil ou tributária personalizada
- Análise jurídica do contrato específico
- Estudo de mercado local detalhado

Decisões de investimento devem ser tomadas com base em assessoramento profissional
específico. A PlugFácil não se responsabiliza por decisões tomadas exclusivamente
com base neste material.

© 2026 PlugFácil Mobilidade Elétrica Ltda. Todos os direitos reservados.
Uso pessoal autorizado. Proibida revenda ou redistribuição.
```

---

## Como o Claude Code deve gerar

**Sprint 1, tarefa 8:**

1. Ler todo o conteúdo deste arquivo
2. Ler `/mnt/skills/public/docx/SKILL.md` para usar a skill corretamente
3. Gerar o documento em `.docx` (com tabelas, formatação, índice automático)
4. Converter para PDF via LibreOffice headless ou Pandoc
5. Salvar em `apps/web/public/produtos/pdf-mercado-v1.pdf`
6. Versionar — toda atualização incrementa o nome (`v2.pdf`, etc) e atualiza referência em `purchases.metadata.pdf_version`
7. Após geração, validar:
   - PDF abre sem erro em Chrome, Firefox, mobile (iOS/Android)
   - Tamanho ≤ 8 MB
   - Texto pesquisável (não imagem rasterizada)
   - Links clicáveis no PDF (CTA final)

**Comando de validação rápida:**
```bash
pdfinfo apps/web/public/produtos/pdf-mercado-v1.pdf
# Verificar: Pages, File size, encrypted: no, optimized: yes
```

---

## Atualização posterior

Toda republicação do PDF (atualização de dados, novo capítulo) cria nova versão. Clientes que compraram nos últimos 12 meses têm direito a receber atualizações automaticamente, via email gerado pela Inngest:

- Trigger: novo arquivo `pdf-mercado-vN.pdf` adicionado
- Função `inngest/jobs/notify-pdf-update.ts`
  - Lista todos os `purchases` com `product = 'pdf'` e `created_at > now() - 365 days`
  - Envia email com link novo + changelog do que mudou
  - Atualiza `purchases.metadata.pdf_version` para o cliente que clicar

Essa política deve constar nos Termos de Uso (`07_lgpd.md` cláusula 2.1).

---

## Versionamento

| Versão | Data | Mudanças |
|--------|------|----------|
| v1 | 2026-05 | Versão inicial (lançamento MVP) |

Manter este histórico no próprio PDF (página 2 ou contracapa) e neste arquivo `.md`.
