import type { Metadata } from "next";
import { PadraoAnalyzer } from "@/components/marketing/vision/PadraoAnalyzer";

export const metadata: Metadata = {
  title: "Análise do Padrão Elétrico — PlugFácil",
  description: "Envie uma foto do seu quadro elétrico e descubra se o local suporta um eletroposto.",
};

export default function AnalisePadraoPage() {
  return <PadraoAnalyzer />;
}
