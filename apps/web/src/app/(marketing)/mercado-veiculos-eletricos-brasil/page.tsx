import { AudienceSection } from "@/components/marketing/pdf-eletromobilidade/AudienceSection";
import { ContentSection } from "@/components/marketing/pdf-eletromobilidade/ContentSection";
import { FaqSection } from "@/components/marketing/pdf-eletromobilidade/FaqSection";
import { FinalCtaSection } from "@/components/marketing/pdf-eletromobilidade/FinalCtaSection";
import { HeroSection } from "@/components/marketing/pdf-eletromobilidade/HeroSection";
import { KpiStrip } from "@/components/marketing/pdf-eletromobilidade/KpiStrip";
import { LpFooter } from "@/components/marketing/pdf-eletromobilidade/LpFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Mercado de Eletropostos no Brasil ${new Date().getFullYear()} — Relatório PlugFácil`,
  description:
    "1 carregador para cada 63 carros no Brasil. Entenda os dados reais do mercado de recarga: modelos de negócio, custos, regulação e oportunidades. 40 páginas, R$ 49,90.",
  openGraph: {
    title: "Mercado de Eletropostos no Brasil — Relatório PlugFácil",
    description:
      "Os dados reais do mercado de recarga de veículos elétricos no Brasil. Produzido por quem opera eletropostos.",
    type: "website",
  },
};

export default function PdfEletromobilidadePage() {
  return (
    <main>
      <HeroSection />
      <KpiStrip />
      <ContentSection />
      <AudienceSection />
      <FaqSection />
      <FinalCtaSection />
      <LpFooter />
    </main>
  );
}
