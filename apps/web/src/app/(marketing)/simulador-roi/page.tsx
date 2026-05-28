import type { Metadata } from "next";
import { RoiSimulator } from "@/components/marketing/roi/RoiSimulator";

export const metadata: Metadata = {
  title: "Simulador de Rendimento — PlugFácil",
  description: "Calcule quanto rende um eletroposto PlugFácil comparado ao CDI e CDB.",
};

export default function SimuladorPage() {
  return <RoiSimulator />;
}
