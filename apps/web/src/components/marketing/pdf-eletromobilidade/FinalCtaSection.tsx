import { PurchaseCard } from "./PurchaseCard";

export function FinalCtaSection() {
  return (
    <section className="bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] py-20">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Entenda o mercado antes de decidir qualquer coisa
        </h2>
        <p className="text-green-100 mb-10">
          40 páginas com os números reais do mercado de eletromobilidade no Brasil. BYD, GM, governo
          injetando R$ 31 bilhões: quem entender as regras agora captura o ciclo.
        </p>
        <div className="max-w-md mx-auto">
          <PurchaseCard />
        </div>
      </div>
    </section>
  );
}
